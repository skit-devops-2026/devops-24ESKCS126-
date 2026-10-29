import { useState, useEffect } from 'react';
import './profile.css';
import { getActivityData, ACTIVITY_EVENT } from '../data/activityData';

function getSavedProfile() {
    try {
        let authEmail = '';
        let authName = '';
        try {
            const auth = JSON.parse(localStorage.getItem('dsaforge-auth') || '{}');
            if (auth.email) authEmail = auth.email.trim();
            if (auth.name) authName = auth.name.trim();
        } catch {
            // ignore
        }

        const savedStr = localStorage.getItem('dsaforge-profile');
        const saved = savedStr ? JSON.parse(savedStr) : {};

        // Never keep legacy dummy emails like 'shaili@example.com' or 'learner@dsaforge.dev'
        let resolvedEmail = saved.email ? saved.email.trim() : '';
        if (!resolvedEmail || resolvedEmail === 'shaili@example.com' || resolvedEmail === 'learner@dsaforge.dev') {
            resolvedEmail = authEmail || '';
        }

        let resolvedName = saved.name ? saved.name.trim() : '';
        if (!resolvedName || resolvedName === 'Learner') {
            resolvedName = authName || 'garima';
        }

        const resolvedGoal = saved.goal || 'Master DSA';

        const merged = {
            name: resolvedName,
            email: resolvedEmail,
            goal: resolvedGoal
        };

        // Self-heal localStorage if the old placeholder was stored
        if (saved.email === 'shaili@example.com' || saved.email === 'learner@dsaforge.dev') {
            try {
                localStorage.setItem('dsaforge-profile', JSON.stringify(merged));
            } catch {
                // ignore
            }
        }

        return merged;
    } catch {
        return { name: 'garima', email: '', goal: 'Master DSA' };
    }
}

export default function Profile() {
    const [profile, setProfile] = useState(getSavedProfile);
    const [formData, setFormData] = useState(profile);
    const [activityData, setActivityData] = useState(() => getActivityData());
    const [message, setMessage] = useState('');

    const [handles, setHandles] = useState(() => {
        try {
            const h = JSON.parse(localStorage.getItem('dsaforge-platform-handles') || '{}');
            return {
                leetcode: h.leetcode || 'Garima_yaduvanshi',
                gfg: h.gfg || '',
                codeforces: h.codeforces || '',
                hackerrank: h.hackerrank || '',
                codechef: h.codechef || ''
            };
        } catch {
            return {
                leetcode: 'Garima_yaduvanshi',
                gfg: '',
                codeforces: '',
                hackerrank: '',
                codechef: ''
            };
        }
    });

    useEffect(() => {
        function refreshProfileAndActivity() {
            setActivityData(getActivityData());
            const currentProfile = getSavedProfile();
            setProfile(currentProfile);
            setFormData(currentProfile);
        }

        window.addEventListener(ACTIVITY_EVENT, refreshProfileAndActivity);
        window.addEventListener('storage', refreshProfileAndActivity);
        return () => {
            window.removeEventListener(ACTIVITY_EVENT, refreshProfileAndActivity);
            window.removeEventListener('storage', refreshProfileAndActivity);
        };
    }, []);

    const handlePlatformChange = (platform, value) => {
        const updated = { ...handles, [platform]: value.trim() };
        setHandles(updated);
    };

    const handleSavePlatforms = () => {
        try {
            localStorage.setItem('dsaforge-platform-handles', JSON.stringify(handles));
            setMessage('✓ Platform handles saved successfully.');
            setTimeout(() => setMessage(''), 3500);
        } catch (e) {
            console.error('Save handles error:', e);
        }
    };

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: value
        }));
    }

    function handleSave(event) {
        event.preventDefault();
        const updatedProfile = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            goal: formData.goal.trim()
        };

        if (!updatedProfile.name || !updatedProfile.email) {
            alert('Please fill in required fields.');
            return;
        }

        try {
            localStorage.setItem('dsaforge-profile', JSON.stringify(updatedProfile));
            
            // Keep auth in sync
            try {
                const auth = JSON.parse(localStorage.getItem('dsaforge-auth') || '{}');
                auth.name = updatedProfile.name;
                auth.email = updatedProfile.email;
                localStorage.setItem('dsaforge-auth', JSON.stringify(auth));
            } catch {
                // ignore
            }

            setProfile(updatedProfile);
            setFormData(updatedProfile);
            setMessage('✓ Personal information updated.');

            // Notify topbar and other listeners
            window.dispatchEvent(new Event('storage'));

            setTimeout(() => setMessage(''), 3500);
        } catch {
            alert('Could not save profile.');
        }
    }

    function handleCancel() {
        setFormData(profile);
    }

    const displaySolved = activityData.problemsSolved > 0 ? activityData.problemsSolved : 126;
    const displayStreak = activityData.currentStreak > 0 ? activityData.currentStreak : 14;

    return (
        <div className="profile-page">
            
            {/* 1. HEADER */}
            <div className="profile-page-header">
                <h1>My Profile</h1>
                <p>Manage your profile and coding journey.</p>
            </div>

            {message && (
                <div className="profile-toast-message">
                    {message}
                </div>
            )}

            {/* 2. MAIN GRID (Avatar Card on Left, Details on Right) */}
            <div className="profile-workspace-grid">
                
                {/* Left Profile Card */}
                <div className="profile-summary-card">
                    <div className="profile-avatar-circle">
                        {(profile.name || 'G').charAt(0).toUpperCase()}
                    </div>

                    <h2 className="profile-user-name">{profile.name}</h2>
                    <p className="profile-user-role">DSA Learner</p>

                    <div className="profile-card-divider" />

                    <div className="profile-stats-list">
                        <div className="profile-stat-row">
                            <span className="stat-row-label">Problems Solved</span>
                            <strong className="stat-row-val">{displaySolved}</strong>
                        </div>

                        <div className="profile-stat-row">
                            <span className="stat-row-label">Current Streak</span>
                            <strong className="stat-row-val color-amber">🔥 {displayStreak} days</strong>
                        </div>

                        <div className="profile-stat-row">
                            <span className="stat-row-label">Accuracy</span>
                            <strong className="stat-row-val color-jade">72%</strong>
                        </div>

                        <div className="profile-stat-row">
                            <span className="stat-row-label">Account Tier</span>
                            <strong className="stat-row-val">Pro ML Member</strong>
                        </div>
                    </div>
                </div>

                {/* Right Column: Personal Information & Platform Handles */}
                <div className="profile-details-column">
                    
                    {/* Personal Information Card */}
                    <div className="profile-card-box">
                        <h3 className="profile-card-title">Personal Information</h3>

                        <form onSubmit={handleSave} className="personal-info-form">
                            <div className="form-field-group">
                                <label htmlFor="profile-name">Name</label>
                                <input
                                    id="profile-name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Your Name"
                                    className="profile-input"
                                />
                            </div>

                            <div className="form-field-group">
                                <label htmlFor="profile-email">Email</label>
                                <input
                                    id="profile-email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your registered email"
                                    className="profile-input"
                                />
                            </div>

                            <div className="form-field-group">
                                <label htmlFor="profile-goal">Learning Goal</label>
                                <input
                                    id="profile-goal"
                                    name="goal"
                                    value={formData.goal}
                                    onChange={handleChange}
                                    placeholder="e.g. Master DSA"
                                    className="profile-input"
                                />
                            </div>

                            <div className="personal-form-actions">
                                <button type="submit" className="btn-save-changes">
                                    Save Changes
                                </button>
                                <button type="button" className="btn-cancel" onClick={handleCancel}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Connected Coding Platforms Card */}
                    <div className="profile-card-box">
                        <div className="platform-header-row">
                            <div>
                                <h3 className="profile-card-title">Connected Coding Platforms</h3>
                                <p className="platform-subtitle">
                                    Enter your platform usernames so DSAForge's ML model can analyze your practice history.
                                </p>
                            </div>

                            <button type="button" onClick={handleSavePlatforms} className="btn-sync-all">
                                <span>🔄 Sync All Handles</span>
                            </button>
                        </div>

                        <div className="platforms-connect-list">
                            {/* LeetCode */}
                            <div className="platform-connect-row">
                                <div className="platform-meta">
                                    <div className="platform-mini-box lc-box">LC</div>
                                    <div className="platform-text-desc">
                                        <strong>LeetCode {handles.leetcode && <span className="connected-tag">• Connected</span>}</strong>
                                        <span>Username: {handles.leetcode || 'Not connected'}</span>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Garima_yaduvanshi"
                                    value={handles.leetcode}
                                    onChange={(e) => handlePlatformChange('leetcode', e.target.value)}
                                    className="platform-input"
                                />
                            </div>

                            {/* GeeksforGeeks */}
                            <div className="platform-connect-row">
                                <div className="platform-meta">
                                    <div className="platform-mini-box gfg-box">GFG</div>
                                    <div className="platform-text-desc">
                                        <strong>GeeksforGeeks <span className="disconnected-tag">Not connected</span></strong>
                                        <span>Sync coding problem practice logs</span>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="GFG handle"
                                    value={handles.gfg}
                                    onChange={(e) => handlePlatformChange('gfg', e.target.value)}
                                    className="platform-input"
                                />
                            </div>

                            {/* Codeforces */}
                            <div className="platform-connect-row">
                                <div className="platform-meta">
                                    <div className="platform-mini-box cf-box">CF</div>
                                    <div className="platform-text-desc">
                                        <strong>Codeforces <span className="disconnected-tag">Not connected</span></strong>
                                        <span>Fetch contest ratings & problem logs</span>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Codeforces handle"
                                    value={handles.codeforces}
                                    onChange={(e) => handlePlatformChange('codeforces', e.target.value)}
                                    className="platform-input"
                                />
                            </div>

                            {/* HackerRank */}
                            <div className="platform-connect-row">
                                <div className="platform-meta">
                                    <div className="platform-mini-box hr-box">HR</div>
                                    <div className="platform-text-desc">
                                        <strong>HackerRank <span className="disconnected-tag">Not connected</span></strong>
                                        <span>Include skill badges and track history</span>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="HackerRank username"
                                    value={handles.hackerrank}
                                    onChange={(e) => handlePlatformChange('hackerrank', e.target.value)}
                                    className="platform-input"
                                />
                            </div>

                            {/* CodeChef */}
                            <div className="platform-connect-row">
                                <div className="platform-meta">
                                    <div className="platform-mini-box cc-box">CC</div>
                                    <div className="platform-text-desc">
                                        <strong>CodeChef <span className="disconnected-tag">Not connected</span></strong>
                                        <span>Include Star rating and division performance</span>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="CodeChef username"
                                    value={handles.codechef}
                                    onChange={(e) => handlePlatformChange('codechef', e.target.value)}
                                    className="platform-input"
                                />
                            </div>
                        </div>

                        <div className="platforms-save-footer">
                            <button type="button" onClick={handleSavePlatforms} className="btn-save-handles">
                                Save Platform Handles
                            </button>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}
