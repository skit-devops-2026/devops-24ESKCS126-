import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import './recommendations.css';
import { getActivityData, addSolvedProblem, ACTIVITY_EVENT } from '../data/activityData';

const problemBank = [
    {
        id: 'rec-1',
        title: 'Carrot Chopdown (Easy Version)',
        platform: 'Codeforces',
        difficulty: 'Medium',
        topic: 'Brute Force',
        pattern: 'Brute Force, Games, Math',
        url: 'https://codeforces.com/problemset',
        reason: "Skill Expansion: Expand your core repertoire with 'brute force' at 900 rating, matched to your target skill progression."
    },
    {
        id: 'rec-2',
        title: 'Evanescent',
        platform: 'Codeforces',
        difficulty: 'Medium',
        topic: 'Implementation',
        pattern: 'Implementation, Strings, Two Pointers',
        url: 'https://codeforces.com/problemset',
        reason: "Skill Expansion: Expand your core repertoire with 'implementation' at 900 rating, matched to your target skill progression."
    },
    {
        id: 'rec-3',
        title: 'Crimson Triples',
        platform: 'Codeforces',
        difficulty: 'Medium',
        topic: 'Dp',
        pattern: 'Dp, Math, Number Theory',
        url: 'https://codeforces.com/problemset',
        reason: "Skill Expansion: Deepen recursive state transitions and modular combinations tailored to your rating frontier."
    },
    {
        id: 'rec-4',
        title: 'Contains Duplicate',
        platform: 'LeetCode',
        difficulty: 'Easy',
        topic: 'Arrays',
        pattern: 'Hash Table',
        url: 'https://leetcode.com/problems/contains-duplicate/',
        reason: "Curriculum Anchor: Fast O(N) frequency lookup test to verify baseline time-complexity habits."
    },
    {
        id: 'rec-5',
        title: 'Best Time to Buy and Sell Stock',
        platform: 'LeetCode',
        difficulty: 'Easy',
        topic: 'Arrays',
        pattern: 'Two Pointers',
        url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
        reason: "Linear scanning with running minimum tracking for maximum spread."
    },
    {
        id: 'rec-6',
        title: 'Fruit Into Baskets',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Arrays',
        pattern: 'Sliding Window',
        url: 'https://leetcode.com/problems/fruit-into-baskets/',
        reason: "Dynamic two-element frequency sliding window boundary maintenance."
    },
    {
        id: 'rec-7',
        title: 'Binary Tree Level Order Traversal',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Trees',
        pattern: 'BFS',
        url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
        reason: "Level-by-level queue expansion ensuring shortest path traversal order."
    },
    {
        id: 'rec-8',
        title: 'Climbing Stairs',
        platform: 'LeetCode',
        difficulty: 'Easy',
        topic: 'Dynamic Programming',
        pattern: '1D DP',
        url: 'https://leetcode.com/problems/climbing-stairs/',
        reason: "Foundational overlapping subproblem memoization pattern."
    }
];

const defaultFilters = [
    'All', 'Easy', 'Medium', 'Hard',
    'LeetCode', 'GeeksforGeeks', 'Codeforces'
];

export default function Recommendations() {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Topic query support
    const requestedTopic = location.state?.topic || searchParams.get('topic');
    const [activeFilter, setActiveFilter] = useState(() => requestedTopic || 'All');
    const [searchQuery, setSearchQuery] = useState('');

    const [mlRecommendations, setMlRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userProfileStats, setUserProfileStats] = useState(null);
    const [statusBanner, setStatusBanner] = useState('');

    const [savedProblems, setSavedProblems] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem('dsaforge-saved-problems') || '["rec-1"]'
            );
        } catch {
            return ["rec-1"];
        }
    });

    const [completedProblems, setCompletedProblems] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem('dsaforge-completed-problems') || '["comp-1", "comp-2", "comp-3"]'
            );
        } catch {
            return ["comp-1", "comp-2", "comp-3"];
        }
    });

    const [activityData, setActivityData] = useState(() => getActivityData());
    const [openReason, setOpenReason] = useState(null);

    useEffect(() => {
        function handleActivityUpdate() {
            setActivityData(getActivityData());
        }
        window.addEventListener(ACTIVITY_EVENT, handleActivityUpdate);
        window.addEventListener('storage', handleActivityUpdate);
        return () => {
            window.removeEventListener(ACTIVITY_EVENT, handleActivityUpdate);
            window.removeEventListener('storage', handleActivityUpdate);
        };
    }, []);

    useEffect(() => {
        if (requestedTopic) {
            setActiveFilter(requestedTopic);
        }
    }, [requestedTopic]);

    const fetchLiveRecommendations = async () => {
        setLoading(true);
        setStatusBanner('');
        try {
            const savedHandles = JSON.parse(localStorage.getItem('dsaforge-platform-handles') || '{}');
            const res = await fetch('http://localhost:8000/api/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leetcode: savedHandles.leetcode || 'Garima_yaduvanshi',
                    gfg: savedHandles.gfg || '',
                    codeforces: savedHandles.codeforces || '',
                    top_n: 28
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.recommendations && data.recommendations.length > 0) {
                    setMlRecommendations(data.recommendations);
                    setUserProfileStats({
                        skillRating: data.skill_rating || 1000,
                        targetRating: data.target_rating || 1100,
                        mastered: data.mastered_topics || [],
                        frontiers: data.next_frontier_topics || ['implementation', 'math', 'greedy', 'brute force', 'sortings']
                    });
                }
            }
        } catch (err) {
            console.warn('ML Server offline, using adaptive catalog:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveRecommendations();
    }, []);

    const isProblemCompleted = (problem) => {
        if (!problem) return false;
        return completedProblems.includes(problem.id);
    };

    const toggleSaved = (problemId) => {
        const updated = savedProblems.includes(problemId)
            ? savedProblems.filter((id) => id !== problemId)
            : [...savedProblems, problemId];

        setSavedProblems(updated);
        try {
            localStorage.setItem('dsaforge-saved-problems', JSON.stringify(updated));
        } catch (e) {
            console.error("Could not save problem:", e);
        }
    };

    const markCompleted = (problem) => {
        if (!problem || isProblemCompleted(problem)) return;

        const updatedCompleted = [...completedProblems, problem.id];
        setCompletedProblems(updatedCompleted);
        try {
            localStorage.setItem('dsaforge-completed-problems', JSON.stringify(updatedCompleted));
        } catch (e) {
            console.error("Could not save completed problems:", e);
        }

        addSolvedProblem({
            title: problem.title,
            platform: problem.platform || 'LeetCode',
            difficulty: problem.difficulty || 'Medium',
            topic: problem.topic || 'Implementation',
            timeMinutes: 25,
            url: problem.url
        });

        setActivityData(getActivityData());
        setStatusBanner(`✓ "${problem.title}" logged to practice history! Solved count updated.`);
        setTimeout(() => setStatusBanner(''), 4000);
    };

    const rawList = mlRecommendations.length > 0 ? mlRecommendations : problemBank;

    // Filter problems
    const filteredProblems = rawList.filter((problem) => {
        const matchesFilter =
            activeFilter === 'All' ||
            (problem.difficulty || '').toLowerCase() === activeFilter.toLowerCase() ||
            (problem.platform || '').toLowerCase() === activeFilter.toLowerCase() ||
            (problem.topic || '').toLowerCase().includes(activeFilter.toLowerCase()) ||
            activeFilter.toLowerCase().includes((problem.topic || '').toLowerCase());

        const matchesSearch =
            !searchQuery ||
            problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (problem.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (problem.pattern || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const displayAvailableCount = 28;
    const displaySavedCount = savedProblems.length;
    const displayCompletedCount = completedProblems.length;

    return (
        <div className="recommendations-page">
            
            {/* 1. TOP HEADER & NOTICE BANNER */}
            <div className="rec-top-header">
                <div className="rec-title-group">
                    <h1>Recommended for You</h1>
                    <p>Personalized problems based on your practice history and learning path.</p>
                </div>

                <div className="rec-adapt-banner">
                    <span className="rec-adapt-icon">💡</span>
                    <span>Recommendations adapt to your activity. Keep practising to improve them. 💜</span>
                </div>
            </div>

            {statusBanner && (
                <div className="status-toast-banner">
                    {statusBanner}
                </div>
            )}

            {/* 2. STATS 3-CARD ROW */}
            <div className="rec-kpi-row">
                <div className="rec-kpi-card">
                    <span className="rec-kpi-label">Available</span>
                    <strong className="rec-kpi-num color-obsidian">{displayAvailableCount}</strong>
                </div>

                <div className="rec-kpi-card">
                    <span className="rec-kpi-label">Saved</span>
                    <strong className="rec-kpi-num color-amber">{displaySavedCount}</strong>
                </div>

                <div className="rec-kpi-card">
                    <span className="rec-kpi-label">Completed</span>
                    <strong className="rec-kpi-num color-jade">{displayCompletedCount}</strong>
                </div>
            </div>

            {/* 3. FILTER PILLS & SEARCH INPUT */}
            <div className="rec-controls-bar">
                <div className="rec-filters-group">
                    {defaultFilters.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            className={`filter-pill-btn ${activeFilter === filter ? 'active' : ''}`}
                            onClick={() => {
                                setActiveFilter(filter);
                                setOpenReason(null);
                            }}
                        >
                            {filter}
                        </button>
                    ))}

                    {!defaultFilters.includes(activeFilter) && (
                        <button
                            type="button"
                            className="filter-pill-btn active"
                            onClick={() => setActiveFilter('All')}
                        >
                            🎯 {activeFilter} ✕
                        </button>
                    )}
                </div>

                <div className="rec-search-box">
                    <span className="search-icon">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search problems..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rec-search-input"
                    />
                </div>
            </div>

            {/* 4. CURRICULUM INFO BAR & RE-RANK BUTTON */}
            <div className="rec-curriculum-strip">
                <div className="strip-info-text">
                    <div className="strip-line-1">
                        <span className="target-icon">🎯</span>
                        <strong>Your Curriculum Progress:</strong> Skill Rating: <b>{userProfileStats?.skillRating || 1000}</b> | Target Rating: <b>{userProfileStats?.targetRating || 1100}</b>
                    </div>
                    <div className="strip-line-2">
                        <span>Mastered Topics: None yet</span> | 
                        <span> Next Focus: <b>implementation, math, greedy, brute force, sortings</b></span>
                    </div>
                </div>

                <button 
                    type="button"
                    onClick={fetchLiveRecommendations}
                    disabled={loading}
                    className="btn-sync-rerank"
                >
                    <span className="bolt-icon">⚡</span>
                    <span>{loading ? 'Running ML Model...' : 'Sync Platforms & Re-Rank (ML)'}</span>
                </button>
            </div>

            {/* 5. RECOMMENDATIONS LIST */}
            <div className="rec-cards-list">
                {filteredProblems.length === 0 ? (
                    <div className="no-rec-box">
                        <p>No problems found matching your active filter. Try selecting <b>"All"</b>.</p>
                    </div>
                ) : (
                    filteredProblems.map((problem) => {
                        const isSaved = savedProblems.includes(problem.id);
                        const isCompleted = isProblemCompleted(problem);

                        return (
                            <div className="rec-problem-card" key={problem.id}>
                                
                                {/* Platform Icon Badge */}
                                <div className={`platform-badge-box box-${problem.platform.toLowerCase()}`}>
                                    {problem.platform === 'LeetCode' ? 'LC' : problem.platform === 'Codeforces' ? 'CF' : 'GFG'}
                                </div>

                                {/* Problem Details */}
                                <div className="rec-problem-details">
                                    <h3 className="rec-problem-title">{problem.title}</h3>

                                    <div className="rec-problem-tags-row">
                                        <span className={`diff-badge-pill diff-${(problem.difficulty || 'medium').toLowerCase()}`}>
                                            {problem.difficulty}
                                        </span>
                                        <span className="rec-tag-pill">{problem.topic}</span>
                                        {problem.pattern && (
                                            <span className="rec-tag-pill">{problem.pattern}</span>
                                        )}
                                    </div>

                                    <p className="rec-reason-text">
                                        <strong>Recommended because:</strong> {problem.reason}
                                    </p>
                                </div>

                                {/* Right Side Actions */}
                                <div className="rec-problem-actions">
                                    <a
                                        href={problem.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-solve-platform"
                                    >
                                        Solve on {problem.platform} ↗
                                    </a>

                                    <div className="action-pills-row">
                                        <button
                                            type="button"
                                            className={`pill-btn-outline ${isSaved ? 'saved' : ''}`}
                                            onClick={() => toggleSaved(problem.id)}
                                        >
                                            {isSaved ? '🔖 Saved' : '♡ Save for later'}
                                        </button>

                                        <button
                                            type="button"
                                            className={`pill-btn-outline ${isCompleted ? 'completed' : ''}`}
                                            onClick={() => markCompleted(problem)}
                                            disabled={isCompleted}
                                        >
                                            {isCompleted ? '✓ Completed' : '✓ Mark completed'}
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        className="why-link-btn"
                                        onClick={() => setOpenReason(openReason === problem.id ? null : problem.id)}
                                    >
                                        {openReason === problem.id ? 'Hide explanation' : 'Why this?'}
                                    </button>

                                    {openReason === problem.id && (
                                        <div className="why-reason-box">
                                            {problem.reason}
                                        </div>
                                    )}
                                </div>

                            </div>
                        );
                    })
                )}
            </div>

        </div>
    );
}
