"""
DSAForge Recommendation API Server
Lightweight HTTP server serving real-time curriculum recommendations to the frontend.
Requires zero external web dependencies (uses standard library http.server).
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path

# Add directories to sys.path so it works from anywhere
_current_dir = Path(__file__).resolve().parent
_backend_dir = _current_dir.parent
_root_dir = _backend_dir.parent
for _p in [str(_root_dir), str(_backend_dir), str(_current_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.ml.recommender_engine import RecommenderEngine
    from backend.ml.user_profiler import UserProfile
except ImportError:
    from ml.recommender_engine import RecommenderEngine
    from ml.user_profiler import UserProfile

engine = None

# Helper to persist cumulative lifetime solved history on disk
def get_and_update_persistent_history(user_handle, new_activities):
    history_file = Path(__file__).resolve().parent / "user_solved_history.json"
    history = {}
    if history_file.exists():
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            history = {}

    existing_list = history.get(user_handle, [])
    seen_titles = {item.get("title", "").strip().lower() for item in existing_list}

    # Merge new activities into lifetime history without duplicates
    for act in new_activities:
        t = act.get("title", "").strip().lower()
        if t and t not in seen_titles:
            seen_titles.add(t)
            existing_list.append(act)

    history[user_handle] = existing_list
    try:
        with open(history_file, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        print(f"Error saving user history: {e}")

    return existing_list

def get_engine():
    global engine
    if engine is None:
        engine = RecommenderEngine()
    return engine


class RecommenderHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        if path == "/health":
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "healthy",
                "service": "dsaforge-ml-recommender",
                "model": "Curriculum-Adaptive LightGBM Ranker",
            }).encode("utf-8"))
            return

        if path in ("/api/recommendations", "/recommendations"):
            user_handle = params.get("user", ["user1"])[0]
            top_n = int(params.get("top_n", [10])[0])
            diff = params.get("difficulty", [None])[0]

            try:
                rec_engine = get_engine()
                data = rec_engine.recommend_for_user(user_handle, top_n=top_n, filter_difficulty=diff)
                response_json = json.dumps(data, indent=2)

                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(response_json.encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        self.send_response(404)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
      parsed = urlparse(self.path)
      path = parsed.path

      if path in ("/api/recommendations", "/recommendations"):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")

        try:
          payload = json.loads(body) if body else {}
          activities = payload.get("activities", [])
          user_handle = payload.get("user", "web_student")
          top_n = int(payload.get("top_n", 10))
          diff = payload.get("difficulty")

          # 1. Check for platform handles
          lc_user = payload.get("leetcode_user") or payload.get("leetcode")
          gfg_user = payload.get("gfg_user") or payload.get("gfg")
          cf_user = payload.get("codeforces_handle") or payload.get(
              "codeforces"
          )
          hr_user = payload.get("hackerrank_user") or payload.get(
            "hackerrank"
          )
          cc_user = payload.get("codechef_user") or payload.get(
            "codechef"
          )

          # 2. If platform usernames are provided, fetch their real solved problems
          if lc_user or gfg_user or cf_user or hr_user or cc_user:
            try:
              from backend.ml.platform_fetcher import MultiPlatformFetcher
            except ImportError:
              from ml.platform_fetcher import MultiPlatformFetcher

            fetcher = MultiPlatformFetcher()
            live_solved = fetcher.fetch_all_platforms(
                leetcode_user=lc_user,
                gfg_user=gfg_user,
                codeforces_handle=cf_user,
                hackerrank_user=hr_user,
                codechef_user=cc_user,
            )
            # Combine any manual activities with fetched activities
            activities.extend(live_solved)
            all_new = activities + live_solved
            user_handle = lc_user or gfg_user or cf_user or hr_user or cc_user
            get_and_update_persistent_history(user_handle, all_new)

          # 3. Build user profile and compute topic mastery
          profile = UserProfile(user_handle)
          profile.analyze_activities(activities)

          # 4. Score and rank candidates using LightGBM model
          rec_engine = get_engine()
          data = rec_engine.recommend_for_profile(
              profile, top_n=top_n, filter_difficulty=diff
          )
          data["recent_activities"] = activities  
          response_json = json.dumps(data, indent=2)

          self.send_response(200)
          self._send_cors_headers()
          self.send_header("Content-Type", "application/json")
          self.end_headers()
          self.wfile.write(response_json.encode("utf-8"))

        except Exception as e:
          self.send_response(500)
          self._send_cors_headers()
          self.send_header("Content-Type", "application/json")
          self.end_headers()
          self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        return

      self.send_response(404)
      self._send_cors_headers()
      self.end_headers()


def run_server(port=8000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, RecommenderHandler)
    print(f"DSAForge ML Recommender API running on http://localhost:{port}")
    print("Endpoints:")
    print(f"  GET  http://localhost:{port}/health")
    print(f"  GET  http://localhost:{port}/api/recommendations?user=user1&top_n=10")
    print(f"  POST http://localhost:{port}/api/recommendations (with {{\"activities\": [...]}})")
    httpd.serve_forever()


if __name__ == "__main__":
    run_server()
