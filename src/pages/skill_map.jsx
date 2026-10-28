import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './skill_map.css';

const topicDetails = {
    'arrays': {
        id: 'arrays',
        title: 'Arrays & Hashing',
        searchTag: 'Arrays',
        tier: 'LEVEL 1 - FOUNDATIONS',
        tierLabel: 'LEVEL 1',
        description: 'The bedrock of algorithmic efficiency. Focuses on contiguous memory patterns, fast hash lookups, and frequency counters.',
        patterns: ['Hash Map Lookup', 'Prefix Sum', "Kadane's Algorithm", 'Frequency Counter', 'Subarray Validation'],
        prereqs: 'None (Starting Point)',
        status: 'focus',
        badge: 'Next Focus'
    },
    'strings': {
        id: 'strings',
        title: 'Strings',
        searchTag: 'Strings',
        tier: 'LEVEL 1 - FOUNDATIONS',
        tierLabel: 'LEVEL 1',
        description: 'ASCII range lookups, palindrome verification, immutable string parsing, and character frequency arrays.',
        patterns: ['Sliding Window Match', 'Two Pointer Reversal', 'KMP String Matching', 'Rolling Hash'],
        prereqs: 'Arrays & Basic Hashing',
        status: 'upcoming',
        badge: 'Up Next'
    },
    'two-pointers': {
        id: 'two-pointers',
        title: 'Two Pointers & Window',
        searchTag: 'Two Pointers',
        tier: 'LEVEL 2 - CORE DATA STRUCTURES',
        tierLabel: 'LEVEL 2',
        description: 'Optimizing O(N²) nested loops down to linear O(N) by managing two boundary index pointers simultaneously.',
        patterns: ['Inward Converging Pointers', 'Dynamic Sliding Window', 'Fast & Slow Pointer', 'Partitioning'],
        prereqs: 'Arrays & Sorting',
        status: 'locked',
        badge: 'Locked'
    },
    'stack-queue': {
        id: 'stack-queue',
        title: 'Stack & Queue',
        searchTag: 'Stack',
        tier: 'LEVEL 2 - CORE DATA STRUCTURES',
        tierLabel: 'LEVEL 2',
        description: 'LIFO and FIFO data structures essential for matching balances, parenthesized syntax, and monotonic ranges.',
        patterns: ['Monotonic Stack', 'Next Greater Element', 'Min Stack Design', 'Circular Buffer Queue'],
        prereqs: 'Arrays & Linked Lists',
        status: 'locked',
        badge: 'Locked'
    },
    'binary-search': {
        id: 'binary-search',
        title: 'Binary Search',
        searchTag: 'Binary Search',
        tier: 'LEVEL 2 - CORE DATA STRUCTURES',
        tierLabel: 'LEVEL 2',
        description: 'Logarithmic O(log N) bisection search across sorted arrays, rotated pivots, and monotonic answer spaces.',
        patterns: ['Rotated Array Pivot Bisection', 'Binary Search on Answer Space', 'Matrix Binary Search', 'Lower/Upper Bounds'],
        prereqs: 'Arrays & Sorting',
        status: 'locked',
        badge: 'Locked'
    },
    'trees': {
        id: 'trees',
        title: 'Trees & BST',
        searchTag: 'Trees',
        tier: 'LEVEL 3 - ADVANCED OPTIMIZATION',
        tierLabel: 'LEVEL 3',
        description: 'Hierarchical node graphs with zero cycles. Master recursive tree properties, traversals, and balance.',
        patterns: ['Level Order Queue BFS', 'Postorder Subtree Propagation', 'BST Range Validation', 'Lowest Common Ancestor'],
        prereqs: 'Recursion, Stack & Queue',
        status: 'locked',
        badge: 'Locked'
    },
    'graphs': {
        id: 'graphs',
        title: 'Graphs & BFS/DFS',
        searchTag: 'Graphs',
        tier: 'LEVEL 3 - ADVANCED OPTIMIZATION',
        tierLabel: 'LEVEL 3',
        description: 'Arbitrary relational nodes connected by edges. Powers mapping, social networks, and dependency compilation.',
        patterns: ['Topological Sort (Kahn)', 'Multi-Source BFS', 'Cycle Detection (DFS)', "Dijkstra's Shortest Path"],
        prereqs: 'Trees, Queue & Hash Sets',
        status: 'locked',
        badge: 'Locked'
    },
    'dp': {
        id: 'dp',
        title: 'Dynamic Programming',
        searchTag: 'Dynamic Programming',
        tier: 'LEVEL 3 - ADVANCED OPTIMIZATION',
        tierLabel: 'LEVEL 3',
        description: 'Breaking complex problems into overlapping subproblems using memoization and bottom-up tabulation.',
        patterns: ['1D Fibonacci Transition', '0/1 & Unbounded Knapsack', 'Longest Common Subsequence', 'Interval DP'],
        prereqs: 'Recursion & Two Pointers',
        status: 'locked',
        badge: 'Locked'
    }
};

export default function SkillMap() {
    const [mlProfile, setMlProfile] = useState(null);
    const [selectedTopicId, setSelectedTopicId] = useState('arrays');

    useEffect(() => {
        const fetchMastery = async () => {
            try {
                const savedHandles = JSON.parse(localStorage.getItem('dsaforge-platform-handles') || '{}');
                const res = await fetch('http://localhost:8000/api/recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        leetcode: savedHandles.leetcode || 'Garima_yaduvanshi',
                        gfg: savedHandles.gfg || '',
                        codeforces: savedHandles.codeforces || '',
                        top_n: 1
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    setMlProfile(data);
                }
            } catch (e) {
                console.warn("Using offline curriculum state:", e);
            }
        };
        fetchMastery();
    }, []);

    const activeDetails = topicDetails[selectedTopicId] || topicDetails['arrays'];

    return (
        <div className="skill-map-page">
            
            {/* 1. TOP CURRICULUM ANALYTICS BANNER */}
            <div className="skill-kpi-bar">
                <div className="skill-kpi-card">
                    <span className="skill-kpi-label">CURRICULUM PROGRESS</span>
                    <div className="skill-progress-row">
                        <div className="skill-progress-track">
                            <div className="skill-progress-fill" style={{ width: '0%' }}></div>
                        </div>
                        <span className="skill-progress-pct">0%</span>
                    </div>
                </div>

                <div className="skill-kpi-card">
                    <span className="skill-kpi-label">MASTERED MODULES</span>
                    <strong className="skill-kpi-highlight">0 of 8 Completed</strong>
                </div>

                <div className="skill-kpi-card">
                    <span className="skill-kpi-label">CURRENT TARGET RATING</span>
                    <strong className="skill-kpi-highlight rating-purple">
                        {mlProfile?.target_rating || 1100} rating <span className="skill-small-sub">(Skill: {mlProfile?.skill_rating || 1000})</span>
                    </strong>
                </div>

                <div className="skill-kpi-card">
                    <span className="skill-kpi-label">NEXT PRIORITY FRONTIER</span>
                    <strong className="skill-kpi-highlight frontier-green">
                        🎯 IMPLEMENTATION
                    </strong>
                </div>
            </div>

            {/* 2. SUBHEADER WITH HINT AND LEGEND */}
            <div className="roadmap-subheader-row">
                <span className="hint-pill">
                    💡 Click on any topic to inspect interview patterns
                </span>
                <div className="roadmap-legend">
                    <span className="legend-item"><span className="legend-dot dot-green"></span> Mastered</span>
                    <span className="legend-item"><span className="legend-dot dot-blue"></span> Focus</span>
                    <span className="legend-item"><span className="legend-dot dot-gray"></span> Locked</span>
                </div>
            </div>

            {/* 3. MAIN WORKSPACE: TIERED ROADMAP (Left) + TOPIC INSPECTOR (Right) */}
            <div className="skill-workspace-grid">
                
                {/* Left: 3-Tier Roadmap */}
                <div className="roadmap-tiers-column">
                    
                    {/* LEVEL 1: FOUNDATIONS */}
                    <div className="tier-section">
                        <h3 className="tier-heading">LEVEL 1 - FOUNDATIONS</h3>
                        <div className="tier-cards-grid grid-2-col">
                            <div 
                                className={`tier-card ${selectedTopicId === 'arrays' ? 'selected' : ''}`}
                                onClick={() => setSelectedTopicId('arrays')}
                            >
                                <div className="tier-card-top">
                                    <span className="level-pill">LEVEL 1</span>
                                    <span className="focus-status-pill next-focus">Next Focus</span>
                                </div>
                                <h4 className="tier-card-title">Arrays & Hashing</h4>
                                <p className="tier-card-desc">
                                    The bedrock of algorithmic efficiency. Focuses on contiguous memory patterns, fast hash lookups, and...
                                </p>
                            </div>

                            <div 
                                className={`tier-card ${selectedTopicId === 'strings' ? 'selected' : ''}`}
                                onClick={() => setSelectedTopicId('strings')}
                            >
                                <div className="tier-card-top">
                                    <span className="level-pill">LEVEL 1</span>
                                    <span className="focus-status-pill up-next">Up Next</span>
                                </div>
                                <h4 className="tier-card-title">Strings</h4>
                                <p className="tier-card-desc">
                                    ASCII range lookups, palindrome verification, immutable string parsing, and character frequency arrays.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* LEVEL 2: CORE DATA STRUCTURES */}
                    <div className="tier-section">
                        <h3 className="tier-heading">LEVEL 2 - CORE DATA STRUCTURES</h3>
                        <div className="tier-cards-grid grid-3-col">
                            <div 
                                className={`tier-card locked ${selectedTopicId === 'two-pointers' ? 'selected' : ''}`}
                                onClick={() => setSelectedTopicId('two-pointers')}
                            >
                                <div className="tier-card-top">
                                    <span className="level-pill">LEVEL 2</span>
                                    <span className="lock-icon">🔒</span>
                                </div>
                                <h4 className="tier-card-title">Two Pointers & Window</h4>
                            </div>

                            <div 
                                className={`tier-card locked ${selectedTopicId === 'stack-queue' ? 'selected' : ''}`}
                                onClick={() => setSelectedTopicId('stack-queue')}
                            >
                                <div className="tier-card-top">
                                    <span className="level-pill">LEVEL 2</span>
                                    <span className="lock-icon">🔒</span>
                                </div>
                                <h4 className="tier-card-title">Stack & Queue</h4>
                            </div>

                            <div 
                                className={`tier-card locked ${selectedTopicId === 'binary-search' ? 'selected' : ''}`}
                                onClick={() => setSelectedTopicId('binary-search')}
                            >
                                <div className="tier-card-top">
                                    <span className="level-pill">LEVEL 2</span>
                                    <span className="lock-icon">🔒</span>
                                </div>
                                <h4 className="tier-card-title">Binary Search</h4>
                            </div>
                        </div>
                    </div>

                    {/* LEVEL 3: ADVANCED OPTIMIZATION */}
                    <div className="tier-section">
                        <h3 className="tier-heading">LEVEL 3 - ADVANCED OPTIMIZATION</h3>
                        <div className="tier-cards-grid grid-3-col">
                            <div 
                                className={`tier-card locked ${selectedTopicId === 'trees' ? 'selected' : ''}`}
                                onClick={() => setSelectedTopicId('trees')}
                            >
                                <div className="tier-card-top">
                                    <span className="level-pill">LEVEL 3</span>
                                    <span className="lock-icon">🔒</span>
                                </div>
                                <h4 className="tier-card-title">Trees & BST</h4>
                            </div>

                            <div 
                                className={`tier-card locked ${selectedTopicId === 'graphs' ? 'selected' : ''}`}
                                onClick={() => setSelectedTopicId('graphs')}
                            >
                                <div className="tier-card-top">
                                    <span className="level-pill">LEVEL 3</span>
                                    <span className="lock-icon">🔒</span>
                                </div>
                                <h4 className="tier-card-title">Graphs & BFS/DFS</h4>
                            </div>

                            <div 
                                className={`tier-card locked ${selectedTopicId === 'dp' ? 'selected' : ''}`}
                                onClick={() => setSelectedTopicId('dp')}
                            >
                                <div className="tier-card-top">
                                    <span className="level-pill">LEVEL 3</span>
                                    <span className="lock-icon">🔒</span>
                                </div>
                                <h4 className="tier-card-title">Dynamic Programming</h4>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right: Interactive Topic Inspector Panel */}
                <div className="inspector-panel-card">
                    <div className="inspector-badges-row">
                        <span className="inspector-tier-label">{activeDetails.tier}</span>
                        <span className="inspector-focus-tag">CURRENT FOCUS TOPIC</span>
                    </div>

                    <h2 className="inspector-topic-title">{activeDetails.title}</h2>
                    <p className="inspector-topic-desc">{activeDetails.description}</p>

                    <div className="inspector-section-block">
                        <h4 className="inspector-block-heading">🗡️ Core Interview Patterns:</h4>
                        <div className="inspector-patterns-list">
                            {activeDetails.patterns.map((pat, idx) => (
                                <div key={idx} className="pattern-row-card">
                                    <span>• {pat}</span>
                                    <span className="chevron-right">&gt;</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="inspector-section-block">
                        <div className="prereq-block">
                            <span className="prereq-label">📋 Prerequisite Check:</span>
                            <span className="prereq-value">{activeDetails.prereqs}</span>
                        </div>
                    </div>

                    <div className="inspector-action-wrap">
                        <Link 
                            to={`/recommendations?topic=${encodeURIComponent(activeDetails.searchTag || activeDetails.title)}`}
                            state={{ topic: activeDetails.searchTag || activeDetails.title }}
                            className="btn-practice-topic"
                        >
                            Practice {activeDetails.title} Problems ↗
                        </Link>
                    </div>
                </div>

            </div>

        </div>
    );
}
