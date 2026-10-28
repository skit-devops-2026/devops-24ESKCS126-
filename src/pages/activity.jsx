import { useState, useEffect } from "react";
import "./activity.css";
import { getActivityData, addSolvedProblem } from "../data/activityData";
import { Link } from "react-router-dom";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from "recharts";

function Activity() {
    const [data, setData] = useState(() => getActivityData());
    const [searchQuery, setSearchQuery] = useState("");
    const [platformFilter, setPlatformFilter] = useState("All");
    const [difficultyFilter, setDifficultyFilter] = useState("All");
    const [period, setPeriod] = useState("7");
    const [syncing, setSyncing] = useState(false);
    const [syncSuccessMessage, setSyncSuccessMessage] = useState("");

    // Load saved handles
    const savedHandles = (() => {
        try {
            return JSON.parse(localStorage.getItem('dsaforge-platform-handles') || '{}');
        } catch {
            return {};
        }
    })();

    // 1. Cached activities to prevent blank screens
    const [liveActivities, setLiveActivities] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dsaforge-cached-activities') || '[]');
        } catch {
            return [];
        }
    });

    const [totalSolvedCount, setTotalSolvedCount] = useState(() => {
        const cached = localStorage.getItem('dsaforge-cached-total-solved');
        return cached ? Number(cached) : data.problemsSolved;
    });

    // 2. Fetch Live Solved Problems from Python ML Backend
    const fetchPlatformActivities = async () => {
        setSyncing(true);
        setSyncSuccessMessage("");
        try {
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
                const result = await res.json();
                if (result.total_solved !== undefined) {
                    setTotalSolvedCount(result.total_solved);
                    localStorage.setItem('dsaforge-cached-total-solved', result.total_solved);
                }
                if (result.recent_activities && result.recent_activities.length > 0) {
                    setLiveActivities(result.recent_activities);
                    localStorage.setItem('dsaforge-cached-activities', JSON.stringify(result.recent_activities));
                    setSyncSuccessMessage(`✓ Synced ${result.recent_activities.length} problems from connected platforms!`);
                } else {
                    setSyncSuccessMessage("✓ Platforms checked! Profile up to date.");
                }
            }
        } catch (err) {
            console.warn("Could not fetch live platform activities:", err);
            setSyncSuccessMessage("⚠️ Backend server offline. Using local cached data.");
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncSuccessMessage(""), 5000);
        }
    };

    useEffect(() => {
        fetchPlatformActivities();
    }, []);

    // Combine manual recorded activities with live platform activities
    const combinedActivities = [
        ...data.activities,
        ...liveActivities.map((act, idx) => ({
            id: `platform-${idx}-${act.title}`,
            title: act.title,
            platform: act.platform || "LeetCode",
            difficulty: act.difficulty || "Medium",
            topic: act.topic ? act.topic.charAt(0).toUpperCase() + act.topic.slice(1) : "Implementation",
            date: act.timestamp 
                ? new Date(act.timestamp * 1000).toISOString() 
                : new Date(Date.now() - idx * 28800000).toISOString(), // nicely distributed across recent days
            url: act.url || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(act.title)}`,
            timeMinutes: 25
        }))
    ];

    function handleSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);

        const problem = {
            title: formData.get("title").trim(),
            platform: formData.get("platform"),
            difficulty: formData.get("difficulty"),
            topic: formData.get("topic").trim(),
            timeMinutes: Number(formData.get("timeMinutes")) || 0
        };

        if (!problem.title || !problem.topic) return;

        const updatedData = addSolvedProblem(problem, data);
        setData(updatedData);
        setTotalSolvedCount(prev => prev + 1);
        form.reset();
    }

    function formatTime(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const activityStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const difference = Math.round((todayStart - activityStart) / 86400000);

        if (difference === 0) return "Today";
        if (difference === 1) return "Yesterday";
        if (difference < 0) return "Today";
        return `${difference} days ago`;
    }

    // Chart Data based on combined activities
    const chartData = (() => {
        const days = Number(period);
        const today = new Date();
        const result = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - i);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = combinedActivities.filter((activity) => {
                const activityDate = new Date(activity.date);
                return activityDate >= date && activityDate < nextDate;
            }).length;

            result.push({
                day: date.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short"
                }),
                solved: count
            });
        }
        return result;
    })();

    // Topic aggregation
    const topicData = Object.values(
        combinedActivities.reduce((topics, activity) => {
            const topic = activity.topic || "Implementation";
            if (!topics[topic]) {
                topics[topic] = { name: topic, count: 0 };
            }
            topics[topic].count += 1;
            return topics;
        }, {})
    ).sort((a, b) => b.count - a.count);

    // Difficulty Breakdown counts
    const easyCount = combinedActivities.filter(a => (a.difficulty || '').toLowerCase() === 'easy').length;
    const medCount = combinedActivities.filter(a => (a.difficulty || '').toLowerCase() === 'medium').length;
    const hardCount = combinedActivities.filter(a => (a.difficulty || '').toLowerCase() === 'hard').length;
    const totalDiffCount = easyCount + medCount + hardCount || 1;

    // Filter activities for table
    const filteredActivities = combinedActivities.filter((activity) => {
        const matchesSearch = !searchQuery || activity.title.toLowerCase().includes(searchQuery.toLowerCase()) || (activity.topic || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = platformFilter === "All" || activity.platform.toLowerCase() === platformFilter.toLowerCase();
        const matchesDifficulty = difficultyFilter === "All" || activity.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
        return matchesSearch && matchesPlatform && matchesDifficulty;
    });

    return (
        <div className="activity-page">
            
            {/* 1. HEADER & SYNC BUTTON */}
            <div className="activity-header">
                <div>
                    <h1>Coding Activity & History</h1>
                    <p>Live synchronized performance across your competitive programming handles.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <button 
                        onClick={fetchPlatformActivities}
                        disabled={syncing}
                        className="sync-platforms-btn"
                    >
                        {syncing ? '🔄 Syncing Live Data...' : '⚡ Sync Platforms Now'}
                    </button>
                    {syncSuccessMessage && (
                        <span style={{ fontSize: '12px', color: syncSuccessMessage.startsWith('⚠️') ? '#b45309' : '#15803d', fontWeight: 'bold' }}>
                            {syncSuccessMessage}
                        </span>
                    )}
                </div>
            </div>

            {/* 2. PLATFORM CONNECTIONS STRIP */}
            <div className="platform-status-strip">
                <div className={`platform-status-card ${savedHandles.leetcode ? 'active' : 'inactive'}`}>
                    <div className="platform-status-icon leetcode-bg">LC</div>
                    <div>
                        <strong>LeetCode</strong>
                        <p>{savedHandles.leetcode ? `@${savedHandles.leetcode} (Connected)` : 'Not Connected'}</p>
                    </div>
                    <span className="status-indicator-dot"></span>
                </div>

                <div className={`platform-status-card ${savedHandles.codeforces ? 'active' : 'inactive'}`}>
                    <div className="platform-status-icon cf-bg">CF</div>
                    <div>
                        <strong>Codeforces</strong>
                        <p>{savedHandles.codeforces ? `@${savedHandles.codeforces}` : 'Not Connected'}</p>
                    </div>
                    <span className="status-indicator-dot"></span>
                </div>

                <div className={`platform-status-card ${savedHandles.gfg ? 'active' : 'inactive'}`}>
                    <div className="platform-status-icon gfg-bg">GFG</div>
                    <div>
                        <strong>GeeksforGeeks</strong>
                        <p>{savedHandles.gfg ? `@${savedHandles.gfg}` : 'Not Connected'}</p>
                    </div>
                    <span className="status-indicator-dot"></span>
                </div>

                <Link to="/profile" className="manage-handles-link">
                    ⚙️ Manage Handles →
                </Link>
            </div>

            {/* 3. TOP KPI CARDS */}
            <div className="activity-stats">
                <div className="activity-stat-card">
                    <p className="activity-stat-title">Total Solved</p>
                    <h2>{totalSolvedCount}</h2>
                    <span>Across connected platforms</span>
                </div>

                <div className="activity-stat-card">
                    <p className="activity-stat-title">Current Streak</p>
                    <h2>🔥 {data.currentStreak} days</h2>
                    <span>Consistent practice streak</span>
                </div>

                <div className="activity-stat-card">
                    <p className="activity-stat-title">Recent Synced</p>
                    <h2>{combinedActivities.length}</h2>
                    <span>Problems in active memory</span>
                </div>

                <div className="activity-stat-card">
                    <p className="activity-stat-title">Practice Accuracy</p>
                    <h2>{data.accuracy}%</h2>
                    <span>First-attempt pass rate</span>
                </div>
            </div>

            {/* 4. ACTIVITY HEATMAP & DIFFICULTY BREAKDOWN (2-COLUMN GRID) */}
            <div className="activity-grid-two-col">
                
                {/* Solved Frequency Chart */}
                <div className="activity-section">
                    <div className="section-heading">
                        <h2>Weekly Practice Frequency</h2>
                        <select
                            className="activity-period-select"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                        </select>
                    </div>

                    <div className="activity-chart">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eeeaf5" />
                                <XAxis dataKey="day" tick={{ fill: "#77718f", fontSize: 11 }} axisLine={false} tickLine={false} interval={period === "30" ? 4 : 0} />
                                <YAxis allowDecimals={false} domain={[0, "auto"]} tick={{ fill: "#77718f", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: "#f5f0ff" }} contentStyle={{ borderRadius: "10px", border: "1px solid #e6e0f2", fontSize: "12px" }} formatter={(value) => [value, "Problems solved"]} />
                                <Bar dataKey="solved" fill="#7950cf" radius={[6, 6, 0, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Difficulty Distribution Breakdown */}
                <div className="activity-section">
                    <div className="section-heading">
                        <h2>Difficulty Distribution</h2>
                        <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>{combinedActivities.length} Analysed</span>
                    </div>

                    <div className="diff-breakdown-container">
                        <div className="diff-bar-stacked">
                            <div className="diff-segment easy" style={{ width: `${(easyCount / totalDiffCount) * 100}%` }} title={`Easy: ${easyCount}`}></div>
                            <div className="diff-segment medium" style={{ width: `${(medCount / totalDiffCount) * 100}%` }} title={`Medium: ${medCount}`}></div>
                            <div className="diff-segment hard" style={{ width: `${(hardCount / totalDiffCount) * 100}%` }} title={`Hard: ${hardCount}`}></div>
                        </div>

                        <div className="diff-legend-rows">
                            <div className="diff-legend-row">
                                <span className="diff-badge-pill easy">Easy</span>
                                <strong>{easyCount} problems</strong>
                                <span className="pct">{Math.round((easyCount / totalDiffCount) * 100)}%</span>
                            </div>
                            <div className="diff-legend-row">
                                <span className="diff-badge-pill medium">Medium</span>
                                <strong>{medCount} problems</strong>
                                <span className="pct">{Math.round((medCount / totalDiffCount) * 100)}%</span>
                            </div>
                            <div className="diff-legend-row">
                                <span className="diff-badge-pill hard">Hard</span>
                                <strong>{hardCount} problems</strong>
                                <span className="pct">{Math.round((hardCount / totalDiffCount) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. TOPIC-WISE PROGRESS */}
            <div className="activity-section">
                <div className="section-heading">
                    <h2>Topic Distribution from Practice</h2>
                    <span>{topicData.length} distinct algorithmic topics detected</span>
                </div>

                {topicData.length === 0 ? (
                    <p className="topic-empty">Connect your coding platforms to see topic distribution.</p>
                ) : (
                    <div className="topic-progress-grid">
                        {topicData.slice(0, 8).map((topic) => {
                            const maxCount = Math.max(...topicData.map((item) => item.count));
                            const progress = (topic.count / maxCount) * 100;

                            return (
                                <div className="topic-progress-card" key={topic.name}>
                                    <div className="topic-progress-label">
                                        <strong>{topic.name}</strong>
                                        <span>{topic.count} solved</span>
                                    </div>
                                    <div className="topic-progress-track">
                                        <div className="topic-progress-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 6. SOLVED PROBLEMS TABLE WITH REAL SEARCH & FILTERS */}
            <div className="activity-section">
                <div className="table-controls-header">
                    <div>
                        <h2>Problem Practice Log</h2>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {filteredActivities.length} problems</span>
                    </div>

                    <div className="table-filters-row">
                        <input 
                            type="text" 
                            placeholder="🔍 Search problems or topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />

                        <select 
                            value={platformFilter} 
                            onChange={(e) => setPlatformFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="All">All Platforms</option>
                            <option value="LeetCode">LeetCode</option>
                            <option value="Codeforces">Codeforces</option>
                            <option value="GeeksforGeeks">GeeksforGeeks</option>
                        </select>

                        <select 
                            value={difficultyFilter} 
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="All">All Difficulties</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>

                <div className="modern-table-container">
                    <table className="modern-activity-table">
                        <thead>
                            <tr>
                                <th>Problem Title</th>
                                <th>Platform</th>
                                <th>Topic Tag</th>
                                <th>Difficulty</th>
                                <th>Activity Time</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredActivities.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                        No problems found matching your search filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredActivities.slice(0, 30).map((act, i) => (
                                    <tr key={act.id || i}>
                                        <td style={{ fontWeight: '600', color: '#1e293b' }}>
                                            {act.title}
                                        </td>
                                        <td>
                                            <span className={`platform-pill ${act.platform.toLowerCase()}`}>
                                                {act.platform}
                                            </span>
                                        </td>
                                        <td style={{ color: '#475569' }}>
                                            <span className="topic-badge">{act.topic}</span>
                                        </td>
                                        <td>
                                            <span className={`diff-pill ${act.difficulty.toLowerCase()}`}>
                                                {act.difficulty}
                                            </span>
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '13px' }}>
                                            {formatTime(act.date)}
                                        </td>
                                        <td>
                                            {act.url && act.url !== '#' ? (
                                                <a href={act.url} target="_blank" rel="noreferrer" className="solve-again-link">
                                                    Solve Again ↗
                                                </a>
                                            ) : (
                                                <span style={{ color: '#cbd5e1' }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 7. MANUAL SESSION FORM */}
            <div className="activity-section">
                <div className="section-heading">
                    <h2>Manual Practice Logger</h2>
                    <span style={{ color: '#64748b' }}>Log problems solved offline or in mock interviews</span>
                </div>
                <form className="activity-form" onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
                    <div className="form-group">
                        <label htmlFor="title">Problem Title</label>
                        <input id="title" name="title" required placeholder="e.g. Trapping Rain Water" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="platform">Platform</label>
                        <select id="platform" name="platform">
                            <option value="LeetCode">LeetCode</option>
                            <option value="GeeksforGeeks">GeeksforGeeks</option>
                            <option value="Codeforces">Codeforces</option>
                            <option value="HackerRank">HackerRank</option>
                            <option value="CodeChef">CodeChef</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="topic">Topic</label>
                        <input id="topic" name="topic" required placeholder="e.g. Dynamic Programming" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="difficulty">Difficulty</label>
                        <select id="difficulty" name="difficulty">
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="timeMinutes">Time (Minutes)</label>
                        <input id="timeMinutes" name="timeMinutes" type="number" defaultValue="25" />
                    </div>
                    <button type="submit" className="activity-submit-btn">Save to Practice History</button>
                </form>
            </div>

        </div>
    );
}

export default Activity;