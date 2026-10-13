
const STORAGE_KEY = "dsaforge-activity-data";
export const ACTIVITY_EVENT = "dsaforge-activity-updated";

// Keep the existing prototype stats consistent with the dashboard.
// The activity history starts empty until problems are recorded.
const DEFAULT_DATA = {
    problemsSolved: 124,
    currentStreak: 14,
    totalMinutes: 0,
    accuracy: 72,
    activities: []
};

function normalizeData(data) {
    return {
        problemsSolved: Number(data.problemsSolved) || 0,
        currentStreak: Number(data.currentStreak) || 0,
        totalMinutes: Number(data.totalMinutes) || 0,
        accuracy: Number(data.accuracy) || 0,
        activities: Array.isArray(data.activities)
            ? data.activities
            : []
    };
}

export function getActivityData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return { ...DEFAULT_DATA, activities: [] };
        }

        return normalizeData(JSON.parse(savedData));
    } catch (error) {
        console.error("Could not read DSAForge activity data:", error);
        return { ...DEFAULT_DATA, activities: [] };
    }
}

export function addSolvedProblem(problem, currentData = getActivityData()) {
    const previousData = normalizeData(currentData);

    const timeMinutes = Math.max(
        0,
        Number(problem.timeMinutes) || 0
    );

    const newActivity = {
        ...problem,
        timeMinutes,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: new Date().toISOString()
    };

    const updatedData = {
        ...previousData,
        problemsSolved: previousData.problemsSolved + 1,
        totalMinutes: previousData.totalMinutes + timeMinutes,
        activities: [newActivity, ...previousData.activities]
    };

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updatedData)
        );

        window.dispatchEvent(
            new Event(ACTIVITY_EVENT)
        );
    } catch (error) {
        console.error("Could not save DSAForge activity data:", error);
    }

    return updatedData;
}
