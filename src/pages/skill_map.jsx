import { useState, useEffect } from 'react';
import { 
    ReactFlow, 
    Controls, 
    Background, 
    BackgroundVariant 
} from '@xyflow/react';
import { Link } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import './skill_map.css';

// Rich metadata for each topic inspector
const topicDetails = {
    'arrays': {
        title: 'Arrays & Hashing',
        searchTag: 'Arrays',
        tier: 'Level 1 - Foundations',
        description: 'The foundation of all algorithmic problem solving. Focuses on contiguous memory, lookup tables, and frequency tracking.',
        patterns: ['Hash Map Lookup', 'Prefix Sum', "Kadane's Algorithm", 'Frequency Counter', 'Subarray Validation'],
        prereqs: 'None (Starting Point)',
        difficulty: 'Easy to Medium'
    },
    'strings': {
        title: 'Strings',
        searchTag: 'Strings',
        tier: 'Level 1 - Foundations',
        description: 'Character manipulation, palindrome symmetry, anagram verification, and substring searching.',
        patterns: ['Sliding Window Match', 'Two Pointer Reversal', 'KMP String Matching', 'Rolling Hash'],
        prereqs: 'Arrays & Basic Hashing',
        difficulty: 'Easy to Medium'
    },
    'two-pointers': {
        title: 'Two Pointers & Sliding Window',
        searchTag: 'Two Pointers',
        tier: 'Level 2 - Core Techniques',
        description: 'Optimizing O(N²) nested loops down to linear O(N) by managing two boundary index pointers simultaneously.',
        patterns: ['Inward Converging Pointers', 'Dynamic Sliding Window', 'Fast & Slow Pointer', 'Partitioning'],
        prereqs: 'Arrays & Sorting',
        difficulty: 'Medium'
    },
    'stack-queue': {
        title: 'Stack & Queue',
        searchTag: 'Stack',
        tier: 'Level 2 - Core Techniques',
        description: 'LIFO and FIFO data structures essential for matching balances, parenthesized syntax, and monotonic ranges.',
        patterns: ['Monotonic Stack', 'Next Greater Element', 'Min Stack Design', 'Circular Buffer Queue'],
        prereqs: 'Arrays & Linked Lists',
        difficulty: 'Medium'
    },
    'binary-search': {
        title: 'Binary Search',
        searchTag: 'Binary Search',
        tier: 'Level 2 - Core Techniques',
        description: 'Logarithmic O(log N) bisection search across sorted arrays, rotated pivots, and monotonic answer spaces.',
        patterns: ['Rotated Array Pivot Bisection', 'Binary Search on Answer Space', 'Matrix Binary Search', 'Lower/Upper Bounds'],
        prereqs: 'Arrays & Sorting',
        difficulty: 'Medium'
    },
    'trees': {
        title: 'Trees & BST',
        searchTag: 'Trees',
        tier: 'Level 3 - Advanced Structures',
        description: 'Hierarchical node graphs with zero cycles. Master recursive tree properties, traversals, and balance.',
        patterns: ['Level Order Queue BFS', 'Postorder Subtree Propagation', 'BST Range Validation', 'Lowest Common Ancestor'],
        prereqs: 'Recursion, Stack & Queue',
        difficulty: 'Medium to Hard'
    },
    'graphs': {
        title: 'Graphs & BFS/DFS',
        searchTag: 'Graphs',
        tier: 'Level 3 - Advanced Structures',
        description: 'Arbitrary relational nodes connected by edges. Powers mapping, social networks, and dependency compilation.',
        patterns: ['Topological Sort (Kahn)', 'Multi-Source BFS', 'Cycle Detection (DFS)', "Dijkstra's Shortest Path"],
        prereqs: 'Trees, Queue & Hash Sets',
        difficulty: 'Medium to Hard'
    },
    'dp': {
        title: 'Dynamic Programming',
        searchTag: 'Dynamic Programming',
        tier: 'Level 3 - Advanced Techniques',
        description: 'Breaking complex problems into overlapping subproblems using memoization and bottom-up tabulation.',
        patterns: ['1D Fibonacci Transition', '0/1 & Unbounded Knapsack', 'Longest Common Subsequence', 'Interval DP'],
        prereqs: 'Recursion & Two Pointers',
        difficulty: 'Hard'
    }
};

const curriculumNodes = [
    { id: 'arrays', position: { x: 40, y: 80 }, data: { label: 'Arrays & Hashing', topicKey: 'implementation', tier: 'Level 1' } },
    { id: 'strings', position: { x: 40, y: 280 }, data: { label: 'Strings', topicKey: 'strings', tier: 'Level 1' } },
    { id: 'two-pointers', position: { x: 360, y: 40 }, data: { label: 'Two Pointers & Window', topicKey: 'two pointers', tier: 'Level 2' } },
    { id: 'stack-queue', position: { x: 360, y: 190 }, data: { label: 'Stack & Queue', topicKey: 'data structures', tier: 'Level 2' } },
    { id: 'binary-search', position: { x: 360, y: 340 }, data: { label: 'Binary Search', topicKey: 'binary search', tier: 'Level 2' } },
    { id: 'trees', position: { x: 720, y: 60 }, data: { label: 'Trees & BST', topicKey: 'trees', tier: 'Level 3' } },
    { id: 'graphs', position: { x: 720, y: 210 }, data: { label: 'Graphs & BFS/DFS', topicKey: 'graphs', tier: 'Level 3' } },
    { id: 'dp', position: { x: 720, y: 360 }, data: { label: 'Dynamic Programming', topicKey: 'dp', tier: 'Level 3' } }
];

const curriculumEdges = [
    { id: 'e-arrays-twopointers', source: 'arrays', target: 'two-pointers' },
    { id: 'e-arrays-stack', source: 'arrays', target: 'stack-queue' },
    { id: 'e-strings-twopointers', source: 'strings', target: 'two-pointers' },
    { id: 'e-arrays-binarysearch', source: 'arrays', target: 'binary-search' },
    { id: 'e-stack-trees', source: 'stack-queue', target: 'trees' },
    { id: 'e-trees-graphs', source: 'trees', target: 'graphs' },
    { id: 'e-twopointers-dp', source: 'two-pointers', target: 'dp' },
    { id: 'e-binarysearch-dp', source: 'binary-search', target: 'dp' }
];

function SkillMap() {
    const [mlProfile, setMlProfile] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState('two-pointers'); // Default inspection

    useEffect(() => {
        const fetchMastery = async () => {
            try {
                const savedHandles = JSON.parse(localStorage.getItem('dsaforge-platform-handles') || '{}');
                const res = await fetch('http://localhost:8000/api/recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        leetcode: savedHandles.leetcode || '',
                        gfg: savedHandles.gfg || '',
                        codeforces: savedHandles.codeforces || '',
                        top_n: 1
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    setMlProfile(data);
                    if (data.next_frontier_topics?.[0]) {
                        // Select current focus by default
                        const focusKey = data.next_frontier_topics[0].toLowerCase();
                        const matchingNode = curriculumNodes.find(n => n.data.topicKey.includes(focusKey));
                        if (matchingNode) setSelectedNodeId(matchingNode.id);
                    }
                }
            } catch (e) {
                console.warn("Using offline curriculum state:", e);
            }
        };
        fetchMastery();
    }, []);

    const masteredTopics = (mlProfile?.mastered_topics || []).map(t => t.toLowerCase());
    const nextFrontiers = (mlProfile?.next_frontier_topics || []).map(t => t.toLowerCase());
    const currentFocus = nextFrontiers[0] || 'two pointers';

    const getNodeStatus = (key) => {
        const k = key.toLowerCase();
        if (masteredTopics.includes(k) || (k === 'implementation' && (masteredTopics.includes('implementation') || masteredTopics.length > 0))) {
            return 'mastered';
        }
        if (k === currentFocus || nextFrontiers.slice(0, 2).includes(k)) {
            return 'focus';
        }
        return 'locked';
    };

    // Calculate overall completion percentage
    const totalNodes = curriculumNodes.length;
    const completedCount = curriculumNodes.filter(n => getNodeStatus(n.data.topicKey) === 'mastered').length;
    const progressPercent = Math.round((completedCount / totalNodes) * 100);

    // Build Node objects
    const nodes = curriculumNodes.map(node => {
        const status = getNodeStatus(node.data.topicKey);
        const isSelected = node.id === selectedNodeId;
        let badge = '';

        if (status === 'mastered') badge = '✓ Completed';
        else if (status === 'focus') badge = '🎯 Next Focus';
        else badge = '🔒 Up Next';

        return {
            ...node,
            className: `curriculum-node status-${status} ${isSelected ? 'node-selected' : ''}`,
            data: {
                label: (
                    <div className="roadmap-node-content">
                        <span className="node-tier">{node.data.tier}</span>
                        <strong className="node-title">{node.data.label}</strong>
                        <span className={`status-pill pill-${status}`}>{badge}</span>
                    </div>
                )
            }
        };
    });

    // Build Edges
    const edges = curriculumEdges.map(edge => {
        const sourceNode = curriculumNodes.find(n => n.id === edge.source);
        const targetNode = curriculumNodes.find(n => n.id === edge.target);

        const sourceStatus = getNodeStatus(sourceNode.data.topicKey);
        const targetStatus = getNodeStatus(targetNode.data.topicKey);

        let strokeColor = '#cbd5e1';
        let isAnimated = false;
        let strokeWidth = 1.5;
        let strokeDasharray = '5 5';

        if (sourceStatus === 'mastered' && targetStatus === 'mastered') {
            strokeColor = '#10b981';
            strokeWidth = 2.5;
            strokeDasharray = undefined;
        } else if (targetStatus === 'focus') {
            strokeColor = '#7c3aed';
            isAnimated = true;
            strokeWidth = 3;
            strokeDasharray = undefined;
        }

        return {
            ...edge,
            type: 'smoothstep',
            animated: isAnimated,
            style: { stroke: strokeColor, strokeWidth, strokeDasharray }
        };
    });

    const activeDetails = topicDetails[selectedNodeId] || topicDetails['two-pointers'];
    const activeStatus = getNodeStatus(curriculumNodes.find(n => n.id === selectedNodeId)?.data?.topicKey || '');

    return (
        <div className='skill-map-page'>
            
            {/* 1. TOP CURRICULUM ANALYTICS BANNER */}
            <div className="curriculum-kpi-bar">
                <div className="kpi-card">
                    <span className="kpi-label">Curriculum Progress</span>
                    <div className="progress-wrapper">
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className="kpi-value">{progressPercent}%</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <span className="kpi-label">Mastered Modules</span>
                    <strong className="kpi-highlight">{completedCount} of {totalNodes} Completed</strong>
                </div>

                <div className="kpi-card">
                    <span className="kpi-label">Current Target Rating</span>
                    <strong className="kpi-highlight" style={{ color: '#7c3aed' }}>
                        {mlProfile?.target_rating || 1100} rating (Skill: {mlProfile?.skill_rating || 1000})
                    </strong>
                </div>

                <div className="kpi-card">
                    <span className="kpi-label">Next Priority Frontier</span>
                    <strong className="kpi-highlight" style={{ color: '#059669' }}>
                        🎯 {currentFocus.toUpperCase()}
                    </strong>
                </div>
            </div>

            {/* 2. MAIN WORKSPACE: CANVAS (Left) + TOPIC INSPECTOR (Right) */}
            <div className="skill-map-workspace">
                
                {/* Visual Roadmap Canvas */}
                <div className="mindmap-container">
                    <div className="canvas-header-bar">
                        <span className="hint-text">💡 Click on any topic to inspect interview patterns</span>
                        <div className="skill-legend">
                            <span className="legend-item"><span className="dot dot-mastered"></span> ✓ Mastered</span>
                            <span className="legend-item"><span className="dot dot-focus"></span> 🎯 Focus</span>
                            <span className="legend-item"><span className="dot dot-locked"></span> 🔒 Locked</span>
                        </div>
                    </div>

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        fitView
                        zoomOnScroll={false}
                        panOnScroll={false}
                        panOnDrag={true}
                        preventScrolling={false}
                        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
                        <Controls showInteractive={false} />
                    </ReactFlow>
                </div>

                {/* 3. INTERACTIVE TOPIC INSPECTOR SIDE DRAWER */}
                <div className="topic-inspector-panel">
                    <div className="inspector-header">
                        <span className="inspector-tier">{activeDetails.tier}</span>
                        <h2>{activeDetails.title}</h2>
                        <span className={`status-pill pill-${activeStatus}`} style={{ marginTop: '8px' }}>
                            {activeStatus === 'mastered' ? '✓ Mastered by ML Analysis' : activeStatus === 'focus' ? '🎯 Current Focus Topic' : '🔒 Locked / Upcoming Topic'}
                        </span>
                    </div>

                    <div className="inspector-section">
                        <p className="inspector-desc">{activeDetails.description}</p>
                    </div>

                    <div className="inspector-section">
                        <h4>🔑 Core Interview Patterns:</h4>
                        <div className="pattern-tags-list">
                            {activeDetails.patterns.map((pat, idx) => (
                                <span key={idx} className="pattern-chip">
                                    • {pat}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="inspector-section">
                        <h4>📋 Prerequisite Check:</h4>
                        <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                            {activeDetails.prereqs}
                        </p>
                    </div>

                    <div className="inspector-footer">
                        <Link 
                            to={`/recommendations?topic=${encodeURIComponent(activeDetails.searchTag || activeDetails.title)}`}
                            state={{ topic: activeDetails.searchTag || activeDetails.title }}
                            className="practice-topic-btn"
                        >
                            Practice {activeDetails.title} Problems →
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default SkillMap;
