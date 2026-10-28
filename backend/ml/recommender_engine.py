"""
DSAForge Recommendation Engine
Integrates User Profiler and Curriculum-Adaptive ML Ranker to deliver
personalized, growth-oriented DSA problem recommendations with explainable reasons.
"""

import json
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

# Add directories to sys.path so it works from anywhere
_current_dir = Path(__file__).resolve().parent
_backend_dir = _current_dir.parent
_root_dir = _backend_dir.parent
for _p in [str(_root_dir), str(_backend_dir), str(_current_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

import lightgbm as lgb
import numpy as np

try:
    from backend.ml.curriculum_model import extract_features
    from backend.ml.user_profiler import (
        UserProfile,
        classify_difficulty,
        load_user_profile_from_db,
    )
except ImportError:
    from ml.curriculum_model import extract_features
    from ml.user_profiler import (
        UserProfile,
        classify_difficulty,
        load_user_profile_from_db,
    )

ML_DIR = Path(__file__).resolve().parent
DB_PATH = ML_DIR / "feature_preparation.db"
MODEL_PATH = ML_DIR / "models" / "dsaforge_curriculum_ranker.txt"
FEATURES_PATH = ML_DIR / "models" / "curriculum_feature_columns.json"


class RecommenderEngine:
    def __init__(self, db_path=DB_PATH, model_path=MODEL_PATH, features_path=FEATURES_PATH):
        self.db_path = Path(db_path)
        self.model_path = Path(model_path)
        self.features_path = Path(features_path)

        if not self.model_path.exists():
            raise FileNotFoundError(f"Trained model not found at {self.model_path}. Train it first.")

        # Load LightGBM booster
        self.booster = lgb.Booster(model_file=str(self.model_path))

        with open(self.features_path, "r", encoding="utf-8") as f:
            self.feature_names = json.load(f)

        self._load_catalogue()

    def _load_catalogue(self):
      """Preload the multi-platform problem catalogue into memory."""
      self.catalogue = {}
      with sqlite3.connect(self.db_path) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Check if unified catalog exists, else fallback to codeforces
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND"
            " name='unified_problem_catalog'"
        )
        has_unified = cur.fetchone() is not None

        if has_unified:
          cur.execute("""
                    SELECT problem_id, platform, title, rating, difficulty, tags, url
                    FROM unified_problem_catalog
                    WHERE rating IS NOT NULL
                """)
          for row in cur.fetchall():
            try:
              tags = json.loads(row["tags"])
            except Exception:
              tags = [row["topic"]] if "topic" in row.keys() else ["general"]

            pid = row["problem_id"]
            self.catalogue[pid] = {
                "problem_id": pid,
                "platform": row["platform"],
                "title": row["title"],
                "rating": float(row["rating"]),
                "difficulty": row["difficulty"]
                or classify_difficulty(row["rating"]),
                "tags": tags,
                "url": row["url"],
            }
        else:
          # Fallback to existing Codeforces table
          cur.execute("""
                    SELECT problem_id, contest_id, problem_index, problem_name, problem_rating, tags
                    FROM codeforces_api_problems
                    WHERE problem_rating IS NOT NULL AND tags IS NOT NULL
                """)
          for row in cur.fetchall():
            try:
              tags = json.loads(row["tags"])
            except Exception:
              tags = []
            pid = row["problem_id"]
            cid = row["contest_id"]
            idx = row["problem_index"]
            url = (
                f"https://codeforces.com/problemset/problem/{cid}/{idx}"
                if cid and idx
                else f"https://codeforces.com/problemset/problem/{pid}"
            )
            self.catalogue[pid] = {
                "problem_id": pid,
                "platform": "Codeforces",
                "title": row["problem_name"],
                "rating": float(row["problem_rating"]),
                "difficulty": classify_difficulty(row["problem_rating"]),
                "tags": tags,
                "url": url,
            }

      print(f"Loaded {len(self.catalogue)} problems into catalogue.")

    def generate_explanation(self, profile, problem):
        """Generates clear, pedagogical feedback explaining why this problem was chosen."""
        tags = problem["tags"]
        rating = problem["rating"]
        diff = problem["difficulty"]

        mastered = profile.get_mastered_topics()
        struggling = profile.get_weak_or_struggling_topics()
        frontiers = [f["topic"] for f in profile.get_next_frontier_topics()[:6]]

        # Find key tag
        struggle_tag = next((t for t in tags if t in struggling), None)
        frontier_tag = next((t for t in tags if t in frontiers), None)
        mastered_repr = ", ".join(mastered[:2]) if mastered else "basic topics"

        if struggle_tag:
            wrong_count = profile.topic_stats[struggle_tag]["wrong"]
            return (
                f"Targeted Remediation: You had {wrong_count} wrong attempts in '{struggle_tag}'. "
                f"This {diff} problem ({int(rating)} rating) strengthens your fundamentals without overwhelming you."
            )

        if frontier_tag:
            if mastered:
                return (
                    f"Curriculum Progression: You have mastered {mastered_repr}! Instead of repeating "
                    f"more of the same, DSAForge recommends advancing to '{frontier_tag}' to broaden your skillset."
                )
            else:
                return (
                    f"Skill Expansion: Expand your core repertoire with '{frontier_tag}' at {int(rating)} rating, "
                    f"matched to your target skill progression."
                )

        # General growth problem
        return (
            f"Balanced Growth: Matched to your current target rating ({int(profile.target_rating)}), "
            f"providing steady practice in {', '.join(tags[:2])}."
        )

    def recommend_for_user(self, user_handle, top_n=10, filter_difficulty=None):
        """
        Takes a user handle, analyzes history, scores candidate problems, and returns top-K recommendations.
        """
        profile = load_user_profile_from_db(self.db_path, user_handle)
        return self.recommend_for_profile(profile, top_n=top_n, filter_difficulty=filter_difficulty)

    def recommend_for_profile(self, profile, top_n=10, filter_difficulty=None):
        """
        Generates recommendations for an already analyzed UserProfile.
        """
        # Filter candidate pool: unsolved and within reasonable rating range
        candidates = []
        solved_titles = {s.strip().lower() for s in profile.solved_problems if isinstance(s, str)}
        for pid, prob in self.catalogue.items()  or prob["title"].strip().lower() in solved_titles:
            if pid in profile.attempted_problems:
                continue

            if filter_difficulty and prob["difficulty"].lower() != filter_difficulty.lower():
                continue

            # Keep problems within +/- 450 rating of target
            if abs(prob["rating"] - profile.target_rating) <= 450:
                candidates.append(prob)

        if not candidates:
            # Fallback if range was too strict
            candidates = [p for pid, p in self.catalogue.items() if pid not in profile.attempted_problems][:100]

        # Extract features for all candidates
        feature_rows = []
        for prob in candidates:
            feat = extract_features(profile, prob)
            row = [feat[col] for col in self.feature_names]
            feature_rows.append(row)

        X = np.array(feature_rows)

        # Predict ML ranking scores
        scores = self.booster.predict(X)

        # Attach scores to candidates
        scored_candidates = []
        for prob, score in zip(candidates, scores):
            scored_candidates.append({
                **prob,
                "ml_score": float(score),
            })

        # Sort by ML score descending
        scored_candidates.sort(key=lambda x: x["ml_score"], reverse=True)

        # Diversification filter: avoid consecutive recommendations having the exact same tag
        final_recommendations = []
        seen_primary_tags = defaultdict(int)

        mastered_topics = set(t.lower() for t in profile.get_mastered_topics())

        for prob in scored_candidates:
            primary_tag = prob["tags"][0].lower() if prob["tags"] else "general"

            # Strictly prioritize non-mastered topics if available
            if primary_tag in mastered_topics and len(final_recommendations) < top_n:
                # Check if there are other candidates with non-mastered topics
                has_alternative = any(
                    (p["tags"][0].lower() not in mastered_topics if p["tags"] else False)
                    for p in scored_candidates
                    if p["problem_id"] not in [r["id"] for r in final_recommendations]
                )
                if has_alternative:
                    continue

            # Cap same primary tag at 2 in top 10 to ensure topic variety
            if seen_primary_tags[primary_tag] >= 2 and len(final_recommendations) < top_n - 2:
                continue

            seen_primary_tags[primary_tag] += 1
            reason = self.generate_explanation(profile, prob)

            final_recommendations.append({
                "id": prob["problem_id"],
                "platform": prob.get("platform", "Codeforces"),
                "title": prob["title"],
                "rating": int(prob["rating"]),
                "difficulty": prob["difficulty"],
                "topic": prob["tags"][0].title() if prob["tags"] else "General",
                "pattern": ", ".join(prob["tags"][:3]).title(),
                "url": prob["url"],
                "ml_score": round(prob["ml_score"], 4),
                "reason": reason,
            })

            if len(final_recommendations) >= top_n:
                break

        return {
            "user": profile.user_handle,
            "total_solved": profile.total_solved,
            "skill_rating": int(profile.median_rating),
            "target_rating": int(profile.target_rating),
            "mastered_topics": profile.get_mastered_topics(),
            "struggling_topics": profile.get_weak_or_struggling_topics(),
            "next_frontier_topics": [f["topic"] for f in profile.get_next_frontier_topics()[:5]],
            "recommendations": final_recommendations,
        }


if __name__ == "__main__":
    engine = RecommenderEngine()
    test_user = "user1"
    res = engine.recommend_for_user(test_user, top_n=8)

    print(f"\n================ RECOMMENDATIONS FOR {res['user']} ================")
    print(f"Skill Rating: {res['skill_rating']} | Target: {res['target_rating']}")
    print(f"Mastered Topics: {', '.join(res['mastered_topics']) or 'None'}")
    print(f"Struggling Topics: {', '.join(res['struggling_topics']) or 'None'}")
    print(f"Next Frontier: {', '.join(res['next_frontier_topics'])}")
    print("\n--- Top Recommendations ---")
    for i, r in enumerate(res["recommendations"], 1):
        print(f"\n{i}. [{r['difficulty']} - {r['rating']}] {r['title']} ({r['id']})")
        print(f"   Topic: {r['topic']} | Tags: {r['pattern']}")
        print(f"   URL: {r['url']}")
        print(f"   Reason: {r['reason']}")
