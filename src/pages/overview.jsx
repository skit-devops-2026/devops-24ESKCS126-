import './overview.css';
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getActivityData, ACTIVITY_EVENT } from "../data/activityData";

const roadmapPreviewTopics = [
    { id: 'arrays', label: 'Arrays', key: 'implementation' },
    { id: 'strings', label: 'Strings', key: 'strings' },
    { id: 'two-pointers', label: 'Two Pointers', key: 'two pointers' },
    { id: 'binary-search', label: 'Binary Search', key: 'binary search' },
    { id: 'trees', label: 'Trees & Graphs', key: 'trees' }
];

const defaultUpNext = [
    {
        id: 'up-1',
        title: 'Monocarp and Projects',
        platform: 'Codeforces',
        difficulty: 'Medium',
        topic: 'Brute Force',
        url: 'https://codeforces.com/problemset'
    },
    {
        id: 'up-2',
        title: 'Carrot Chopdown (Easy Version)',
        platform: 'Codeforces',
        difficulty: 'Medium',
        topic: 'Brute Force',
        url: 'https://codeforces.com/problemset'
    },
    {
        id: 'up-3',
        title: 'Evanescent',
        platform: 'Codeforces',
        difficulty: 'Medium',
        topic: 'Implementation',
        url: 'https://codeforces.com/problemset'
    }
];

function resolveUserProfile() {
    try {
        let authEmail = '';
        let authName = '';
        try {
            const auth = JSON.parse(localStorage.getItem('dsaforge-auth') || '{}');
            if (auth.email) authEmail = auth.email.trim();
            if (auth.name) authName = auth.name.trim();
        } catch {
            // ignore
        }

        const saved = JSON.parse(localStorage.getItem('dsaforge-profile') || '{}');
        let email = saved.email ? saved.email.trim() : '';
        if (!email || email === 'shaili@example.com' || email === 'learner@dsaforge.dev') {
            email = authEmail || '';
        }
        let name = saved.name ? saved.name.trim() : '';
        if (!name || name === 'Learner') {
            name = authName || 'garima';
        }

        return { name, email };
    } catch {
        return { name: "garima", email: "" };
    }
}

export default function Overview() {
    // 1. Live Activity & Profile Data
    const [data, setData] = useState(() => getActivityData());
    const [profile, setProfile] = useState(resolveUserProfile);

    const savedHandles = (() => {
        try {
            const h = JSON.parse(localStorage.getItem('dsaforge-platform-handles') || '{}');
            return h.leetcode ? h : { ...h, leetcode: 'Garima_yaduvanshi' };
        } catch {
            return { leetcode: 'Garima_yaduvanshi' };
        }
    })();

    // 2. Dynamic ML Curriculum State
    const [mlData, setMlData] = useState(null);
    const [loadingMl, setLoadingMl] = useState(true);

    const fetchMlOverview = async () => {
        try {
            const payload = {
                leetcode: savedHandles.leetcode || 'Garima_yaduvanshi',
                gfg: savedHandles.gfg || '',
                codeforces: savedHandles.codeforces || '',
                top_n: 4
            };

            const res = await fetch('http://localhost:8000/api/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const result = await res.json();
                setMlData(result);
            }
        } catch (err) {
            console.warn("ML Server offline, using fallback roadmap:", err);
        } finally {
            setLoadingMl(false);
        }
    };

    useEffect(() => {
        function refreshActivityData() {
            setData(getActivityData());
            setProfile(resolveUserProfile());
        }

        window.addEventListener(ACTIVITY_EVENT, refreshActivityData);
        window.addEventListener("storage", refreshActivityData);
        fetchMlOverview();

        return () => {
            window.removeEventListener(ACTIVITY_EVENT, refreshActivityData);
            window.removeEventListener("storage", refreshActivityData);
        };
    }, []);

    // Dynamic Time-based Greeting
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 17) {
        greeting = "Good afternoon";
    }

    const recommendations = mlData?.recommendations || [];
    const topProblem = recommendations[0] || {
        title: 'Contains Duplicate',
        platform: 'LeetCode',
        difficulty: 'Easy',
        topic: 'Arrays',
        url: 'https://leetcode.com/problems/contains-duplicate/'
    };

    const secondaryPicks = recommendations.length > 1
        ? recommendations.slice(1, 4)
        : defaultUpNext;

    const nextTopic = mlData?.next_frontier_topics?.[0] || "IMPLEMENTATION";
    const targetRating = mlData?.target_rating || 1100;
    const skillRating = mlData?.skill_rating || 1000;
    const streakDays = data.currentStreak > 0 ? data.currentStreak : 14;

    return (
        <div className="overview-page">
            
            {/* 1. TOP GREETING HEADER WITH LIVE PLATFORM STATUS BADGE */}
            <div className="overview-header-bar">
                <div className="greeting-group">
                    <h1>{greeting}, {profile.name}! 👋</h1>
                    <p>You solve. We analyse. You improve.</p>
                </div>
                
                <div className="header-sync-pill">
                    <span className="live-dot"></span>
                    <span className="sync-pill-text">
                        LeetCode: @{savedHandles.leetcode || 'Garima_yaduvanshi'}
                    </span>
                    <Link to="/profile" className="sync-pill-manage">Manage</Link>
                </div>
            </div>

            {/* 2. TOP KPI STAT CARDS (4 CARDS) */}
            <div className="overview-kpi-grid">
                <Link to="/activity" className="kpi-card-link">
                    <div className="overview-kpi-card">
                        <div className="kpi-card-top">
                            <span className="kpi-card-label">Problems Solved</span>
                            <div className="kpi-badge-icon badge-blue">
                                <span>&lt;/&gt;</span>
                            </div>
                        </div>
                        <div className="kpi-card-value">{data.problemsSolved}</div>
                        <div className="kpi-card-footer">Across connected platforms</div>
                    </div>
                </Link>

                <Link to="/recommendations" className="kpi-card-link">
                    <div className="overview-kpi-card">
                        <div className="kpi-card-top">
                            <span className="kpi-card-label">Algorithmic Rating</span>
                            <div className="kpi-badge-icon badge-purple">
                                <span>📈</span>
                            </div>
                        </div>
                        <div className="kpi-card-value">{skillRating}</div>
                        <div className="kpi-card-footer">Target: {targetRating} rating</div>
                    </div>
                </Link>

                <Link to="/activity" className="kpi-card-link">
                    <div className="overview-kpi-card">
                        <div className="kpi-card-top">
                            <span className="kpi-card-label">Current Streak</span>
                            <div className="kpi-badge-icon badge-amber">
                                <span>🔥</span>
                            </div>
                        </div>
                        <div className="kpi-card-value streak-value">
                            {streakDays} <span className="streak-unit">days</span>
                        </div>
                        <div className="kpi-card-footer text-jade">Consistency champion</div>
                    </div>
                </Link>

                <Link to="/my-skill-map" className="kpi-card-link">
                    <div className="overview-kpi-card">
                        <div className="kpi-card-top">
                            <span className="kpi-card-label">Mastered Modules</span>
                            <div className="kpi-badge-icon badge-jade">
                                <span>🏆</span>
                            </div>
                        </div>
                        <div className="kpi-card-value">{(mlData?.mastered_topics?.length ?? 0)} Topics</div>
                        <div className="kpi-card-footer">Foundations in progress</div>
                    </div>
                </Link>
            </div>

            {/* 3. MAIN 2-COLUMN DASHBOARD GRID */}
            <div className="overview-main-grid">
                
                {/* === LEFT COLUMN (~67%) === */}
                <div className="overview-left-col">
                    
                    {/* Hero Recommendation Card */}
                    <div className="hero-focus-card">
                        <div className="hero-badge-row">
                            <div className="hero-tag-lightgbm">
                                <span className="target-icon">🎯</span>
                                <span>LIGHTGBM CURRICULUM FOCUS</span>
                            </div>
                            <span className="priority-pill">PRIORITY 1</span>
                        </div>

                        <h2 className="hero-title">Practice {nextTopic.toUpperCase()}</h2>
                        
                        <p className="hero-description">
                            Skill Expansion: Expand your core repertoire with 'sortings' at 900 rating, matched to your target skill progression.
                        </p>

                        <div className="hero-problem-row">
                            <div className="problem-meta-tags">
                                <span className="platform-pill-badge platform-leetcode">LeetCode</span>
                                <span className="diff-pill-badge diff-easy">Easy</span>
                                <strong className="problem-title-text">{topProblem.title}</strong>
                            </div>

                            <a 
                                href={topProblem.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn-solve-now"
                            >
                                Solve Now ↗
                            </a>
                        </div>
                    </div>

                    {/* Skill Map Roadmap Gateway */}
                    <div className="skill-map-gateway-box">
                        <div className="gateway-header-row">
                            <div>
                                <h3 className="gateway-heading">🗺️ Your Curriculum Skill Map</h3>
                                <p className="gateway-subheading">
                                    Interactive tree graph mapping your journey from Foundations to Advanced DP
                                </p>
                            </div>
                            <Link to="/my-skill-map" className="btn-open-roadmap">
                                Open Roadmap ↗
                            </Link>
                        </div>

                        <div className="gateway-pills-container">
                            <Link to="/my-skill-map" className="gateway-topic-pill active-pill">
                                <span>🎯 Arrays (Focus)</span>
                            </Link>

                            <div className="gateway-topic-pill locked-pill">
                                <span>🔒 Strings</span>
                            </div>

                            <div className="gateway-topic-pill locked-pill">
                                <span>🔒 Two Pointers</span>
                            </div>

                            <div className="gateway-topic-pill locked-pill">
                                <span>🔒 Binary Search</span>
                            </div>

                            <div className="gateway-topic-pill locked-pill">
                                <span>🔒 Trees & Graphs</span>
                            </div>
                        </div>
                    </div>

                    {/* Up Next For You */}
                    <div className="up-next-section">
                        <div className="up-next-header">
                            <h3>⚡ Up Next For You</h3>
                            <Link to="/recommendations" className="see-all-link">See all</Link>
                        </div>

                        <div className="up-next-cards-list">
                            {secondaryPicks.map((prob, i) => (
                                <div className="up-next-card" key={prob.id || i}>
                                    <div className="up-next-info">
                                        <h4 className="up-next-title">{prob.title}</h4>
                                        <div className="up-next-tags">
                                            <span className="tag-platform-cf">{prob.platform}</span>
                                            <span className="tag-diff-med">{prob.difficulty}</span>
                                            <span className="tag-topic-sub">• {prob.topic}</span>
                                        </div>
                                    </div>
                                    <a 
                                        href={prob.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="btn-solve-outline"
                                    >
                                        Solve ↗
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* === RIGHT COLUMN (~33%) === */}
                <div className="overview-right-col">
                    
                    {/* 1. Connected Platforms Card */}
                    <div className="side-card">
                        <div className="side-card-header">
                            <h4>🏆 Connected Platforms</h4>
                            <Link to="/profile" className="side-edit-link">Edit</Link>
                        </div>

                        <div className="platforms-status-list">
                            <div className="platform-row-item">
                                <div className="platform-icon-box lc-box">LC</div>
                                <div className="platform-info-text">
                                    <strong>LeetCode</strong>
                                    <span>@{savedHandles.leetcode || 'Garima_yaduvanshi'}</span>
                                </div>
                                <span className="status-indicator-dot dot-active"></span>
                            </div>

                            <div className="platform-row-item">
                                <div className="platform-icon-box cf-box">CF</div>
                                <div className="platform-info-text">
                                    <strong>Codeforces</strong>
                                    <span>Not connected</span>
                                </div>
                                <span className="status-indicator-dot dot-inactive"></span>
                            </div>

                            <div className="platform-row-item">
                                <div className="platform-icon-box gfg-box">GFG</div>
                                <div className="platform-info-text">
                                    <strong>GeeksforGeeks</strong>
                                    <span>Not connected</span>
                                </div>
                                <span className="status-indicator-dot dot-inactive"></span>
                            </div>
                        </div>

                        <div className="side-card-footer-row">
                            <span className="synced-time-text">Status: Synced Today at 12:45 PM</span>
                            <button 
                                type="button" 
                                className="recheck-btn" 
                                onClick={fetchMlOverview}
                            >
                                Re-check
                            </button>
                        </div>
                    </div>

                    {/* 2. Weekly Target Card */}
                    <div className="side-card">
                        <div className="side-card-header">
                            <h4>🎯 Weekly Target</h4>
                            <span className="target-count-badge">0/7 Solved</span>
                        </div>

                        <p className="side-card-desc">
                            Solve at least 1 problem a day to maintain your curriculum velocity.
                        </p>

                        <div className="target-progress-track">
                            <div className="target-progress-bar" style={{ width: '4%' }}></div>
                        </div>

                        <div className="target-footer-stats">
                            <span className="remaining-text">🔥 7 problems remaining</span>
                            <span className="pct-text">0% complete</span>
                        </div>
                    </div>

                    {/* 3. Pattern Tip of the Day Card */}
                    <div className="side-card tip-of-day-card">
                        <div className="tip-header-row">
                            <span className="tip-icon">💡</span>
                            <span className="tip-title-label">PATTERN TIP OF THE DAY</span>
                        </div>
                        <p className="tip-content-text">
                            <strong>Two Pointers vs Sliding Window:</strong> Use Two Pointers when comparing ends of a sorted array. Use Sliding Window when searching for contiguous subarrays satisfying a condition.
                        </p>
                    </div>

                </div>

            </div>

        </div>
    );
}
