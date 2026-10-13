import { useState,useEffect } from 'react';
import './recommendations.css';
import { getActivityData } from '../data/activityData';

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
        title: 'Two Sum',
        platform: 'CodeChef',
        difficulty: 'Easy',
        topic: 'Arrays',
        pattern: 'Hash Map',
        url: 'https://www.codechef.com/practice'
    }
];

const filters = [
    'All', 'Easy', 'Medium', 'Hard',
    'LeetCode', 'HackerRank', 'CodeChef'
];

function Recommendations() {
    const [openReason, setOpenReason] = useState(null);
    const [activeFilter, setActiveFilter] = useState('All');

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

    const [showSavedOnly, setShowSavedOnly] = useState(false);

    const toggleSaved = (problemId) => {
        const updated = savedProblems.includes(problemId)
            ? savedProblems.filter((id) => id !== problemId)
            : [...savedProblems, problemId];

        setSavedProblems(updated);
        localStorage.setItem(
            'dsaforge-saved-problems',
            JSON.stringify(updated)
        );
    };

    const markCompleted = (problemId) => {
        if (completedProblems.includes(problemId)) return;

        const updated = [...completedProblems, problemId];
        setCompletedProblems(updated);
        localStorage.setItem(
            'dsaforge-completed-problems',
            JSON.stringify(updated)
        );
    };


    // Read the existing activity history.

    const [activityData, setActivityData] = useState(
        () => getActivityData()
    );

    useEffect(() => {
        function handleActivityUpdate() {
            setActivityData(getActivityData());
        }

        window.addEventListener(
            'dsaforge-activity-updated',
            handleActivityUpdate
        );

        return () => {
            window.removeEventListener(
                'dsaforge-activity-updated',
                handleActivityUpdate
            );
        };
    }, []);

    const activities = activityData.activities || [];

    // Count recorded practice for each topic and pattern.
    const getPracticeCount = (problem) => {
        return activities.filter((activity) => {
            const recordedTopic = (activity.topic || '').toLowerCase();

            return (
                recordedTopic === problem.topic.toLowerCase() ||
                recordedTopic === problem.pattern.toLowerCase()
            );
        }).length;
    };

    // Do not recommend problems already in the activity history.
    const completedTitles = new Set(
        activities.map((activity) =>
            (activity.title || '').trim().toLowerCase()
        )
    );

    const recommendations = problemBank
        .filter((problem) =>
            !completedTitles.has(problem.title.toLowerCase()) &&
            !completedProblems.includes(problem.id)
        )
        .map((problem) => {
            const practiceCount = getPracticeCount(problem);

            let reason;

            if (practiceCount === 0) {
                reason = `You have no recorded practice in ${problem.topic} or ${problem.pattern} yet. Try this problem to broaden your practice.`;
            } else {
                reason = `You have ${practiceCount} recorded practice ${
                    practiceCount === 1 ? 'activity' : 'activities'
                } in this area. Keep building your skills with another problem.`;
            }

            return { ...problem, practiceCount, reason };
        })
        // Less-practised topics appear first.
        .sort((a, b) => a.practiceCount - b.practiceCount);

    const filteredRecommendations = recommendations.filter((problem) => {
        const matchesFilter =
            activeFilter === 'All' ||
            problem.difficulty === activeFilter ||
            problem.platform === activeFilter;

        const matchesSaved =
            !showSavedOnly || savedProblems.includes(problem.id);

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
                        Recommendations adapt to your activity.<br />
                        Keep practising to improve them. 💜
                    </p>
                </div>
            </div>

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
                    <strong>{completedProblems.length}</strong>
                </div>
            </div>

            <button
                className={`saved-toggle ${showSavedOnly ? 'active' : ''}`}
                onClick={() => setShowSavedOnly(!showSavedOnly)}
            >
                {showSavedOnly ? 'Show all problems' : '♡ Show saved problems'}
            </button>

            <div className="recommendation-filters">
                {filters.map((filter) => (
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
            </div>

            <div className="recommendation-list">
                {filteredRecommendations.length === 0 ? (
                    <p>
                        No recommendations available for this filter.
                        Try another filter or add more problems to your
                        recommendation list.
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
                                        : problem.platform === 'HackerRank'
                                          ? 'hackerrank'
                                          : ''
                                }`}
                            >
                                {problem.platform === 'LeetCode'
                                    ? 'LC'
                                    : problem.platform === 'HackerRank'
                                      ? 'H'
                                      : 'CC'}
                            </div>

                            <div className="problem-content">
                                <h3>{problem.title}</h3>

                                <div className="problem-tags">
                                    <span className="difficulty">
                                        {problem.difficulty}
                                    </span>
                                    <span>{problem.topic}</span>
                                    <span>{problem.pattern}</span>
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
                                    disabled={completedProblems.includes(problem.id)}
                                    onClick={() => markCompleted(problem.id)}
                                >
                                    {completedProblems.includes(problem.id)
                                        ? '✓ Completed'
                                        : '✓ Mark completed'}
                                </button>

                                {openReason === problem.id && (
                                    <p className="why-reason">
                                        {problem.reason}
                                        {' '}This is a rule-based recommendation,
                                        not an ML prediction.
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
