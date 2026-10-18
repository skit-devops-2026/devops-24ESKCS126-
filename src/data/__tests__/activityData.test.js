import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getActivityData,
    addSolvedProblem,
    ACTIVITY_EVENT
} from '../activityData.js';

const STORAGE_KEY = 'dsaforge-activity-data';

describe('DSAForge activity data', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('returns default stats when no saved data exists', () => {
        const data = getActivityData();

        expect(data.problemsSolved).toBe(124);
        expect(data.currentStreak).toBe(14);
        expect(data.totalMinutes).toBe(0);
        expect(data.accuracy).toBe(72);
        expect(data.activities).toEqual([]);
    });

    it('adds a solved problem and updates the total time', () => {
        const initialData = getActivityData();

        const updatedData = addSolvedProblem(
            {
                title: 'Two Sum',
                timeMinutes: 20
            },
            initialData
        );

        expect(updatedData.problemsSolved).toBe(125);
        expect(updatedData.totalMinutes).toBe(20);
        expect(updatedData.activities).toHaveLength(1);
        expect(updatedData.activities[0].title).toBe('Two Sum');
    });

    it('saves updated data to localStorage', () => {
        addSolvedProblem({
            title: 'Binary Search',
            timeMinutes: 15
        });

        const savedData = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        expect(savedData.problemsSolved).toBe(125);
        expect(savedData.totalMinutes).toBe(15);
        expect(savedData.activities[0].title).toBe('Binary Search');
    });

    it('dispatches an activity update event', () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        addSolvedProblem({
            title: 'Valid Parentheses',
            timeMinutes: 10
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ACTIVITY_EVENT
            })
        );
    });

    it('handles invalid saved JSON without crashing', () => {
        localStorage.setItem(STORAGE_KEY, '{invalid json');

        const data = getActivityData();

        expect(data.problemsSolved).toBe(124);
        expect(data.activities).toEqual([]);
    });

    it('prevents negative time from reducing the total', () => {
        const updatedData = addSolvedProblem(
            {
                title: 'Arrays',
                timeMinutes: -10
            },
            getActivityData()
        );

        expect(updatedData.totalMinutes).toBe(0);
        expect(updatedData.problemsSolved).toBe(125);
    });
});