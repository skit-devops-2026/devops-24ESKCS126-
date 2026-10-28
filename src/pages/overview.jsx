import './overview.css';
import { MdCode } from "react-icons/md";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getActivityData, ACTIVITY_EVENT } from "../data/activityData";

const roadmapPreviewTopics = [
    { id: 'arrays', label: 'Arrays', key: 'implementation' },
    { id: 'strings', label: 'Strings', key: 'strings' },
    { id: 'two-pointers', label: 'Two Pointers', key: 'two pointers' },
    { id: 'binary-search', label: 'Binary Search', key: 'binary search' },
    { id: 'trees', label: 'Trees & Graphs', key: 'trees' },
    { id: 'dp', label: 'Dynamic Programming', key: 'dp' }
];

const patternTips = {
    'two pointers': 'Two Pointers vs Sliding Window: Use Two Pointers when comparing ends of a sorted array. Use Sliding Window when searching for contiguous subarrays satisfying a condition.',
    'binary search': 'Binary Search Insight: Look for monotonic properties (true...true...false). If verifying an answer takes O(N), binary search on answer reduces total complexity to O(N log K).',
    'trees': 'Tree Traversal Tip: Use BFS (Queue) for level-by-level shortest path. Use DFS (Recursion / Stack) for deepest path, backtracking, and subtree validations.',
    'dp': 'Dynamic Programming Strategy: First write the recursive solution with base cases. If overlapping subproblems exist, memoize with an array or hash map before converting to tabulation.',
    'arrays': 'Hash Table Optimization: Trade O(N) memory to turn O(N) linear lookups into O(1) amortized queries.'
};

function Overview() {
    // 1. Live Activity & Profile Data
    const [data, setData] = useState(() => getActivityData());
    const [profile, setProfile] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dsaforge-profile') || '{"name": "Learner"}');
        } catch {
            return { name: "Learner" };
        }
    });

    const [isDismissedQuickstart, setIsDismissedQuickstart] = useState(() => {
        try {
            return localStorage.getItem('dsaforge-dismiss-quickstart') === 'true';
        } catch {
            return false;
        }
    });

    const savedHandles = (() => {
        try {
            return JSON.parse(localStorage.getItem('dsaforge-platform-handles') || '{}');
        } catch {
            return {};
        }
    })();

    // 2. Dynamic ML Curriculum State
    const [mlData, setMlData] = useState(null);
    const [loadingMl, setLoadingMl] = useState(true);

    const fetchMlOverview = async () => {
        try {
            const isNewUser = !savedHandles.leetcode && !savedHandles.codeforces && !savedHandles.gfg;

            const payload = isNewUser
                ? { user: profile.name || "student", activities: [], top_n: 4 }
                : {
                    leetcode: savedHandles.leetcode || '',
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
            console.warn("ML Server offline, using default roadmap:", err);
        } finally {
            setLoadingMl(false);
        }
    };

    useEffect(() => {
        function refreshActivityData() {
            setData(getActivityData());
            try {
                const p = JSON.parse(localStorage.getItem('dsaforge-profile') || '{}');
                if (p.name) setProfile(p);
            } catch {
                // ignore
            }
        }

        window.addEventListener(ACTIVITY_EVENT, refreshActivityData);
        window.addEventListener("storage", refreshActivityData);
        fetchMlOverview();

        return () => {
            window.removeEventListener(ACTIVITY_EVENT, refreshActivityData);
            window.removeEventListener("storage", refreshActivityData);
        };
    }, []);

    // 3. Dynamic Time-based Greeting
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 17) {
        greeting = "Good afternoon";
    }

    // Extract ML metadata
    const recommendations = mlData?.recommendations || [];
    const topProblem = recommendations[0];
    const secondaryPicks = recommendations.slice(1, 4);
    const nextTopic = mlData?.next_frontier_topics?.[0] || "Two Pointers";
    const targetRating = mlData?.target_rating || 1100;
    const skillRating = mlData?.skill_rating || 1000;
    const recentActivities = mlData?.recent_activities || [];

    // Weekly target calculation (Goal: 7 problems per week)
    const solvedThisWeek = Math.min(recentActivities.length, 7);
    const weeklyPct = Math.round((solvedThisWeek / 7) * 100);

    const activeTip = Object.entries(patternTips).find(([key]) => nextTopic.toLowerCase().includes(key))?.[1] || 
        'Two Pointers vs Sliding Window: Use Two Pointers when comparing ends of a sorted array. Use Sliding Window when searching for contiguous subarrays satisfying a condition.';

    const totalSolved = mlData?.total_solved ?? data.problemsSolved;
    const hasPlatforms = Boolean(savedHandles.leetcode || savedHandles.codeforces || savedHandles.gfg || savedHandles.hackerrank);
    const hasSolved = totalSolved > 0;
    const showQuickstart = !isDismissedQuickstart && (!hasPlatforms || !hasSolved);

    const handleDismissQuickstart = () => {
        setIsDismissedQuickstart(true);
        try {
            localStorage.setItem('dsaforge-dismiss-quickstart', 'true');
        } catch {
            // ignore
        }
    };

    return (
        <div className="overview">
            
            {/* Top Greeting Header with Live Platform Status Badge */}
            <div className="overview-header-bar">
                <div>
                    <h1>{greeting}, {profile.name}! 👋</h1>
                    <p>You solve. We analyse. You improve.</p>
                </div>
                
                <div className="header-sync-pill">
                    <span className="live-dot"></span>
                    <span>
                        {savedHandles.leetcode 
                            ? `LeetCode: @${savedHandles.leetcode}` 
                            : 'Platforms Disconnected'}
                    </span>
                    <Link to="/profile" className="sync-pill-edit">Manage</Link>
                </div>
            </div>

            {/* Quickstart Checklist for New Users */}
            {showQuickstart && (
                <div className="quickstart-card">
                    <div className="quickstart-header">
                        <h3>✦ Quick Start Checklist</h3>
                        <button 
                            type="button" 
                            className="quickstart-dismiss" 
                            onClick={handleDismissQuickstart}
                            title="Dismiss checklist"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="quickstart-steps">
                        <Link to="/profile" className={`quickstart-step ${hasPlatforms ? 'done' : ''}`}>
                            <span className="step-icon">{hasPlatforms ? '✓' : '1'}</span>
                            <div className="step-content">
                                <strong>Connect Platforms</strong>
                                <span>{hasPlatforms ? 'Platforms linked' : 'Link handles in Profile'}</span>
                            </div>
                        </Link>

                        <Link to="/my-skill-map" className="quickstart-step">
                            <span className="step-icon">2</span>
                            <div className="step-content">
                                <strong>Explore Roadmap</strong>
                                <span>View your curriculum skill tree</span>
                            </div>
                        </Link>

                        <Link to="/recommendations" className={`quickstart-step ${hasSolved ? 'done' : ''}`}>
                            <span className="step-icon">{hasSolved ? '✓' : '3'}</span>
                            <div className="step-content">
                                <strong>Solve 1st Problem</strong>
                                <span>{hasSolved ? `${totalSolved} solved so far` : 'Start AI recommendations'}</span>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {/* 1. TOP KPI STAT CARDS */}
            <div className="stat_cards">
                <Link to="/activity" className="stat-card-link">
                    <div className="problems_solve">
                        <div className="icon">
                            <MdCode size={30} />
                        </div>
                        <div className="problems_solve_text">
                            <p className="title">Problems Solved</p>
                            <p className="number">{totalSolved}</p>
                            <p className="subtitle">Across connected platforms</p>
                        </div>
                    </div>
                </Link>

                <Link to="/recommendations" className="stat-card-link">
                    <div className="problems_solve">
                        <div className="icon" style={{ color: '#059669' }}>
                            <span style={{ fontSize: '22px' }}>📈</span>
                        </div>
                        <div className="problems_solve_text">
                            <p className="title">Algorithmic Rating</p>
                            <p className="number">{skillRating}</p>
                            <p className="subtitle">Target: {targetRating} rating</p>
                        </div>
                    </div>
                </Link>

                <Link to="/activity" className="stat-card-link">
                    <div className="problems_solve">
                        <div className="icon" style={{ color: '#f59e0b' }}>
                            <span style={{ fontSize: '22px' }}>🔥</span>
                        </div>
                        <div className="problems_solve_text">
                            <p className="title">Current Streak</p>
                            <p className="number">{data.currentStreak} {data.currentStreak === 1 ? 'day' : 'days'}</p>
                            <p className="subtitle">Consistency champion</p>
                        </div>
                    </div>
                </Link>

                <Link to="/my-skill-map" className="stat-card-link">
                    <div className="problems_solve">
                        <div className="icon" style={{ color: '#7c3aed' }}>
                            <span style={{ fontSize: '22px' }}>🗺️</span>
                        </div>
                        <div className="problems_solve_text">
                            <p className="title">Mastered Modules</p>
                            <p className="number">{(mlData?.mastered_topics?.length ?? 0)} Topics</p>
                            <p className="subtitle">
                                {mlData?.mastered_topics?.length > 0 
                                    ? `${mlData.mastered_topics.slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')} verified`
                                    : 'Foundations in progress'}
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* 2. MAIN 2-COLUMN DASHBOARD GRID */}
            <div className="overview-dashboard-grid">
                
                {/* === LEFT MAIN COLUMN (65%) === */}
                <div className="dashboard-left-col">
                    
                    {/* Hero Recommendation Card */}
                    <div className="hero-recommender-card">
                        <div className="hero-recommender-badge">
                            <span>🎯 LightGBM Curriculum Focus</span>
                            <span className="badge-chip">Priority 1</span>
                        </div>

                        <h2>Practice {nextTopic.toUpperCase()}</h2>
                        
                        <p className="hero-reason">
                            {loadingMl ? (
                                "Connecting to DSAForge ML Recommender Engine..."
                            ) : topProblem ? (
                                topProblem.reason
                            ) : (
                                `Matched to your skill target (${targetRating}). Start practicing foundational problems to advance your curriculum roadmap.`
                            )}
                        </p>

                        {topProblem && (
                            <div className="hero-problem-highlight">
                                <div className="prob-meta">
                                    <span className="platform-tag">{topProblem.platform}</span>
                                    <span className={`diff-tag ${topProblem.difficulty.toLowerCase()}`}>
                                        {topProblem.difficulty}
                                    </span>
                                    <strong className="prob-name">{topProblem.title}</strong>
                                </div>

                                <div className="prob-action">
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
                        )}

                        <div className="hero-card-footer">
                            <Link to="/recommendations" className="view-all-rec-link">
                                View All 30 AI Recommendations →
                            </Link>
                            <span className="rec-engine-label">Powered by DSAForge LightGBM</span>
                        </div>
                    </div>

                    {/* Skill Map Roadmap Gateway */}
                    <Link to="/my-skill-map" className="skill-map-gateway-link">
                        <div className="skill-map-gateway-card">
                            <div className="gateway-header">
                                <div>
                                    <h3>🗺️ Your Curriculum Skill Map</h3>
                                    <p>Interactive tree graph mapping your journey from Foundations to Advanced DP</p>
                                </div>
                                <span className="open-map-pill">Open Roadmap ↗</span>
                            </div>

                            <div className="gateway-pills-row">
                                {roadmapPreviewTopics.slice(0, 5).map(topic => {
                                    const isMastered = (mlData?.mastered_topics || []).some(t => 
                                        t.toLowerCase().includes(topic.key) || topic.key.includes(t.toLowerCase())
                                    );
                                    const isFocus = !isMastered && (
                                        (mlData?.next_frontier_topics || []).some(t => 
                                            t.toLowerCase().includes(topic.key) || topic.key.includes(t.toLowerCase())
                                        ) || topic.label.toLowerCase().includes(nextTopic.toLowerCase())
                                    );
                                    
                                    const status = isMastered ? 'mastered' : isFocus ? 'focus' : 'locked';
                                    const icon = isMastered ? '✓' : isFocus ? '🎯' : '🔒';
                                    
                                    return (
                                        <span key={topic.id} className={`map-pill ${status}`}>
                                            {icon} {topic.label} {isFocus ? '(Focus)' : ''}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </Link>

                    {/* Next Up Curated Practice Problems */}
                    <div className="curated-picks-section">
                        <div className="curated-picks-header">
                            <h3>⚡ Up Next For You</h3>
                            <Link to="/recommendations">See all</Link>
                        </div>

                        <div className="curated-picks-list">
                            {secondaryPicks.length > 0 ? (
                                secondaryPicks.map((prob, i) => (
                                    <div className="curated-pick-item" key={prob.id || i}>
                                        <div className="pick-info">
                                            <strong>{prob.title}</strong>
                                            <div className="pick-tags">
                                                <span className="pill-small">{prob.platform}</span>
                                                <span className={`diff-small ${prob.difficulty.toLowerCase()}`}>{prob.difficulty}</span>
                                                <span className="topic-text">• {prob.topic}</span>
                                            </div>
                                        </div>
                                        <a href={prob.url} target="_blank" rel="noreferrer" className="pick-solve-btn">
                                            Solve ↗
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#64748b', fontSize: '13px' }}>
                                    Loading your curated problem candidates...
                                </p>
                            )}
                        </div>
                    </div>

                </div>

                {/* === RIGHT SIDEBAR (35%) === */}
                <div className="dashboard-right-sidebar">
                    
                    {/* 1. Connected Platform Hub Widget */}
                    <div className="sidebar-card">
                        <div className="sidebar-card-title">
                            <h4>🏆 Connected Platforms</h4>
                            <Link to="/profile">Edit</Link>
                        </div>

                        <div className="platform-mini-list">
                            <div className="platform-mini-item">
                                <div className="mini-icon lc">LC</div>
                                <div className="mini-details">
                                    <strong>LeetCode</strong>
                                    <span>{savedHandles.leetcode ? `@${savedHandles.leetcode}` : 'Not connected'}</span>
                                </div>
                                <span className={`status-dot ${savedHandles.leetcode ? 'active' : ''}`}></span>
                            </div>

                            <div className="platform-mini-item">
                                <div className="mini-icon cf">CF</div>
                                <div className="mini-details">
                                    <strong>Codeforces</strong>
                                    <span>{savedHandles.codeforces ? `@${savedHandles.codeforces}` : 'Not connected'}</span>
                                </div>
                                <span className={`status-dot ${savedHandles.codeforces ? 'active' : ''}`}></span>
                            </div>

                            <div className="platform-mini-item">
                                <div className="mini-icon gfg">GFG</div>
                                <div className="mini-details">
                                    <strong>GeeksforGeeks</strong>
                                    <span>{savedHandles.gfg ? `@${savedHandles.gfg}` : 'Not connected'}</span>
                                </div>
                                <span className={`status-dot ${savedHandles.gfg ? 'active' : ''}`}></span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Weekly Practice Target Widget */}
                    <div className="sidebar-card">
                        <div className="sidebar-card-title">
                            <h4>🎯 Weekly Target</h4>
                            <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 'bold' }}>
                                {solvedThisWeek}/7 Solved
                            </span>
                        </div>

                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 12px' }}>
                            Solve at least 1 problem a day to maintain your curriculum velocity.
                        </p>

                        <div className="weekly-target-bar-bg">
                            <div className="weekly-target-bar-fill" style={{ width: `${weeklyPct}%` }}></div>
                        </div>

                        <div className="weekly-status-footer">
                            <span>🔥 {7 - solvedThisWeek} problems remaining</span>
                            <strong>{weeklyPct}% complete</strong>
                        </div>
                    </div>

                    {/* 3. Recent Submissions Mini Feed */}
                    <div className="sidebar-card">
                        <div className="sidebar-card-title">
                            <h4>🕒 Recent Submissions</h4>
                            <Link to="/activity">History →</Link>
                        </div>

                        <div className="recent-mini-feed">
                            {recentActivities.slice(0, 3).map((act, idx) => (
                                <div className="mini-feed-item" key={idx}>
                                    <div className="mini-feed-bullet">✓</div>
                                    <div className="mini-feed-text">
                                        <strong>{act.title}</strong>
                                        <span>{act.platform} • {act.difficulty}</span>
                                    </div>
                                </div>
                            ))}
                            {recentActivities.length === 0 && (
                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                    Sync platforms to see your recent submissions here.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 4. Daily Algorithmic Pattern Bite */}
                    <div className="sidebar-card tip-card">
                        <div className="tip-header">
                            <span>💡 Pattern Tip of the Day</span>
                        </div>
                        <p className="tip-body">
                            {activeTip}
                        </p>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Overview;
