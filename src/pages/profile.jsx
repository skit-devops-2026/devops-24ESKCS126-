import { useState, useEffect } from 'react';
import './profile.css';
import { getActivityData, ACTIVITY_EVENT } from '../data/activityData';

const defaultProfile = {
    name: 'Learner',
    email: 'learner@dsaforge.dev',
    goal: 'Master Data Structures & Algorithms'
};

function getSavedProfile() {
    try {
        const saved = localStorage.getItem('dsaforge-profile');
        return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
    } catch {
        return defaultProfile;
    }
}

function Profile() {
    const [profile, setProfile] = useState(getSavedProfile);
    const [formData, setFormData] = useState(profile);
    const [editing, setEditing] = useState(false);
    const [activityData, setActivityData] = useState(() => getActivityData());

    const [handles, setHandles] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dsaforge-platform-handles') || '{}');
        } catch {
            return { leetcode: '', gfg: '', codeforces: '', hackerrank: '', codechef: '' };
        }
    });

    useEffect(() => {
        function refreshActivity() {
            setActivityData(getActivityData());
        }

        window.addEventListener(ACTIVITY_EVENT, refreshActivity);
        window.addEventListener('storage', refreshActivity);

        return () => {
            window.removeEventListener(ACTIVITY_EVENT, refreshActivity);
            window.removeEventListener('storage', refreshActivity);
        };
    }, []);

    const handlePlatformChange = (platform, value) => {
        const updated = { ...handles, [platform]: value.trim() };
        setHandles(updated);
        try {
            localStorage.setItem('dsaforge-platform-handles', JSON.stringify(updated));
        } catch (e) {
            console.error('Could not save handles to localStorage:', e);
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

        if (!updatedProfile.name || !updatedProfile.email || !updatedProfile.goal) {
            alert('Please fill in all fields.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedProfile.email)) {
            alert('Please enter a valid email address.');
            return;
        }

        try {
            localStorage.setItem(
                'dsaforge-profile',
                JSON.stringify(updatedProfile)
            );

            setProfile(updatedProfile);
            setFormData(updatedProfile);
            setEditing(false);
        } catch {
            alert('Could not save your profile. Please try again.');
        }
    }

    function handleCancel() {
        setFormData(profile);
        setEditing(false);
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your profile and coding journey.</p>
            </div>

            <div className="profile-content">
                <div className="profile-card">
                    <div className="profile-avatar">
                        {(profile.name || 'L').charAt(0).toUpperCase()}
                    </div>

                    <h2>{profile.name}</h2>
                    <p className="profile-role">DSA Learner</p>

                    <div className="profile-divider" />

                    <div className="profile-info">
                        <div>
                            <span>Problems Solved</span>
                            <strong>{activityData.problemsSolved}</strong>
                        </div>

                        <div>
                            <span>Current Streak</span>
                            <strong>{activityData.currentStreak} {activityData.currentStreak === 1 ? 'day' : 'days'}</strong>
                        </div>

                        <div>
                            <span>Accuracy</span>
                            <strong>{activityData.problemsSolved > 0 ? `${activityData.accuracy}%` : 'N/A'}</strong>
                        </div>
                    </div>
                </div>

                <div className="profile-details">
                    <div className="details-card">
                        <h2>Personal Information</h2>

                        {editing ? (
                            <form onSubmit={handleSave}>
                                <div className="detail-row">
                                    <label htmlFor="profile-name">Name</label>
                                    <input
                                        id="profile-name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="detail-row">
                                    <label htmlFor="profile-email">Email</label>
                                    <input
                                        id="profile-email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="detail-row">
                                    <label htmlFor="profile-goal">Learning Goal</label>
                                    <input
                                        id="profile-goal"
                                        name="goal"
                                        value={formData.goal}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="profile-actions">
                                    <button
                                        type="submit"
                                        className="edit-profile-btn"
                                    >
                                        Save Changes
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-profile-btn"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="detail-row">
                                    <span>Name</span>
                                    <p>{profile.name}</p>
                                </div>

                                <div className="detail-row">
                                    <span>Email</span>
                                    <p>{profile.email}</p>
                                </div>

                                <div className="detail-row">
                                    <span>Learning Goal</span>
                                    <p>{profile.goal}</p>
                                </div>

                                <button
                                    type="button"
                                    className="edit-profile-btn"
                                    onClick={() => {
                                        setFormData(profile);
                                        setEditing(true);
                                    }}
                                >
                                    Edit Profile
                                </button>
                            </>
                        )}
                    </div>

                    <div className="details-card">
                        <h2>Connected Coding Platforms</h2>
                        <p style={{ color: '#888', marginBottom: '16px' }}>
                            Enter your platform usernames so DSAForge's ML model can analyze your practice history.
                        </p>

                        <div className="platform-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                                <strong>LeetCode</strong>
                                <p>{handles.leetcode ? `Username: ${handles.leetcode}` : 'Not connected'}</p>
                            </div>
                            <input
                                type="text"
                                placeholder="LeetCode username"
                                value={handles.leetcode || ''}
                                onChange={(e) => handlePlatformChange('leetcode', e.target.value)}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div className="platform-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                                <strong>GeeksforGeeks</strong>
                                <p>{handles.gfg ? `Username: ${handles.gfg}` : 'Not connected'}</p>
                            </div>
                            <input
                                type="text"
                                placeholder="GFG handle"
                                value={handles.gfg || ''}
                                onChange={(e) => handlePlatformChange('gfg', e.target.value)}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div className="platform-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                                <strong>Codeforces</strong>
                                <p>{handles.codeforces ? `Handle: ${handles.codeforces}` : 'Not connected'}</p>
                            </div>
                            <input
                                type="text"
                                placeholder="Codeforces handle"
                                value={handles.codeforces || ''}
                                onChange={(e) => handlePlatformChange('codeforces', e.target.value)}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div className="platform-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                                <strong>HackerRank</strong>
                                <p>{handles.hackerrank ? `Username: ${handles.hackerrank}` : 'Not connected'}</p>
                            </div>
                            <input
                                type="text"
                                placeholder="HackerRank username"
                                value={handles.hackerrank || ''}
                                onChange={(e) => handlePlatformChange('hackerrank', e.target.value)}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div className="platform-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                                <strong>CodeChef</strong>
                                <p>{handles.codechef ? `Username: ${handles.codechef}` : 'Not connected'}</p>
                            </div>
                            <input
                                type="text"
                                placeholder="CodeChef username"
                                value={handles.codechef || ''}
                                onChange={(e) => handlePlatformChange('codechef', e.target.value)}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
