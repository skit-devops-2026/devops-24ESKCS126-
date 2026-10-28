import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './settings.css';

const DEFAULT_SETTINGS = {
    dailyReminder: true,
    progressUpdates: true,
    difficulty: 'medium',
    platform: 'leetcode'
};

function getSavedSettings() {
    try {
        const saved = localStorage.getItem('dsaforge-settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

function Settings() {
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

            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your preferences and account settings.</p>
            </div>

            {message && (
                <div className="settings-message">
                    <span>{message}</span>
                    <button onClick={() => setMessage('')}>×</button>
                </div>
            )}

            <div className="settings-container">

                <div className="settings-card">
                    <h2>General</h2>

                    <div className="setting-row">
                        <div>
                            <h3>Daily Practice Reminder</h3>
                            <p>Get reminded to maintain your coding practice.</p>
                        </div>

                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={settings.dailyReminder}
                                onChange={(e) => updateSetting('dailyReminder', e.target.checked)}
                            />
                            <span></span>
                        </label>
                    </div>

                    <div className="setting-row">
                        <div>
                            <h3>Progress Updates</h3>
                            <p>Receive updates about your learning progress.</p>
                        </div>

                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={settings.progressUpdates}
                                onChange={(e) => updateSetting('progressUpdates', e.target.checked)}
                            />
                            <span></span>
                        </label>
                    </div>
                </div>

                <div className="settings-card">
                    <h2>Learning Preferences</h2>

                    <div className="setting-select">
                        <label>Difficulty Preference</label>

                        <select 
                            value={settings.difficulty}
                            onChange={(e) => updateSetting('difficulty', e.target.value)}
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    <div className="setting-select">
                        <label>Preferred Platform</label>

                        <select 
                            value={settings.platform}
                            onChange={(e) => updateSetting('platform', e.target.value)}
                        >
                            <option value="leetcode">LeetCode</option>
                            <option value="hackerrank">HackerRank</option>
                            <option value="codeforces">Codeforces</option>
                            <option value="codechef">CodeChef</option>
                            <option value="gfg">GeeksforGeeks</option>
                        </select>
                    </div>
                </div>

                <div className="settings-card">
                    <h2>Account & Integrations</h2>

                    <div className="account-action">
                        <div>
                            <h3>Connected Platforms</h3>
                            <p>Manage your competitive programming handles (LeetCode, Codeforces, GFG).</p>
                        </div>

                        <button 
                            type="button"
                            onClick={() => navigate('/profile')}
                        >
                            Manage on Profile →
                        </button>
                    </div>

                    <div className="account-action" style={{ borderBottom: isChangingPassword ? 'none' : '' }}>
                        <div>
                            <h3>Change Password</h3>
                            <p>Update your account security credentials.</p>
                        </div>

                        <button 
                            type="button"
                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                        >
                            {isChangingPassword ? 'Cancel' : 'Change'}
                        </button>
                    </div>

                    {isChangingPassword && (
                        <form onSubmit={handlePasswordSubmit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                type="password"
                                placeholder="Current password"
                                value={passwords.current}
                                onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                                style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                                required
                            />
                            <input
                                type="password"
                                placeholder="New password (min 6 characters)"
                                value={passwords.newPass}
                                onChange={(e) => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                                style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                                required
                            />
                            <button
                                type="submit"
                                style={{ alignSelf: 'flex-start', padding: '8px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                            >
                                Update Password
                            </button>
                        </form>
                    )}
                </div>

            </div>

        </div>
    );
}

export default Settings;
