"""
DSAForge Curriculum-Adaptive ML Recommender
Trains a machine learning model that analyzes user history, identifies mastered vs.
frontier topics, and recommends the next best problem for learning efficiency.
Prevents repetition of mastered topics (e.g. Arrays) and drives balanced progression.
"""

import json
import sqlite3
import sys
from collections import defaultdict
from math import log2
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
import pandas as pd
from sklearn.model_selection import train_test_split

try:
    from backend.ml.user_profiler import (
        CURRICULUM_ROADMAP,
        PREREQUISITES,
        UserProfile,
        classify_difficulty,
    )
except ImportError:
    from ml.user_profiler import (
        CURRICULUM_ROADMAP,
        PREREQUISITES,
        UserProfile,
        classify_difficulty,
    )

ML_DIR = Path(__file__).resolve().parent
DB_PATH = ML_DIR / "feature_preparation.db"
MODEL_DIR = ML_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "dsaforge_curriculum_ranker.txt"
FEATURES_PATH = MODEL_DIR / "curriculum_feature_columns.json"

FEATURE_NAMES = [
    "problem_rating",
    "user_median_rating",
    "rating_gap",
    "abs_rating_gap",
    "topic_max_mastery",
    "topic_mean_mastery",
    "topic_is_mastered",
    "topic_solved_count",
    "topic_saturation_penalty",
    "is_frontier_topic",
    "is_struggling_topic",
    "prereqs_met",
    "difficulty_tier_match",
    "problem_tag_count",
]


def load_candidate_catalogue(conn):
    """Load all official problems with ratings and tags."""
    cur = conn.cursor()
    cur.execute("""
        SELECT problem_id, problem_name, problem_rating, tags
        FROM codeforces_api_problems
        WHERE problem_rating IS NOT NULL
          AND tags IS NOT NULL
          AND TRIM(tags) != ''
    """)
    catalogue = {}
    for pid, name, rating, tags_raw in cur.fetchall():
        try:
            tags = json.loads(tags_raw)
        except Exception:
            tags = []
        if tags and rating:
            catalogue[pid] = {
                "problem_id": pid,
                "name": name,
                "rating": float(rating),
                "tags": tags,
            }
    return catalogue


def compute_growth_label(profile, problem):
    """
    Computes an educational utility ground-truth label for (user, problem).
    Higher label = better next problem for student learning efficiency.
    Labels:
      0: Mastered / repetitive topic (e.g. solving array #30 at easy/medium when already mastered)
      1: Off-difficulty or low-relevance
      2: Decent practice in competent topic
      3: Targeted practice on struggling topic at appropriate difficulty
      4: Ideal next frontier topic advancing the user's curriculum
    """
    p_rating = problem["rating"]
    tags = problem["tags"]
    median_rating = profile.median_rating

    # 1. Check if all primary tags are already mastered
    mastered_tags = profile.get_mastered_topics()
    all_mastered = tags and all(t in mastered_tags for t in tags)
    if all_mastered:
        # If user has solved easy, med, hard in this topic, repeating it gives 0 growth value
        return 0

    # 2. Check difficulty gap
    abs_gap = abs(p_rating - profile.target_rating)
    if abs_gap > 350:
        return 0  # Far too hard or far too easy

    # 3. Check if struggling topic
    struggling = profile.get_weak_or_struggling_topics()
    is_struggling = any(t in struggling for t in tags)
    if is_struggling and abs_gap <= 150:
        return 3

    # 4. Check if next frontier topic
    frontier_topics = [f["topic"] for f in profile.get_next_frontier_topics()[:8]]
    is_frontier = any(t in frontier_topics for t in tags)
    if is_frontier:
        # New topic entry difficulty should be near or slightly below user's median
        if abs(p_rating - median_rating) <= 150:
            return 4
        elif p_rating < median_rating + 100:
            return 3

    # 5. Competent topic advancing skill
    if abs_gap <= 100:
        return 2

    return 1


def extract_features(profile, problem):
    """Extract feature vector for (user, problem)."""
    p_rating = problem["rating"]
    tags = problem["tags"]
    median_rating = profile.median_rating
    target_rating = profile.target_rating

    masteries = [profile.topic_stats[t]["mastery_score"] for t in tags if t in profile.topic_stats]
    solved_counts = [profile.topic_stats[t]["solved"] for t in tags if t in profile.topic_stats]

    max_mastery = max(masteries) if masteries else 0.0
    mean_mastery = np.mean(masteries) if masteries else 0.0
    total_solved = sum(solved_counts) if solved_counts else 0

    mastered_list = profile.get_mastered_topics()
    is_mastered = 1.0 if (tags and all(t in mastered_list for t in tags)) else 0.0

    # Logarithmic saturation penalty: heavily penalizes topics with many solved problems
    saturation_penalty = log2(1.0 + total_solved)

    frontier_topics = [f["topic"] for f in profile.get_next_frontier_topics()[:8]]
    is_frontier = 1.0 if any(t in frontier_topics for t in tags) else 0.0

    struggling = profile.get_weak_or_struggling_topics()
    is_struggling = 1.0 if any(t in struggling for t in tags) else 0.0

    # Prerequisite readiness
    reqs_met = 1.0
    for t in tags:
        for req in PREREQUISITES.get(t, []):
            if req not in profile.topic_stats or profile.topic_stats[req]["mastery_score"] < 0.4:
                reqs_met = 0.0
                break

    # Tier match: does the problem rating match the topic phase?
    # If new/frontier topic, ideal rating is median_rating - 50 to median_rating + 50
    # If advancing, median_rating to median_rating + 150
    if is_frontier:
        ideal_rating = median_rating
    elif is_struggling:
        ideal_rating = median_rating
    else:
        ideal_rating = target_rating

    tier_match = 1.0 if abs(p_rating - ideal_rating) <= 100 else 0.0

    return {
        "problem_rating": p_rating,
        "user_median_rating": median_rating,
        "rating_gap": p_rating - target_rating,
        "abs_rating_gap": abs(p_rating - target_rating),
        "topic_max_mastery": max_mastery,
        "topic_mean_mastery": mean_mastery,
        "topic_is_mastered": is_mastered,
        "topic_solved_count": float(total_solved),
        "topic_saturation_penalty": saturation_penalty,
        "is_frontier_topic": is_frontier,
        "is_struggling_topic": is_struggling,
        "prereqs_met": reqs_met,
        "difficulty_tier_match": tier_match,
        "problem_tag_count": float(len(tags)),
    }


def build_training_dataset(conn, sample_users=120, candidates_per_user=60):
    """
    Builds training dataset across multiple real users with balanced positive and negative
    pedagogical examples.
    """
    cur = conn.cursor()
    # Fast index-assisted scan on primary key (user, problem)
    cur.execute("""
        SELECT DISTINCT user
        FROM user_problem_features
        LIMIT ?;
    """, (sample_users * 2,))
    candidate_users = [r[0] for r in cur.fetchall()]

    catalogue = load_candidate_catalogue(conn)
    catalogue_list = list(catalogue.values())

    rows = []
    rng = np.random.default_rng(42)

    print(f"Sampling up to {sample_users} active users from {len(candidate_users)} candidates...")
    valid_users_count = 0

    for user_handle in candidate_users:
        if valid_users_count >= sample_users:
            break

        cur.execute("""
            SELECT u.problem, u.accepted, u.wrong_attempts, u.problem_rating, p.tags
            FROM user_problem_features u
            LEFT JOIN codeforces_api_problems p ON u.problem = p.problem_id
            WHERE u.user = ?
        """, (user_handle,))
        history = [dict(r) for r in cur.fetchall()]

        # Filter for users with enough history
        accepted_cnt = sum(1 for r in history if r["accepted"] > 0)
        if accepted_cnt < 15:
            continue

        profile = UserProfile(user_handle)
        profile.analyze(history)

        unsolved_candidates = [
            p for p in catalogue_list
            if p["problem_id"] not in profile.attempted_problems
            and abs(p["rating"] - profile.target_rating) <= 400
        ]

        if len(unsolved_candidates) < 20:
            continue

        # Sample a balanced mix of candidates (frontier, struggling, mastered, random)
        frontier_topics = set(f["topic"] for f in profile.get_next_frontier_topics()[:8])
        mastered_topics = set(profile.get_mastered_topics())

        frontier_pool = [p for p in unsolved_candidates if any(t in frontier_topics for t in p["tags"])]
        frontier_ids = {p["problem_id"] for p in frontier_pool}

        mastered_pool = [p for p in unsolved_candidates if any(t in mastered_topics for t in p["tags"])]
        mastered_ids = {p["problem_id"] for p in mastered_pool}

        general_pool = [p for p in unsolved_candidates if p["problem_id"] not in frontier_ids and p["problem_id"] not in mastered_ids]

        sample_k = min(candidates_per_user, len(unsolved_candidates))
        selected = []

        if frontier_pool:
            chosen_frontier = rng.choice(frontier_pool, size=min(len(frontier_pool), 30), replace=False)
            selected.extend(chosen_frontier)
        if mastered_pool:
            chosen_mastered = rng.choice(mastered_pool, size=min(len(mastered_pool), 20), replace=False)
            selected.extend(chosen_mastered)
        if general_pool:
            rem = sample_k - len(selected)
            if rem > 0:
                chosen_gen = rng.choice(general_pool, size=min(len(general_pool), rem), replace=False)
                selected.extend(chosen_gen)

        for prob in selected:
            feat = extract_features(profile, prob)
            label = compute_growth_label(profile, prob)
            feat["user"] = user_handle
            feat["problem_id"] = prob["problem_id"]
            feat["label"] = label
            rows.append(feat)

        valid_users_count += 1

    df = pd.DataFrame(rows)
    print(f"Total dataset shape: {df.shape}")
    print("Label distribution:")
    print(df["label"].value_counts().sort_index())
    return df


def train_and_save_model():
    """Trains the curriculum LightGBM ranker and evaluates performance."""
    print("Connecting to database:", DB_PATH)
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        df = build_training_dataset(conn, sample_users=80, candidates_per_user=50)

    # User-level split: test users are never seen in training
    users = df["user"].unique()
    train_users, test_users = train_test_split(users, test_size=0.25, random_state=42)

    train_df = df[df["user"].isin(train_users)].sort_values("user", kind="stable").reset_index(drop=True)
    test_df = df[df["user"].isin(test_users)].sort_values("user", kind="stable").reset_index(drop=True)

    X_train = train_df[FEATURE_NAMES]
    y_train = train_df["label"]
    train_groups = train_df.groupby("user", sort=False).size().tolist()

    X_test = test_df[FEATURE_NAMES]
    y_test = test_df["label"]
    test_groups = test_df.groupby("user", sort=False).size().tolist()

    print(f"Training on {len(train_users)} users ({len(train_df)} rows)")
    print(f"Testing on {len(test_users)} users ({len(test_df)} rows)")

    # Train LightGBM Ranker
    ranker = lgb.LGBMRanker(
        objective="lambdarank",
        metric="ndcg",
        eval_at=[5, 10],
        n_estimators=250,
        learning_rate=0.04,
        num_leaves=20,
        min_child_samples=25,
        reg_lambda=1.5,
        random_state=42,
        verbosity=-1,
    )

    ranker.fit(
        X_train,
        y_train,
        group=train_groups,
        eval_set=[(X_test, y_test)],
        eval_group=[test_groups],
    )

    # Evaluate NDCG@10 on test users
    test_df["score"] = ranker.predict(X_test)

    ndcg_list = []
    repetition_rates = []
    frontier_rates = []

    for user, u_df in test_df.groupby("user"):
        u_sorted = u_df.sort_values("score", ascending=False)
        top10 = u_sorted.head(10)

        # NDCG@10
        actual_labels = u_sorted["label"].tolist()
        pred_scores = u_sorted["score"].tolist()
        if len(actual_labels) >= 2 and max(actual_labels) > 0:
            ideal = sorted(actual_labels, reverse=True)
            dcg = sum((2**rel - 1) / log2(idx + 2) for idx, rel in enumerate(top10["label"]))
            idcg = sum((2**rel - 1) / log2(idx + 2) for idx, rel in enumerate(ideal[:10]))
            ndcg_list.append(dcg / idcg if idcg > 0 else 1.0)

        # Saturation rate (percentage of top 10 from already mastered topics)
        rep = top10["topic_is_mastered"].mean()
        repetition_rates.append(rep)

        # Frontier coverage (percentage of top 10 introducing new frontier topics)
        front = top10["is_frontier_topic"].mean()
        frontier_rates.append(front)

    mean_ndcg = np.mean(ndcg_list)
    mean_rep = np.mean(repetition_rates) * 100.0
    mean_frontier = np.mean(frontier_rates) * 100.0

    print("\n================ EVALUATION METRICS ================")
    print(f"Test Users: {len(test_users)}")
    print(f"NDCG@10: {mean_ndcg:.4f}")
    print(f"Mastered Topic Repetition Rate: {mean_rep:.2f}% (Target: < 5%)")
    print(f"Next Frontier Coverage: {mean_frontier:.2f}% (Target: > 60%)")
    print("====================================================")

    # Feature Importance
    importance_df = pd.DataFrame({
        "feature": FEATURE_NAMES,
        "importance": ranker.feature_importances_,
    }).sort_values("importance", ascending=False)
    print("\nFeature Importance:")
    print(importance_df.to_string(index=False))

    # Save model and feature names
    ranker.booster_.save_model(str(MODEL_PATH))
    with open(FEATURES_PATH, "w", encoding="utf-8") as f:
        json.dump(FEATURE_NAMES, f, indent=2)

    print(f"\nModel saved to: {MODEL_PATH}")
    print(f"Feature list saved to: {FEATURES_PATH}")
    return ranker


if __name__ == "__main__":
    train_and_save_model()
