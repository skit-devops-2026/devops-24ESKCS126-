import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import './recommendations.css';
import { getActivityData, addSolvedProblem, ACTIVITY_EVENT } from '../data/activityData';

const problemBank = [
    {
        id: 1,
        title: 'Contains Duplicate',
        platform: 'LeetCode',
        difficulty: 'Easy',
        topic: 'Arrays',
        pattern: 'Hash Set',
        url: 'https://leetcode.com/problems/contains-duplicate/'
    },
    {
        id: 2,
        title: 'Best Time to Buy and Sell Stock',
        platform: 'LeetCode',
        difficulty: 'Easy',
        topic: 'Arrays',
        pattern: 'Two Pointers',
        url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/'
    },
    {
        id: 3,
        title: 'Longest Substring Without Repeating Characters',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Strings',
        pattern: 'Sliding Window',
        url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'
    },
    {
        id: 4,
        title: 'Fruit Into Baskets',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Arrays',
        pattern: 'Sliding Window',
        url: 'https://leetcode.com/problems/fruit-into-baskets/'
    },
    {
        id: 5,
        title: '3Sum',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Arrays',
        pattern: 'Two Pointers',
        url: 'https://leetcode.com/problems/3sum/'
    },
    {
        id: 6,
        title: 'Number of Islands',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Graphs',
        pattern: 'DFS / BFS',
        url: 'https://leetcode.com/problems/number-of-islands/'
    },
    {
        id: 7,
        title: 'Binary Tree Level Order Traversal',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Trees',
        pattern: 'BFS',
        url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/'
    },
    {
        id: 8,
        title: 'Climbing Stairs',
        platform: 'LeetCode',
        difficulty: 'Easy',
        topic: 'Dynamic Programming',
        pattern: '1D DP',
        url: 'https://leetcode.com/problems/climbing-stairs/'
    },
    {
        id: 9,
        title: 'Two Sum',
        platform: 'LeetCode',
        difficulty: 'Easy',
        topic: 'Arrays',
        pattern: 'Hash Map',
        url: 'https://leetcode.com/problems/two-sum/'
    },
    {
        id: 10,
        title: 'Valid Anagram',
        platform: 'HackerRank',
        difficulty: 'Easy',
        topic: 'Strings',
        pattern: 'Hash Map',
        url: 'https://www.hackerrank.com/challenges/ctci-making-anagrams/problem'
    },
    {
        id: 11,
        title: 'Minimum Size Subarray Sum',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Arrays',
        pattern: 'Sliding Window',
        url: 'https://leetcode.com/problems/minimum-size-subarray-sum/'
    },
    {
        id: 12,
        title: 'Invert Binary Tree',
        platform: 'LeetCode',
        difficulty: 'Easy',
        topic: 'Trees',
        pattern: 'DFS Recursion',
        url: 'https://leetcode.com/problems/invert-binary-tree/'
    },
    {
        id: 13,
        title: 'Coin Change',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Dynamic Programming',
        pattern: 'Bottom-up DP',
        url: 'https://leetcode.com/problems/coin-change/'
    }
];

const defaultFilters = [
    'All', 'Easy', 'Medium', 'Hard',
    'LeetCode', 'GeeksforGeeks', 'Codeforces'
];

function Recommendations() {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Support deep-linking and pre-filtering from Skill Map or Overview
    const requestedTopic = location.state?.topic || searchParams.get('topic');
    const [activeFilter, setActiveFilter] = useState(() => requestedTopic || 'All');

    const [mlRecommendations, setMlRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userProfileStats, setUserProfileStats] = useState(null);
    const [statusBanner, setStatusBanner] = useState('');

    const [savedProblems, setSavedProblems] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem('dsaforge-saved-problems') || '[]'
            );
        } catch {
            return [];
        }
    });

    const [completedProblems, setCompletedProblems] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem('dsaforge-completed-problems') || '[]'
            );
        } catch {
            return [];
        }
    });

    const [activityData, setActivityData] = useState(() => getActivityData());
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [openReason, setOpenReason] = useState(null);

    // Synchronize activity data across events
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

    // If query parameter changes, update active filter
    useEffect(() => {
        if (requestedTopic) {
            setActiveFilter(requestedTopic);
        }
    }, [requestedTopic]);

    // Fetch live recommendations from ML server
    const fetchLiveRecommendations = async () => {
        setLoading(true);
        setStatusBanner('');
        try {
            const savedHandles = JSON.parse(localStorage.getItem('dsaforge-platform-handles') || '{}');
            const isNewUser = !savedHandles.leetcode && !savedHandles.codeforces && !savedHandles.gfg;

            const payload = isNewUser
                ? { user: "first_time_student", activities: [], top_n: 15 }
                : {
                    leetcode: savedHandles.leetcode || '',
                    gfg: savedHandles.gfg || '',
                    codeforces: savedHandles.codeforces || '',
                    hackerrank: savedHandles.hackerrank || '',
                    codechef: savedHandles.codechef || '',
                    top_n: 30
                  };

            const response = await fetch('http://localhost:8000/api/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.recommendations && data.recommendations.length > 0) {
                    setMlRecommendations(data.recommendations);
                    setUserProfileStats({
                        skillRating: data.skill_rating,
                        targetRating: data.target_rating,
                        mastered: data.mastered_topics || [],
                        frontiers: data.next_frontier_topics || []
                    });
                }
            }
        } catch (err) {
            console.warn('ML Server offline, using fallback catalog:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveRecommendations();
    }, []);

    // Gather all completed problem titles from manual and synced platform history
    const manualActivities = activityData.activities || [];
    const cachedActivities = (() => {
        try {
            return JSON.parse(localStorage.getItem('dsaforge-cached-activities') || '[]');
        } catch {
            return [];
        }
    })();

    const completedTitles = new Set([
        ...manualActivities.map(a => (a.title || '').trim().toLowerCase()),
        ...cachedActivities.map(a => (a.title || '').trim().toLowerCase())
    ].filter(Boolean));

    const isProblemCompleted = (problem) => {
        if (!problem) return false;
        if (completedProblems.includes(problem.id)) return true;
        if (problem.title && completedTitles.has(problem.title.trim().toLowerCase())) return true;
        return false;
    };

    const toggleSaved = (problemId) => {
        const updated = savedProblems.includes(problemId)
            ? savedProblems.filter((id) => id !== problemId)
            : [...savedProblems, problemId];

        setSavedProblems(updated);
        try {
            localStorage.setItem(
                'dsaforge-saved-problems',
                JSON.stringify(updated)
            );
        } catch (e) {
            console.error("Could not save problem:", e);
        }
    };

    // Full end-to-end completion logger
    const markCompleted = (problem) => {
        if (!problem || isProblemCompleted(problem)) return;

        // 1. Mark ID in completed problems
        const updatedCompleted = [...completedProblems, problem.id];
        setCompletedProblems(updatedCompleted);
        try {
            localStorage.setItem(
                'dsaforge-completed-problems',
                JSON.stringify(updatedCompleted)
            );
        } catch (e) {
            console.error("Could not save completed problems:", e);
        }

        // 2. Automatically log to Activity History & increment solved count
        addSolvedProblem({
            title: problem.title,
            platform: problem.platform || 'LeetCode',
            difficulty: problem.difficulty || 'Medium',
            topic: problem.topic || 'Implementation',
            timeMinutes: 25,
            url: problem.url
        });

        // 3. Update local state
        setActivityData(getActivityData());
        setStatusBanner(`✓ "${problem.title}" logged to practice history! Solved count and streak updated.`);
        setTimeout(() => setStatusBanner(''), 4500);
    };

    // Count recorded practice for each topic and pattern
    const getPracticeCount = (problem) => {
        return manualActivities.filter((activity) => {
            const recordedTopic = (activity.topic || '').toLowerCase();
            return (
                recordedTopic === (problem.topic || '').toLowerCase() ||
                recordedTopic === (problem.pattern || '').toLowerCase()
            );
        }).length;
    };

    // 1. Calculate fallback recommendations excluding completed titles and IDs
    const fallbackRecommendations = problemBank
        .filter((problem) => !isProblemCompleted(problem))
        .map((problem) => {
            const practiceCount = getPracticeCount(problem);
            const reason = practiceCount === 0
                ? `You have no recorded practice in ${problem.topic || 'this topic'} yet. Start here to build foundational knowledge.`
                : `You have ${practiceCount} recorded practice session in this area. Keep building with another variation.`;

            return { ...problem, practiceCount, reason };
        })
        .sort((a, b) => a.practiceCount - b.practiceCount);

    // 2. Use ML recommendations if loaded, otherwise fallback to problemBank
    const recommendations = mlRecommendations.length > 0
        ? mlRecommendations.filter((p) => !isProblemCompleted(p))
        : fallbackRecommendations;

    // 3. Filter by Platform, Difficulty, Topic, and Saved status
    const filteredRecommendations = recommendations.filter((problem) => {
        const matchesFilter =
            activeFilter === 'All' ||
            (problem.difficulty || '').toLowerCase() === activeFilter.toLowerCase() ||
            (problem.platform || '').toLowerCase() === activeFilter.toLowerCase() ||
            (problem.topic || '').toLowerCase().includes(activeFilter.toLowerCase()) ||
            activeFilter.toLowerCase().includes((problem.topic || '').toLowerCase());

        const matchesSaved = !showSavedOnly || savedProblems.includes(problem.id);

        return matchesFilter && matchesSaved;
    });

    return (
        <div className="recommendations-page">
            <div className="recommendations-header">
                <div>
                    <h1>Recommended for You</h1>
                    <p>
                        Personalized problems based on your practice history
                        and learning path.
                    </p>
                </div>

                <div className="recommendation-note">
                    <span>💡</span>
                    <p>
                        Recommendations automatically adapt.<br />
                        Solved questions are never recommended twice.
                    </p>
                </div>
            </div>

            {statusBanner && (
                <div style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    color: '#065f46',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    border: '1px solid #a7f3d0'
                }}>
                    {statusBanner}
                </div>
            )}

            <div className="recommendation-stats">
                <div className="recommendation-stat">
                    <span>Available</span>
                    <strong>{recommendations.length}</strong>
                </div>

                <div className="recommendation-stat">
                    <span>Saved</span>
                    <strong>{savedProblems.length}</strong>
                </div>

                <div className="recommendation-stat">
                    <span>Completed</span>
                    <strong>{completedProblems.length + completedTitles.size}</strong>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <button
                    className={`saved-toggle ${showSavedOnly ? 'active' : ''}`}
                    onClick={() => setShowSavedOnly(!showSavedOnly)}
                >
                    {showSavedOnly ? 'Show all problems' : '♡ Show saved problems'}
                </button>

                <button 
                    onClick={fetchLiveRecommendations}
                    disabled={loading}
                    style={{
                        padding: '7px 14px',
                        backgroundColor: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px'
                    }}
                >
                    {loading ? '🔄 Running ML Model...' : '⚡ Re-Rank Recommendations'}
                </button>
            </div>

            <div className="recommendation-filters">
                {defaultFilters.map((filter) => (
                    <button
                        key={filter}
                        className={`filter-btn ${
                            activeFilter === filter ? 'active' : ''
                        }`}
                        onClick={() => {
                            setActiveFilter(filter);
                            setOpenReason(null);
                        }}
                    >
                        {filter}
                    </button>
                ))}

                {/* If arriving from Skill Map with a topic filter like 'Trees & BST' */}
                {!defaultFilters.includes(activeFilter) && (
                    <button
                        className="filter-btn active"
                        onClick={() => {
                            setActiveFilter('All');
                            setOpenReason(null);
                        }}
                    >
                        🎯 {activeFilter} ✕
                    </button>
                )}
            </div>

            {userProfileStats && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13.5px' }}>
                    <strong>🎯 Curriculum Target:</strong> Skill Rating: <b>{userProfileStats.skillRating}</b> | Target Rating: <b>{userProfileStats.targetRating}</b><br/>
                    <span>Mastered Topics: {userProfileStats.mastered.join(', ') || 'Foundations in progress'}</span> | 
                    <span> Current Priority: <b>{userProfileStats.frontiers.join(', ') || 'Two Pointers'}</b></span>
                </div>
            )}

            <div className="recommendation-list">
                {filteredRecommendations.length === 0 ? (
                    <p style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        No problems match your current filter. Try selecting <b>"All"</b> or clear your filter.
                    </p>
                ) : (
                    filteredRecommendations.map((problem) => (
                        <div
                            className="recommendation-card"
                            key={problem.id}
                        >
                            <div
                                className={`platform-icon ${
                                    problem.platform === 'LeetCode'
                                        ? 'leetcode'
                                        : problem.platform === 'Codeforces'
                                          ? 'codeforces'
                                          : 'gfg'
                                }`}
                            >
                                {problem.platform === 'LeetCode'
                                    ? 'LC'
                                    : problem.platform === 'Codeforces'
                                      ? 'CF'
                                      : 'GFG'}
                            </div>

                            <div className="problem-content">
                                <h3>{problem.title}</h3>

                                <div className="problem-tags">
                                    <span className="difficulty">
                                        {problem.difficulty}
                                    </span>
                                    <span>{problem.topic}</span>
                                    {problem.pattern && <span>{problem.pattern}</span>}
                                </div>

                                <p className="recommendation-reason">
                                    <strong>Recommended because:</strong>
                                    {' '}{problem.reason}
                                </p>
                            </div>

                            <div className="problem-action">
                                <a
                                    href={problem.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="solve-btn"
                                >
                                    Solve on {problem.platform} ↗
                                </a>

                                <button
                                    className="why-btn"
                                    onClick={() =>
                                        setOpenReason(
                                            openReason === problem.id
                                                ? null
                                                : problem.id
                                        )
                                    }
                                >
                                    {openReason === problem.id
                                        ? 'Hide reason'
                                        : 'Why this?'}
                                </button>

                                <button
                                    className={`save-btn ${
                                        savedProblems.includes(problem.id) ? 'saved' : ''
                                    }`}
                                    onClick={() => toggleSaved(problem.id)}
                                >
                                    {savedProblems.includes(problem.id)
                                        ? '♥ Saved'
                                        : '♡ Save for later'}
                                </button>

                                <button
                                    className="complete-btn"
                                    disabled={isProblemCompleted(problem)}
                                    onClick={() => markCompleted(problem)}
                                >
                                    {isProblemCompleted(problem)
                                        ? '✓ Completed'
                                        : '✓ Mark completed'}
                                </button>

                                {openReason === problem.id && (
                                    <p className="why-reason">
                                        {problem.reason}
                                        <br />
                                        <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 'bold' }}>
                                            {mlRecommendations.length > 0 
                                                ? `🤖 Ranked by DSAForge LightGBM Engine (Score: ${problem.ml_score || 'High Match'})` 
                                                : '📋 Curated by DSAForge Adaptive Curriculum'}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Recommendations;
