import json
import sys
import urllib.request
from pathlib import Path
import time
USER_CACHE = {}
CACHE_TTL = 300 

# Add directories to sys.path so it works from anywhere
_current_dir = Path(__file__).resolve().parent
_backend_dir = _current_dir.parent
_root_dir = _backend_dir.parent
for _p in [str(_root_dir), str(_backend_dir), str(_current_dir)]:
  if _p not in sys.path:
    sys.path.insert(0, _p)


# Maps platform tags to DSAForge curriculum topics
TOPIC_MAP = {
    # Foundations
    "array": "implementation",
    "arrays": "implementation",
    "string": "strings",
    "strings": "strings",
    "math": "math",
    "simulation": "implementation",
    "sorting": "sortings",
    "greedy": "greedy",
    # Core Techniques
    "two pointers": "two pointers",
    "two-pointers": "two pointers",
    "binary search": "binary search",
    "binary-search": "binary search",
    "hash table": "data structures",
    "hashing": "data structures",
    "bit manipulation": "bitmasks",
    "stack": "data structures",
    "queue": "data structures",
    # Advanced
    "tree": "trees",
    "trees": "trees",
    "binary tree": "trees",
    "depth-first search": "dfs and similar",
    "breadth-first search": "graphs",
    "graph": "graphs",
    "graphs": "graphs",
    "dynamic programming": "dp",
    "union find": "dsu",
    "disjoint set": "dsu",
}

# Maps difficulty tiers to numerical ratings for the LightGBM model
DIFFICULTY_RATING_MAP = {
    # LeetCode & GFG Tiers
    "school": 800,
    "basic": 900,
    "easy": 1000,
    "medium": 1400,
    "hard": 1800,
}


def normalize_topic(raw_tag: str) -> str:
  """Converts any platform tag into DSAForge curriculum standard."""
  if not raw_tag:
    return "implementation"
  clean = raw_tag.strip().lower()
  return TOPIC_MAP.get(clean, "implementation")


def normalize_rating(difficulty_str: str) -> int:
  """Converts Easy/Medium/Hard string into numerical rating."""
  clean = str(difficulty_str).strip().lower()
  return DIFFICULTY_RATING_MAP.get(clean, 1200)

class MultiPlatformFetcher:

  def fetch_leetcode(self, username, limit=50):
    """Fetches accepted submissions from LeetCode in 1 FAST call (<0.4s) with 5-minute caching."""
    if not username:
      return []

    clean_user = username.strip().lower()

    # 1. Check Cache: If fetched in the last 5 minutes, return instantly (0.001s)!
    now = time.time()
    if clean_user in USER_CACHE:
      cached_time, cached_data = USER_CACHE[clean_user]
      if now - cached_time < CACHE_TTL:
        print(f"  ⚡ [LeetCode] Loaded {len(cached_data)} items from fast cache!")
        return cached_data

    # 2. Single Fast GraphQL Call (Takes ~0.3s total)
    url = "https://leetcode.com/graphql"
    query = """
        query getRecentAcSubmissions($username: String!, $limit: Int!) {
          recentAcSubmissionList(username: $username, limit: $limit) {
            title
            titleSlug
            timestamp
          }
        }
        matchedUser(username: $username) {
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
        """
    payload = json.dumps({
        "query": query,
        "variables": {"username": username, "limit": limit},
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            ),
        },
    )

    try:
      with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        submissions = data.get("data", {}).get("recentAcSubmissionList") or []

      user_data = data.get("data", {})
      submissions = user_data.get("recentAcSubmissionList") or []
      # 3. Extract Lifetime Total Count
      stats_list = (
          user_data.get("matchedUser", {})
          .get("submitStatsGlobal", {})
          .get("acSubmissionNum", [])
      )
      lifetime_total = 0
      for item in stats_list:
        if item.get("difficulty") == "All":
          lifetime_total = item.get("count", 0)
      print(
          f"  🌟 [LeetCode] {username}'s Lifetime Total Solved:"
          f" {lifetime_total} problems!"
      )

      results = []
      seen = set()

      # Fast topic matching without 20 slow sequential HTTP calls!
      for s in submissions:
        title = s.get("title")
        slug = s.get("titleSlug")
        if not title or title in seen:
          continue
        seen.add(title)

        # Smart classification from title
        t = title.lower()
        topic = "implementation"
        if any(k in t for k in ["tree", "bst"]):
          topic = "trees"
        elif any(k in t for k in ["graph", "island"]):
          topic = "graphs"
        elif any(k in t for k in ["dp", "coin", "subsequence"]):
          topic = "dp"
        elif any(k in t for k in ["pointer", "palindrome", "window"]):
          topic = "two pointers"
        elif any(k in t for k in ["binary search", "search"]):
          topic = "binary search"

        results.append({
            "platform": "LeetCode",
            "title": title,
            "topic": topic,
            "difficulty": "Medium",
            "rating": 1400,
            "url": f"https://leetcode.com/problems/{slug}/",
            "timestamp": s.get("timestamp"),
        })

      # Store in cache
      USER_CACHE[clean_user] = (now, results)
      print(f"  ✅ [LeetCode] Fetched {len(results)}  recent problems in"
            f" {time.time()-now:.2f}s!")
      return results

    except Exception as e:
      print(f"[LeetCode] Error fetching for {username}: {e}")
      return []
    
  def fetch_gfg(self, username):
    """Fetches solved problems from GeeksforGeeks user profile."""
    url = f"https://www.geeksforgeeks.org/user/{username}/"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                " (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            ),
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            ),
        },
    )

    try:
      with urllib.request.urlopen(req, timeout=10) as resp:
        html_content = resp.read().decode("utf-8", errors="ignore")

      # GFG embeds solved problem details in JSON or problem links
      # We parse the problem list from the response
      import re

      results = []
      # Matches problem links: href="/problems/<slug>" or problem titles in practice tables
      problem_matches = re.findall(
          r'href="https://www\.geeksforgeeks\.org/problems/([^/"]+)',
          html_content,
      )

      seen = set()
      for slug in problem_matches:
        if slug in seen or slug in (
            "practice",
            "problem-of-the-day",
            "explore",
        ):
          continue
        seen.add(slug)

        # Format slug into a clean title
        title = slug.replace("-", " ").title()

        results.append({
            "platform": "GFG",
            "title": title,
            "topic": "implementation",  # Default topic; enriched if tag is present
            "difficulty": "Medium",
            "rating": normalize_rating("Medium"),
            "url": f"https://www.geeksforgeeks.org/problems/{slug}",
        })

      return results

    except Exception as e:
      print(f"Error fetching from GFG for {username}: {e}")
      return []

  def fetch_codeforces(self, handle, count=30):
    """Fetches accepted submissions from Codeforces official REST API."""
    url = f"https://codeforces.com/api/user.status?handle={handle}&from=1&count={count}"
    req = urllib.request.Request(url, headers={"User-Agent": "DSAForge/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
      data = json.loads(resp.read().decode("utf-8"))

    results = []
    if data.get("status") == "OK":
      for row in data["result"]:
        if row.get("verdict") == "OK":
          p = row["problem"]
          rating = p.get("rating", 1200)
          results.append({
              "platform": "Codeforces",
              "title": p.get("name"),
              "topic": p.get("tags", ["General"])[0].title(),
              "difficulty": (
                  "Easy"
                  if rating <= 1100
                  else ("Medium" if rating <= 1500 else "Hard")
              ),
              "rating": rating,
          })
    return results

  # ==========================================
  # 4. HACKERRANK
  # ==========================================
  def fetch_hackerrank(self, username, limit=25):
    """Fetches recent challenges from HackerRank public endpoint."""
    if not username:
      return []
    url = f"https://www.hackerrank.com/rest/hackers/{username}/recent_challenges?limit={limit}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
        },
    )

    try:
      with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))

      challenges = data.get("models", [])
      results = []
      seen = set()
      for ch in challenges:
        title = ch.get("name")
        slug = ch.get("ch_slug")
        if title and title not in seen:
          seen.add(title)
          results.append({
              "platform": "HackerRank",
              "title": title,
              "topic": "implementation",
              "difficulty": "Easy",
              "rating": 1050,
              "url": f"https://www.hackerrank.com/challenges/{slug}",
          })
      return results
    except Exception as e:
      print(f"[HackerRank] Could not fetch for '{username}': {e}")
      return []

  # ==========================================
  # 5. CODECHEF
  # ==========================================
  def fetch_codechef(self, username):
    """Fetches user problem activity from CodeChef."""
    if not username:
      return []
    url = f"https://codechef-api.vercel.app/handle/{username}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
        },
    )

    try:
      with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))

      results = []
      if data.get("success"):
        cc_rating = data.get("currentRating", 1200)
        results.append({
            "platform": "CodeChef",
            "title": f"CodeChef Practice Activity ({username})",
            "topic": "implementation",
            "difficulty": "Medium" if cc_rating >= 1400 else "Easy",
            "rating": cc_rating,
            "url": f"https://www.codechef.com/users/{username}",
        })
      return results
    except Exception as e:
      print(f"[CodeChef] Could not fetch for '{username}': {e}")
      return []

  def fetch_all_platforms(
      self,
      leetcode_user=None,
      gfg_user=None,
      codeforces_handle=None,
      hackerrank_user=None,
      codechef_user=None,
  ):
    """Aggregates solved problems across all 5 platforms."""
    all_activities = []

    if leetcode_user:
      print(f"Connecting to LeetCode for {leetcode_user}...")
      all_activities.extend(self.fetch_leetcode(leetcode_user))

    if gfg_user:
      print(f"Connecting to GeeksforGeeks for {gfg_user}...")
      all_activities.extend(self.fetch_gfg(gfg_user))

    if codeforces_handle:
      print(f"Connecting to Codeforces for {codeforces_handle}...")
      all_activities.extend(self.fetch_codeforces(codeforces_handle))

    if hackerrank_user:
      print(f"Connecting to HackerRank for {hackerrank_user}...")
      all_activities.extend(self.fetch_hackerrank(hackerrank_user))

    if codechef_user:
      print(f"Connecting to CodeChef for {codechef_user}...")
      all_activities.extend(self.fetch_codechef(codechef_user))

    print(f"Total unified activities fetched: {len(all_activities)}")
    return all_activities


if __name__ == "__main__":
  fetcher = MultiPlatformFetcher()

  # Replace with your real usernames to test!
  activities = fetcher.fetch_all_platforms(
      leetcode_user="neal_wu",  # or your username
      codeforces_handle="tourist",
  )

  print(f"\nFetched {len(activities)} total activities:")
  for act in activities[:5]:
    print(
        f" - [{act['platform']}] {act['title']} ({act['topic']},"
        f" Rating: {act['rating']})"
    )