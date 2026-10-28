"""
DSAForge User Profiler
Analyzes a user's DSA problem-solving history to:
1. Determine overall skill level (median and target rating).
2. Compute mastery across difficulty tiers (Easy, Medium, Hard) for each DSA topic.
3. Detect mastered / saturated topics (e.g. user already solved all levels of Arrays).
4. Identify weak or unpracticed frontier topics that the user should learn next.
"""

import json
import sqlite3
from collections import defaultdict
from pathlib import Path

# Core DSA topics and standard learning progression
CURRICULUM_ROADMAP = {
    "Level 1 - Foundations": [
        "implementation",
        "math",
        "greedy",
        "brute force",
        "sortings",
    ],
    "Level 2 - Core Techniques": [
        "two pointers",
        "binary search",
        "strings",
        "data structures",
        "bitmasks",
    ],
    "Level 3 - Advanced Structures & Algorithms": [
        "trees",
        "dfs and similar",
        "graphs",
        "dp",
        "dsu",
        "number theory",
    ],
    "Level 4 - Expert Topics": [
        "shortest paths",
        "combinatorics",
        "divide and conquer",
        "flows",
        "geometry",
    ],
}

# Prerequisites mapping: topics that build intuition for higher topics
PREREQUISITES = {
    "two pointers": ["sortings", "implementation"],
    "binary search": ["sortings", "math"],
    "trees": ["dfs and similar", "data structures"],
    "graphs": ["dfs and similar", "data structures"],
    "dp": ["recursion", "brute force", "math"],
    "shortest paths": ["graphs", "greedy"],
    "dsu": ["graphs", "data structures"],
}

# Difficulty thresholds (Codeforces rating scale)
RATING_EASY_MAX = 1100
RATING_MEDIUM_MAX = 1500
# Hard is > 1500


def classify_difficulty(rating):
    if rating is None:
        return "Unknown"
    if rating <= RATING_EASY_MAX:
        return "Easy"
    if rating <= RATING_MEDIUM_MAX:
        return "Medium"
    return "Hard"


class UserProfile:
    def __init__(self, user_handle):
        self.user_handle = user_handle
        self.solved_problems = set()
        self.attempted_problems = set()
        self.total_solved = 0
        self.ratings = []
        self.median_rating = 1000.0
        self.target_rating = 1100.0

        # Topic breakdown: tag -> stats
        # stats: {'solved': int, 'wrong': int, 'easy': int, 'medium': int, 'hard': int, 'max_rating': float}
        self.topic_stats = defaultdict(lambda: {
            "solved": 0,
            "wrong": 0,
            "easy": 0,
            "medium": 0,
            "hard": 0,
            "ratings": [],
            "max_rating": 0.0,
            "mastery_score": 0.0,
            "status": "Unpracticed",  # Unpracticed, Novice, Competent, Mastered
        })

    def analyze(self, rows):
        """
        rows: list of dicts with:
        problem, accepted, wrong_attempts, problem_rating, tags_json, last_timestamp
        """
        for row in rows:
            problem = row["problem"]
            accepted = row["accepted"]
            wrong = row.get("wrong_attempts", 0)
            rating = row.get("problem_rating")
            tags_raw = row.get("tags") or "[]"

            try:
                tags = json.loads(tags_raw) if isinstance(tags_raw, str) else tags_raw
            except (json.JSONDecodeError, TypeError):
                tags = []

            self.attempted_problems.add(problem)

            if accepted > 0:
                self.solved_problems.add(problem)
                self.total_solved += 1
                if rating is not None and rating > 0:
                    self.ratings.append(float(rating))

            for tag in tags:
                stat = self.topic_stats[tag]
                stat["wrong"] += wrong
                if accepted > 0:
                    stat["solved"] += 1
                    if rating is not None and rating > 0:
                        stat["ratings"].append(float(rating))
                        if rating > stat["max_rating"]:
                            stat["max_rating"] = float(rating)
                        diff = classify_difficulty(rating)
                        if diff == "Easy":
                            stat["easy"] += 1
                        elif diff == "Medium":
                            stat["medium"] += 1
                        elif diff == "Hard":
                            stat["hard"] += 1

        # Calculate overall skill rating
        if self.ratings:
            sorted_ratings = sorted(self.ratings)
            self.median_rating = float(sorted_ratings[len(sorted_ratings) // 2])
        else:
            self.median_rating = 1000.0

        self.target_rating = min(self.median_rating + 100.0, 3500.0)

        # Compute topic mastery score and status
        for tag, stat in self.topic_stats.items():
            solved = stat["solved"]
            wrong = stat["wrong"]
            easy = stat["easy"]
            medium = stat["medium"]
            hard = stat["hard"]

            if solved == 0:
                stat["mastery_score"] = 0.0
                stat["status"] = "Unpracticed"
                continue

            # Diversity of difficulty solved
            tiers_solved = sum([1 for count in (easy, medium, hard) if count >= 1])
            tier_breadth = tiers_solved / 3.0  # 0.33, 0.67, 1.0

            # Volume score (diminishing returns after 15 problems)
            volume_score = min(solved / 15.0, 1.0)

            # Accuracy score
            accuracy = solved / max(solved + wrong, 1.0)

            # Skill headroom (did they solve up to their overall skill level?)
            headroom = min(stat["max_rating"] / max(self.median_rating, 800.0), 1.2) / 1.2

            # Mastery score: composite between 0.0 and 1.0
            mastery = (0.35 * tier_breadth) + (0.30 * volume_score) + (0.20 * headroom) + (0.15 * accuracy)
            stat["mastery_score"] = round(min(mastery, 1.0), 3)

            # Assign human status
            # If user has solved easy, medium, and hard OR has solved >12 with mastery >= 0.75
            if (tiers_solved == 3 and solved >= 8) or (mastery >= 0.75 and solved >= 12):
                stat["status"] = "Mastered"
            elif mastery >= 0.50 or solved >= 6:
                stat["status"] = "Competent"
            else:
                stat["status"] = "Novice"

    def analyze_activities(self, activities):
        """
        Ingests activity history directly from the frontend or API payload:
        activities: list of dicts with:
        {'title': str, 'difficulty': str, 'topic': str, 'pattern': str, 'rating': int/float, ...}
        """
        diff_to_rating = {
            "Easy": 1000.0,
            "Medium": 1400.0,
            "Hard": 1800.0,
        }

        # Topic alias mapping to canonical DSA curriculum topics
        topic_aliases = {
            "arrays": "implementation",
            "array": "implementation",
            "strings": "strings",
            "string": "strings",
            "hash map": "data structures",
            "hash set": "data structures",
            "trees": "trees",
            "tree": "trees",
            "graphs": "graphs",
            "graph": "graphs",
            "dynamic programming": "dp",
            "dp": "dp",
            "binary search": "binary search",
            "two pointers": "two pointers",
            "sliding window": "two pointers",
            "greedy": "greedy",
            "math": "math",
            "dfs": "dfs and similar",
            "bfs": "dfs and similar",
        }

        for act in activities:
            title = act.get("title", "")
            raw_topic = (act.get("topic") or "").lower()
            raw_pattern = (act.get("pattern") or "").lower()
            diff = act.get("difficulty") or "Easy"
            rating = float(act.get("rating") or diff_to_rating.get(diff, 1000.0))

            canonical_topic = topic_aliases.get(raw_topic, raw_topic)

            self.solved_problems.add(title)
            self.total_solved += 1
            self.ratings.append(rating)
            # If platform provided a lifetime total count, use it!
            if (
                "lifetime_total" in act
                and act["lifetime_total"] > self.total_solved
            ):
              self.total_solved = act["lifetime_total"]

            tags = [canonical_topic]
            if raw_pattern:
                canon_pat = topic_aliases.get(raw_pattern, raw_pattern)
                if canon_pat != canonical_topic:
                    tags.append(canon_pat)

            for tag in tags:
                stat = self.topic_stats[tag]
                stat["solved"] += 1
                stat["ratings"].append(rating)
                if rating > stat["max_rating"]:
                    stat["max_rating"] = rating
                if diff == "Easy":
                    stat["easy"] += 1
                elif diff == "Medium":
                    stat["medium"] += 1
                elif diff == "Hard":
                    stat["hard"] += 1

        if self.ratings:
            sorted_ratings = sorted(self.ratings)
            self.median_rating = float(sorted_ratings[len(sorted_ratings) // 2])
        else:
            self.median_rating = 1000.0

        self.target_rating = min(self.median_rating + 100.0, 3500.0)

        # Compute mastery per topic
        for tag, stat in self.topic_stats.items():
            solved = stat["solved"]
            easy = stat["easy"]
            medium = stat["medium"]
            hard = stat["hard"]

            tiers_solved = sum([1 for c in (easy, medium, hard) if c >= 1])
            tier_breadth = tiers_solved / 3.0
            volume_score = min(solved / 6.0, 1.0)
            headroom = min(stat["max_rating"] / max(self.median_rating, 800.0), 1.2) / 1.2
            mastery = (0.45 * tier_breadth) + (0.35 * volume_score) + (0.20 * headroom)
            stat["mastery_score"] = round(min(mastery, 1.0), 3)

            if tiers_solved == 3 or (mastery >= 0.70 and solved >= 4):
                stat["status"] = "Mastered"
            elif mastery >= 0.40 or solved >= 2:
                stat["status"] = "Competent"
            else:
                stat["status"] = "Novice"

    def get_mastered_topics(self):
        """Topics where user has high mastery and should NOT be spammed with more."""
        return [tag for tag, s in self.topic_stats.items() if s["status"] == "Mastered"]

    def get_weak_or_struggling_topics(self):
        """Topics where user has attempted but has high wrong attempts or low mastery."""
        struggling = []
        for tag, s in self.topic_stats.items():
            if s["status"] in ("Novice", "Competent") and s["wrong"] >= 2:
                struggling.append((tag, s["wrong"] / max(s["solved"] + s["wrong"], 1)))
        struggling.sort(key=lambda x: x[1], reverse=True)
        return [t[0] for t in struggling]

    def get_next_frontier_topics(self):
        """
        Identify unpracticed or early-stage topics that the user is ready to learn next,
        following the curriculum roadmap and prerequisites.
        """
        ready_topics = []
        mastered_set = set(self.get_mastered_topics())

        for level, topics in CURRICULUM_ROADMAP.items():
            for topic in topics:
                status = self.topic_stats[topic]["status"] if topic in self.topic_stats else "Unpracticed"
                if status == "Mastered":
                    continue

                # Check prerequisites
                reqs = PREREQUISITES.get(topic, [])
                prereqs_met = all(
                    (r in self.topic_stats and self.topic_stats[r]["status"] in ("Competent", "Mastered"))
                    for r in reqs
                ) if reqs else True

                # Priority: topics in earlier levels or with met prerequisites
                priority = 1.0 if status == "Unpracticed" else 0.8
                if not prereqs_met:
                    priority *= 0.5

                ready_topics.append({
                    "topic": topic,
                    "level": level,
                    "status": status,
                    "prereqs_met": prereqs_met,
                    "priority": priority,
                })

        ready_topics.sort(key=lambda x: (-x["priority"], x["level"]))
        return ready_topics


def load_user_profile_from_db(db_path, user_handle):
    profile = UserProfile(user_handle)
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("""
            SELECT
                u.problem,
                u.accepted,
                u.wrong_attempts,
                u.problem_rating,
                p.tags,
                p.problem_name
            FROM user_problem_features u
            LEFT JOIN codeforces_api_problems p
                ON u.problem = p.problem_id
            WHERE u.user = ?
        """, (user_handle,))
        rows = [dict(r) for r in cur.fetchall()]

    profile.analyze(rows)
    return profile
