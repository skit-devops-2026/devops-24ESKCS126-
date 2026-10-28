import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './settings.css';

const DEFAULT_SETTINGS = {
    dailyReminder: true,
    progressUpdates: true,
    difficulty: 'Medium',
    platform: 'LeetCode'
};

function getSavedSettings() {
    try {
        const saved = localStorage.getItem('dsaforge-settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export default function Settings() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(getSavedSettings);
    const [message, setMessage] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', newPass: '' });

    const updateSetting = (key, value) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        try {
            localStorage.setItem('dsaforge-settings', JSON.stringify(updated));
            setMessage('✓ Preferences saved successfully.');
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            console.error('Could not save settings:', e);
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (!passwords.current || !passwords.newPass) {
            setMessage('Please enter both current and new password.');
            return;
        }
        if (passwords.newPass.length < 6) {
            setMessage('New password must be at least 6 characters long.');
            return;
        }
        setIsChangingPassword(false);
        setPasswords({ current: '', newPass: '' });
        setMessage('✓ Password updated successfully.');
        setTimeout(() => setMessage(''), 3500);
    };

    return (
        <div className="settings-page">
            
            {/* HEADER */}
            <div className="settings-page-header">
                <h1>Settings</h1>
                <p>Manage your preferences and account settings.</p>
            </div>

            {message && (
                <div className="settings-toast-message">
                    <span>{message}</span>
                    <button type="button" className="close-toast-btn" onClick={() => setMessage('')}>×</button>
                </div>
            )}

            <div className="settings-sections-grid">
                
                {/* 1. General Preferences Card */}
                <div className="settings-card-box">
                    <h3 className="settings-box-title">General</h3>

                    <div className="setting-toggle-row">
                        <div className="toggle-info-text">
                            <strong>Daily Practice Reminder</strong>
                            <p>Get reminded to maintain your coding practice.</p>
                        </div>

                        <label className="warm-toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.dailyReminder}
                                onChange={(e) => updateSetting('dailyReminder', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="setting-toggle-row">
                        <div className="toggle-info-text">
                            <strong>Progress Updates</strong>
                            <p>Receive updates about your learning progress.</p>
                        </div>

                        <label className="warm-toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.progressUpdates}
                                onChange={(e) => updateSetting('progressUpdates', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* 2. Learning Preferences Card */}
                <div className="settings-card-box">
                    <h3 className="settings-box-title">Learning Preferences</h3>

                    <div className="setting-field-row">
                        <label className="field-row-label">Difficulty Preference</label>
                        <select 
                            value={settings.difficulty}
                            onChange={(e) => updateSetting('difficulty', e.target.value)}
                            className="settings-select-dropdown"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    <div className="setting-field-row">
                        <label className="field-row-label">Preferred Platform</label>
                        <select 
                            value={settings.platform}
                            onChange={(e) => updateSetting('platform', e.target.value)}
                            className="settings-select-dropdown"
                        >
                            <option value="LeetCode">LeetCode</option>
                            <option value="Codeforces">Codeforces</option>
                            <option value="GeeksforGeeks">GeeksforGeeks</option>
                            <option value="HackerRank">HackerRank</option>
                            <option value="CodeChef">CodeChef</option>
                        </select>
                    </div>
                </div>

                {/* 3. Connected Coding Accounts */}
                <div className="settings-card-box">
                    <div className="connected-accounts-row">
                        <div className="connected-info-text">
                            <h3 className="settings-box-title" style={{ margin: '0 0 4px' }}>Connected Coding Accounts</h3>
                            <p className="connected-subtext">Manage LeetCode, Codeforces, HackerRank and CodeChef</p>
                        </div>

                        <button 
                            type="button"
                            onClick={() => navigate('/profile')}
                            className="btn-open-handles"
                        >
                            Open Profile Handles
                        </button>
                    </div>

                    <div className="security-divider" />

                    <div className="account-action-row">
                        <div>
                            <strong>Change Password</strong>
                            <p className="account-action-sub">Update your account login credentials</p>
                        </div>

                        <button 
                            type="button"
                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                            className="btn-action-outline"
                        >
                            {isChangingPassword ? 'Cancel' : 'Change'}
                        </button>
                    </div>

                    {isChangingPassword && (
                        <form onSubmit={handlePasswordSubmit} className="change-pass-form">
                            <input
                                type="password"
                                placeholder="Current password"
                                value={passwords.current}
                                onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                                className="settings-input"
                                required
                            />
                            <input
                                type="password"
                                placeholder="New password (min 6 characters)"
                                value={passwords.newPass}
                                onChange={(e) => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                                className="settings-input"
                                required
                            />
                            <button type="submit" className="btn-update-pass">
                                Update Password
                            </button>
                        </form>
                    )}
                </div>

            </div>

        </div>
    );
}
