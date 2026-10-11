
import { useState } from 'react';
import './profile.css';

const defaultProfile = {
    name: 'Shaili',
    email: 'shaili@example.com',
    goal: 'Master DSA'
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
    const [codeChefUsername, setCodeChefUsername] = useState('');
    const [showCodeChefForm, setShowCodeChefForm] = useState(false);

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

    function handleCodeChefSave(event) {
        event.preventDefault();

        if (!codeChefUsername.trim()) {
            alert('Please enter your CodeChef username.');
            return;
        }

        // Demo only: saves a username locally; does not verify an account.
        setShowCodeChefForm(false);
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
                        {profile.name.charAt(0).toUpperCase()}
                    </div>

                    <h2>{profile.name}</h2>
                    <p className="profile-role">DSA Learner</p>

                    <div className="profile-divider" />

                    <div className="profile-info">
                        <div>
                            <span>Problems Solved</span>
                            <strong>124</strong>
                        </div>

                        <div>
                            <span>Current Streak</span>
                            <strong>14 days</strong>
                        </div>

                        <div>
                            <span>Accuracy</span>
                            <strong>72%</strong>
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
                        <h2>Connected Platforms</h2>

                        <div className="platform-row">
                            <div>
                                <strong>LeetCode</strong>
                                <p>Demo status</p>
                            </div>
                            <span className="connected">Connected</span>
                        </div>

                        <div className="platform-row">
                            <div>
                                <strong>HackerRank</strong>
                                <p>Demo status</p>
                            </div>
                            <span className="connected">Connected</span>
                        </div>

                        <div className="platform-row">
                            <div>
                                <strong>CodeChef</strong>
                                <p>
                                    {codeChefUsername
                                        ? `Username: ${codeChefUsername}`
                                        : 'Not connected'}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="not-connected"
                                onClick={() => setShowCodeChefForm((value) => !value)}
                            >
                                {showCodeChefForm
                                    ? 'Cancel'
                                    : codeChefUsername
                                        ? 'Edit Username'
                                        : 'Add Username'}
                            </button>
                        </div>

                        {showCodeChefForm && (
                            <form
                                className="codechef-form"
                                onSubmit={handleCodeChefSave}
                            >
                                <label htmlFor="codechef-username">
                                    CodeChef username
                                </label>

                                <input
                                    id="codechef-username"
                                    value={codeChefUsername}
                                    onChange={(event) =>
                                        setCodeChefUsername(event.target.value)
                                    }
                                    placeholder="Enter your username"
                                    required
                                />

                                <button
                                    type="submit"
                                    className="edit-profile-btn"
                                >
                                    Save Username
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
