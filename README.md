# DSAForge

> An intelligent, adaptive platform for analyzing DSA performance and delivering personalized problem recommendations based on algorithmic mastery.

## Author

| Roll No. | Name | GitHub username |
|---|---|---|
| 24ESKCS126 | Garima Yaduvanshi | Garima0520 |

---

## About

DSAForge helps students and competitive programmers master Data Structures & Algorithms with an adaptive curriculum. It connects with your coding handles (LeetCode, Codeforces, GeeksforGeeks, HackerRank, CodeChef), tracks practice history in real time, visualizes your curriculum roadmap, and recommends targeted problems using a LightGBM ML ranking engine.

### Key Capabilities & Features

- **Personalized Recommendations Engine**: Ranks problem candidates based on user skill rating, topic mastery, and algorithmic pattern gaps.
- **Interactive Curriculum Skill Map**: Visual tree graph mapping student progression from Foundations (Arrays, Strings) to Core Techniques (Two Pointers, Binary Search) and Advanced Modules (Trees, Graphs, DP).
- **Live Platform Telemetry**: Synchronizes solved problems, topic distributions, and difficulty statistics from connected competitive programming platforms.
- **Activity & Consistency Tracker**: Heatmaps, weekly practice targets, consistency streak tracking, and a manual problem logger.
- **Comprehensive Profile & Preferences**: Unified handle management, customizable difficulty and platform preferences, and session controls.

---

## Tech Stack

- **Frontend**: React 19, Vite, React Router v7, ReactFlow (@xyflow/react), Recharts, Lucide / React Icons
- **Backend & ML**: Python, LightGBM, FastAPI / Uvicorn, Scikit-learn
- **DevOps & Infrastructure**: Docker (multi-stage build), Nginx, Prometheus Exporter, Grafana, GitHub Actions CI/CD

---

## Running Locally

### 1. Frontend Setup
```bash
npm install
npm run dev
```
The app runs at `http://localhost:5173`.

### 2. Automated Tests & Build
```bash
npm test          # Runs Vitest unit and integration test suite
npm run lint      # Runs Oxlint code verification
npm run build     # Builds production distribution
```

---

## Live Deployment & DevOps Details

### Live URL
https://dsaforge-frontend-latest.onrender.com

### Health Endpoint
`GET /health` returns the running commit SHA.

### Docker Image
The DSAForge frontend Docker image is publicly available on Docker Hub:
- **Repository:** https://hub.docker.com/r/92512/dsaforge-frontend
- **Image:** `92512/dsaforge-frontend:latest`

Pull the image:
```bash
docker pull 92512/dsaforge-frontend:latest
```
