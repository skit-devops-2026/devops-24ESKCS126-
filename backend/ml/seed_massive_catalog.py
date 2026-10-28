"""DSAForge Massive Problem Harvester

Automatically fetches 2,400+ free LeetCode problems and top GeeksforGeeks
practice problems, classifies their topics/patterns, and saves them into the
SQLite database.
"""

import json
from pathlib import Path
import re
import sqlite3
import urllib.request

DB_PATH = Path(__file__).resolve().parent / "feature_preparation.db"


def classify_problem_topic(title: str) -> str:
  """Accurately classifies problem into DSAForge curriculum topics using keyword heuristics."""
  t = title.lower()

  # Trees & BST
  if any(k in t for k in ["tree", "bst", "trie", "preorder", "inorder"]):
    return "trees"
  # Graphs & Traversal
  if any(
      k in t
      for k in [
          "graph",
          "island",
          "course",
          "path",
          "network",
          "cycle",
          "bipartite",
          "flood",
      ]
  ):
    return "graphs"
  # Dynamic Programming
  if any(
      k in t
      for k in [
          "dp",
          "knapsack",
          "subsequence",
          "coin",
          "stairs",
          "robber",
          "edit distance",
          "stock",
          "jump",
      ]
  ):
    return "dp"
  # Binary Search
  if any(k in t for k in ["binary search", "search in", "rotated", "median"]):
    return "binary search"
  # Two Pointers & Sliding Window
  if any(
      k in t
      for k in [
          "pointer",
          "window",
          "palindrome",
          "water",
          "3sum",
          "2sum",
          "rain",
          "trap",
      ]
  ):
    return "two pointers"
  # Stack & Queue & Linked Lists
  if any(
      k in t
      for k in [
          "stack",
          "queue",
          "parenthes",
          "linked list",
          "reverse list",
          "merge list",
      ]
  ):
    return "data structures"
  # Strings
  if any(k in t for k in ["string", "anagram", "word", "prefix", "substring"]):
    return "strings"
  # Math & Numbers
  if any(
      k in t
      for k in [
          "prime",
          "math",
          "number",
          "integer",
          "pow",
          "sqrt",
          "factor",
          "digit",
      ]
  ):
    return "math"
  # Bit Manipulation
  if any(k in t for k in ["bit", "xor", "and", "or", "single number"]):
    return "bitmasks"
  # Sortings
  if any(k in t for k in ["sort", "interval", "meeting", "merge"]):
    return "sortings"
  # Greedy
  if any(k in t for k in ["greedy", "assign", "gas", "maximize", "minimize"]):
    return "greedy"

  # Default to implementation
  return "implementation"


def ingest_all_leetcode(conn):
  print("\n1. Fetching all LeetCode questions from public API...")
  url = "https://leetcode.com/api/problems/all/"

  req = urllib.request.Request(
      url,
      headers={
          "User-Agent": (
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          )
      },
  )

  try:
    with urllib.request.urlopen(req, timeout=15) as resp:
      data = json.loads(resp.read().decode("utf-8"))
  except Exception as e:
    print(f"Error fetching from LeetCode: {e}")
    return 0

  problems = data.get("stat_status_pairs", [])
  print(f"   Received {len(problems)} raw questions from LeetCode.")

  difficulty_map = {
      1: ("Easy", 1000.0),
      2: ("Medium", 1400.0),
      3: ("Hard", 1850.0),
  }

  upsert_sql = """
        INSERT INTO unified_problem_catalog (problem_id, platform, title, topic, difficulty, rating, tags, url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(problem_id) DO UPDATE SET
            title = excluded.title,
            topic = excluded.topic,
            difficulty = excluded.difficulty,
            rating = excluded.rating,
            url = excluded.url
    """

  cur = conn.cursor()
  inserted = 0

  for p in problems:
    # Skip paid/premium questions so students never hit paywalls!
    if p.get("paid_only", False):
      continue

    stat = p.get("stat", {})
    title = stat.get("question__title")
    slug = stat.get("question__title_slug")
    level = p.get("difficulty", {}).get("level", 1)

    if not title or not slug:
      continue

    diff_name, rating = difficulty_map.get(level, ("Easy", 1000.0))
    topic = classify_problem_topic(title)
    prob_id = f"lc_{stat.get('question_id')}"
    url = f"https://leetcode.com/problems/{slug}/"

    cur.execute(
        upsert_sql,
        (
            prob_id,
            "LeetCode",
            title,
            topic,
            diff_name,
            rating,
            json.dumps([topic, diff_name.lower()]),
            url,
        ),
    )
    inserted += 1

  conn.commit()
  print(f"✅ Loaded {inserted} free LeetCode questions with smart tags!")
  return inserted


def ingest_top_gfg(conn):
  print("\n2. Ingesting Top GeeksforGeeks Core Practice Problems...")

  gfg_problems = [
      (
          "gfg_kadane",
          "Kadane's Algorithm",
          "greedy",
          "Medium",
          1350.0,
          "https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1",
      ),
      (
          "gfg_sub_sum",
          "Subarray with Given Sum",
          "two pointers",
          "Medium",
          1300.0,
          "https://www.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1",
      ),
      (
          "gfg_missing_num",
          "Missing Number in Array",
          "math",
          "Easy",
          950.0,
          "https://www.geeksforgeeks.org/problems/missing-number-in-array1416/1",
      ),
      (
          "gfg_sort_012",
          "Sort an Array of 0s, 1s and 2s",
          "two pointers",
          "Medium",
          1200.0,
          "https://www.geeksforgeeks.org/problems/sort-an-array-of-0s-1s-and-2s4231/1",
      ),
      (
          "gfg_min_jumps",
          "Minimum Number of Jumps",
          "greedy",
          "Medium",
          1400.0,
          "https://www.geeksforgeeks.org/problems/minimum-number-of-jumps-1587115620/1",
      ),
      (
          "gfg_kth_elem",
          "Kth Smallest Element",
          "sortings",
          "Medium",
          1250.0,
          "https://www.geeksforgeeks.org/problems/kth-smallest-element5635/1",
      ),
      (
          "gfg_detect_loop",
          "Detect Loop in Linked List",
          "two pointers",
          "Medium",
          1250.0,
          "https://www.geeksforgeeks.org/problems/detect-loop-in-linked-list/1",
      ),
      (
          "gfg_min_platforms",
          "Minimum Platforms",
          "greedy",
          "Medium",
          1400.0,
          "https://www.geeksforgeeks.org/problems/minimum-platforms-1587115620/1",
      ),
      (
          "gfg_bfs_graph",
          "BFS of Graph",
          "graphs",
          "Easy",
          1100.0,
          "https://www.geeksforgeeks.org/problems/bfs-traversal-of-graph/1",
      ),
      (
          "gfg_dfs_graph",
          "DFS of Graph",
          "dfs and similar",
          "Easy",
          1100.0,
          "https://www.geeksforgeeks.org/problems/depth-first-traversal-for-a-graph/1",
      ),
      (
          "gfg_dijkstra",
          "Dijkstra's Algorithm",
          "shortest paths",
          "Medium",
          1550.0,
          "https://www.geeksforgeeks.org/problems/implementing-dijkstra-set-1-adjacency-matrix/1",
      ),
      (
          "gfg_01knapsack",
          "0 - 1 Knapsack Problem",
          "dp",
          "Medium",
          1450.0,
          "https://www.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1",
      ),
      (
          "gfg_parenthesis",
          "Parenthesis Checker",
          "data structures",
          "Easy",
          950.0,
          "https://www.geeksforgeeks.org/problems/parenthesis-checker2744/1",
      ),
      (
          "gfg_mcm",
          "Matrix Chain Multiplication",
          "dp",
          "Hard",
          1850.0,
          "https://www.geeksforgeeks.org/problems/matrix-chain-multiplication0303/1",
      ),
      (
          "gfg_lcs",
          "Longest Common Subsequence",
          "dp",
          "Medium",
          1500.0,
          "https://www.geeksforgeeks.org/problems/longest-common-subsequence-1587115620/1",
      ),
      (
          "gfg_rat_maze",
          "Rat in a Maze Problem - I",
          "dfs and similar",
          "Medium",
          1400.0,
          "https://www.geeksforgeeks.org/problems/rat-in-a-maze-problem/1",
      ),
      (
          "gfg_top_view",
          "Top View of Binary Tree",
          "trees",
          "Medium",
          1350.0,
          "https://www.geeksforgeeks.org/problems/top-view-of-binary-tree/1",
      ),
      (
          "gfg_bottom_view",
          "Bottom View of Binary Tree",
          "trees",
          "Medium",
          1350.0,
          "https://www.geeksforgeeks.org/problems/bottom-view-of-binary-tree/1",
      ),
      (
          "gfg_left_view",
          "Left View of Binary Tree",
          "trees",
          "Easy",
          1050.0,
          "https://www.geeksforgeeks.org/problems/left-view-of-binary-tree/1",
      ),
      (
          "gfg_allocate_pages",
          "Allocate Minimum Pages",
          "binary search",
          "Medium",
          1600.0,
          "https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1",
      ),
  ]

  upsert_sql = """
        INSERT INTO unified_problem_catalog (problem_id, platform, title, topic, difficulty, rating, tags, url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(problem_id) DO UPDATE SET
            title = excluded.title,
            topic = excluded.topic,
            difficulty = excluded.difficulty,
            rating = excluded.rating,
            url = excluded.url
    """

  cur = conn.cursor()
  for p in gfg_problems:
    cur.execute(
        upsert_sql,
        (
            p[0],
            "GeeksforGeeks",
            p[1],
            p[2],
            p[3],
            p[4],
            json.dumps([p[2], p[3].lower()]),
            p[5],
        ),
    )

  conn.commit()
  print(f"✅ Ingested {len(gfg_problems)} top GeeksforGeeks core problems!")


def main():
  print(f"Connecting to database at {DB_PATH}...")

  with sqlite3.connect(DB_PATH) as conn:
    cur = conn.cursor()

    cur.execute("""
            CREATE TABLE IF NOT EXISTS unified_problem_catalog (
                problem_id TEXT PRIMARY KEY,
                platform TEXT,
                title TEXT,
                topic TEXT,
                difficulty TEXT,
                rating REAL,
                tags TEXT,
                url TEXT
            )
        """)

    # 1. Ingest all 2,400+ free LeetCode problems
    ingest_all_leetcode(conn)

    # 2. Ingest top GeeksforGeeks problems
    ingest_top_gfg(conn)

    # 3. Print Final Summary
    cur.execute(
        "SELECT platform, count(*) FROM unified_problem_catalog GROUP BY"
        " platform"
    )
    print("\n🎉 ========================================================")
    print("   MASSIVE CATALOG HARVEST COMPLETE!")
    print("   ========================================================")
    for platform, total in cur.fetchall():
      print(f"   • {platform}: {total:,} problems available to the ML model!")


if __name__ == "__main__":
  main()