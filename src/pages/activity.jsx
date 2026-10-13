
import { useState } from "react";
import "./activity.css";
import {
    getActivityData,
    addSolvedProblem
} from "../data/activityData";
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
    const [platformFilter, setPlatformFilter] = useState("All");
    const [difficultyFilter, setDifficultyFilter] = useState("All");

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

        if (!problem.title || !problem.topic) {
            return;
        }

        const updatedData = addSolvedProblem(problem, data);
        setData(updatedData);
        form.reset();
    }

    function formatTime(dateString) {
        const date = new Date(dateString);
        const today = new Date();

        const todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        const activityStart = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

        const difference = Math.round(
            (todayStart - activityStart) / 86400000
        );

        if (difference === 0) return "Today";
        if (difference === 1) return "Yesterday";
        return `${difference} days ago`;
    }

    const hours = Math.floor(data.totalMinutes / 60);
    const minutes = data.totalMinutes % 60;
    const [period, setPeriod] = useState("7");

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

            const count = data.activities.filter((activity) => {
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
    const topicData = Object.values(
        data.activities.reduce((topics, activity) => {
            const topic = activity.topic || "Other";

            if (!topics[topic]) {
                topics[topic] = {
                    name: topic,
                    count: 0
                };
            }

            topics[topic].count += 1;

            return topics;
        }, {})
    ).sort((a, b) => b.count - a.count);

    const filteredActivities = data.activities.filter((activity) => {
        const matchesPlatform =
            platformFilter === "All" ||
            activity.platform === platformFilter;

        const matchesDifficulty =
            difficultyFilter === "All" ||
            activity.difficulty === difficultyFilter;

        return matchesPlatform && matchesDifficulty;
    });

    return (
        <div className="activity-page">
            <div className="activity-header">
                <div>
                    <h1>Your Activity</h1>
                    <p>Track your coding journey and progress over time.</p>
                </div>
            </div>

            <div className="activity-stats">
                <div className="activity-stat-card">
                    <p className="activity-stat-title">Problems Solved</p>
                    <h2>{data.problemsSolved}</h2>
                    <span>Across platforms</span>
                </div>

                <div className="activity-stat-card">
                    <p className="activity-stat-title">Current Streak</p>
                    <h2>{data.currentStreak} days</h2>
                    <span>Keep going!</span>
                </div>

                <div className="activity-stat-card">
                    <p className="activity-stat-title">Total Time</p>
                    <h2>
                        {hours} hrs{minutes > 0 ? ` ${minutes} min` : ""}
                    </h2>
                    <span>Time spent solving</span>
                </div>

                <div className="activity-stat-card">
                    <p className="activity-stat-title">Accuracy</p>
                    <h2>{data.accuracy}%</h2>
                    <span>Practice performance</span>
                </div>
            </div>

            <div className="activity-section">
                <div className="section-heading">
                    <h2>Weekly Coding Activity</h2>

                    <select
                        className="activity-period-select"
                        value={period}
                        onChange={(event) => setPeriod(event.target.value)}
                        aria-label="Select activity period"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                    </select>
                </div>

                <div className="activity-chart">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#eeeaf5"
                            />

                            <XAxis
                                dataKey="day"
                                tick={{ fill: "#77718f", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                interval={period === "30" ? 4 : 0}
                            />

                            <YAxis
                                allowDecimals={false}
                                domain={[0, "auto"]}
                                tick={{ fill: "#77718f", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <Tooltip
                                cursor={{ fill: "#f5f0ff" }}
                                contentStyle={{
                                    borderRadius: "10px",
                                    border: "1px solid #e6e0f2",
                                    fontSize: "12px"
                                }}
                                formatter={(value) => [
                                    value,
                                    "Problems recorded"
                                ]}
                            />

                            <Bar
                                dataKey="solved"
                                fill="#7950cf"
                                radius={[5, 5, 0, 0]}
                                maxBarSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="activity-section">
                <div className="section-heading">
                    <h2>Topic-wise Progress</h2>
                    <span>{topicData.length} topics</span>
                </div>

                {topicData.length === 0 ? (
                    <p className="topic-empty">
                        Record a solved problem to see your topic progress.
                    </p>
                ) : (
                    <div className="topic-progress-list">
                        {topicData.map((topic) => {
                            const maxCount = Math.max(
                                ...topicData.map((item) => item.count)
                            );

                            const progress = (topic.count / maxCount) * 100;

                            return (
                                <div className="topic-progress-item" key={topic.name}>
                                    <div className="topic-progress-label">
                                        <span>{topic.name}</span>
                                        <span>{topic.count} practiced</span>
                                    </div>

                                    <div
                                        className="topic-progress-track"
                                        role="progressbar"
                                        aria-label={`${topic.name} practice count`}
                                        aria-valuemin={0}
                                        aria-valuemax={maxCount}
                                        aria-valuenow={topic.count}
                                    >
                                        <div
                                            className="topic-progress-fill"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="activity-section">
                <div className="section-heading">
                    <h2>Record a Solved Problem</h2>
                </div>

                <form className="activity-form" onSubmit={handleSubmit}>
                    <input
                        name="title"
                        placeholder="Problem name"
                        required
                    />


                    <select name="topic" required>
                        <option value="Arrays">Arrays</option>
                        <option value="Strings">Strings</option>
                        <option value="Hashing">Hashing</option>
                        <option value="Two Pointers">Two Pointers</option>
                        <option value="Sliding Window">Sliding Window</option>
                        <option value="Binary Search">Binary Search</option>
                        <option value="Sorting">Sorting</option>
                        <option value="Linked List">Linked List</option>
                        <option value="Stack">Stack</option>
                        <option value="Queue">Queue</option>
                        <option value="Recursion">Recursion</option>
                        <option value="Backtracking">Backtracking</option>
                        <option value="Trees">Trees</option>
                        <option value="Binary Search Tree">Binary Search Tree</option>
                        <option value="Heap">Heap</option>
                        <option value="Graphs">Graphs</option>
                        <option value="Dynamic Programming">Dynamic Programming</option>
                        <option value="Greedy">Greedy</option>
                        <option value="Trie">Trie</option>
                        <option value="Bit Manipulation">Bit Manipulation</option>
                        <option value="Math">Math</option>
                        <option value="Other">Other</option>
                    </select>


                    <select name="platform" defaultValue="LeetCode">
                        <option>LeetCode</option>
                        <option>HackerRank</option>
                        <option>Codeforces</option>
                        <option>DSAForge</option>
                        <option>Other</option>
                    </select>

                    <select name="difficulty" defaultValue="Medium">
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                    </select>

                    <input
                        name="timeMinutes"
                        type="number"
                        min="0"
                        placeholder="Minutes spent"
                    />

                    <button type="submit">+ Record Solved Problem</button>
                </form>
            </div>

            <div className="activity-section">
                <div className="section-heading">
                    <h2>Recent Activity</h2>
                    <span>{data.activities.length} records</span>
                </div>

                <div className="activity-list">
                    {data.activities.length === 0 ? (
                        <p>No activity yet. Record your first solved problem!</p>
                    ) : (
                        data.activities.map((activity) => (
                            <div className="activity-item" key={activity.id}>
                                <div className="activity-icon">✓</div>

                                <div className="activity-info">
                                    <h3>
                                        Solved {activity.title}
                                    </h3>
                                    <p>
                                        {activity.platform} ·{" "}
                                        {activity.difficulty} ·{" "}
                                        {activity.topic}
                                    </p>
                                </div>

                                <span className="activity-time">
                                    {formatTime(activity.date)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default Activity;
