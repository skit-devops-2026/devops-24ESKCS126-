const STORAGE_KEY = "dsaforge-activity-data";
export const ACTIVITY_EVENT = "dsaforge-activity-updated";

const DEFAULT_DATA = {
    problemsSolved: 0,
    currentStreak: 0,
    totalMinutes: 0,
    accuracy: 0,
    activities: []
};

function calculateStreak(activities) {
    if (!Array.isArray(activities) || activities.length === 0) return 0;

    const uniqueDays = Array.from(new Set(
        activities
            .map(a => {
                if (!a.date && !a.timestamp) return null;
                const d = a.date ? new Date(a.date) : new Date(a.timestamp * 1000);
                return isNaN(d.getTime()) ? null : d.toDateString();
            })
            .filter(Boolean)
    ));

    if (uniqueDays.length === 0) return 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
        return 0;
    }

    let streak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
        const d1 = new Date(uniqueDays[i]);
        const d2 = new Date(uniqueDays[i + 1]);
        const diffDays = Math.round((d1 - d2) / 86400000);
        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

function normalizeData(data) {
    const activities = Array.isArray(data.activities) ? data.activities : [];
    let cachedTotal = 0;
    try {
        cachedTotal = Number(localStorage.getItem('dsaforge-cached-total-solved')) || 0;
    } catch {
        cachedTotal = 0;
    }
    const computedSolved = Math.max(Number(data.problemsSolved) || 0, cachedTotal, activities.length);
    const computedStreak = Number(data.currentStreak) > 0 ? Number(data.currentStreak) : calculateStreak(activities);

    return {
        problemsSolved: computedSolved,
        currentStreak: computedStreak,
        totalMinutes: Number(data.totalMinutes) || 0,
        accuracy: computedSolved > 0 ? (Number(data.accuracy) || 82) : 0,
        activities
    };
}

export function getActivityData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        let cachedActivities = [];
        let cachedTotal = 0;
        try {
            cachedActivities = JSON.parse(localStorage.getItem('dsaforge-cached-activities') || '[]');
            cachedTotal = Number(localStorage.getItem('dsaforge-cached-total-solved')) || 0;
        } catch {
            // ignore localStorage parse errors
        }

        if (!savedData) {
            if (cachedTotal > 0 || cachedActivities.length > 0) {
                return normalizeData({
                    problemsSolved: cachedTotal || cachedActivities.length,
                    currentStreak: calculateStreak(cachedActivities),
                    totalMinutes: cachedActivities.length * 25,
                    accuracy: 82,
                    activities: []
                });
            }
            return { ...DEFAULT_DATA };
        }

        return normalizeData(JSON.parse(savedData));
    } catch (error) {
        console.error("Could not read DSAForge activity data:", error);
        return { ...DEFAULT_DATA };
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

    const newActivities = [newActivity, ...previousData.activities];
    const newStreak = calculateStreak(newActivities) || (previousData.currentStreak + 1);

    const updatedData = {
        ...previousData,
        problemsSolved: previousData.problemsSolved + 1,
        totalMinutes: previousData.totalMinutes + timeMinutes,
        currentStreak: newStreak,
        accuracy: Math.min(100, Math.max(70, previousData.accuracy || 82)),
        activities: newActivities
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
