import './topbar.css';
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import { getActivityData, ACTIVITY_EVENT } from '../data/activityData';

import {
    MdNotifications,
    MdKeyboardArrowDown
} from 'react-icons/md';

function generateNotifications() {
    let handles = {};
    try {
        handles = JSON.parse(localStorage.getItem('dsaforge-platform-handles') || '{}');
    } catch {
        handles = {};
    }

    const activity = getActivityData();
    const connectedPlatforms = Object.entries(handles)
        .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));

    const notifs = [];

    // 1. Platform status
    if (connectedPlatforms.length > 0) {
        notifs.push({
            id: 'notif-platforms-connected',
            title: 'Platforms Synchronized',
            message: `Telemetry active for ${connectedPlatforms.join(', ')}.`,
            time: 'Active'
        });
    } else {
        notifs.push({
            id: 'notif-connect-platforms',
            title: 'Connect Coding Platforms',
            message: 'Link your LeetCode, Codeforces, or GFG handles in Profile for AI recommendations.',
            time: 'Action needed'
        });
    }

    // 2. Milestone / Solved status
    if (activity.problemsSolved > 0) {
        notifs.push({
            id: `notif-milestone-${activity.problemsSolved}`,
            title: 'Practice Progress',
            message: `You have solved ${activity.problemsSolved} problem${activity.problemsSolved === 1 ? '' : 's'} across your journey.`,
            time: 'Recent'
        });
    } else {
        notifs.push({
            id: 'notif-welcome',
            title: 'Welcome to DSAForge!',
            message: 'Explore the Overview page and start your personalized curriculum.',
            time: 'Just now'
        });
    }

    // 3. Streak
    if (activity.currentStreak > 0) {
        notifs.push({
            id: `notif-streak-${activity.currentStreak}`,
            title: `🔥 ${activity.currentStreak}-Day Practice Streak!`,
            message: 'Solve a problem today to keep your consistency momentum going.',
            time: 'Today'
        });
    } else {
        notifs.push({
            id: 'notif-streak-start',
            title: 'Start a Streak Today 🔥',
            message: 'Solve at least one problem today to initiate your daily streak counter.',
            time: 'Today'
        });
    }

    return notifs;
}

function Topbar() {
    const navigate = useNavigate();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const notifRef = useRef(null);
    const profileRef = useRef(null);

    const [userProfile, setUserProfile] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dsaforge-profile') || '{"name": "Learner", "email": "learner@dsaforge.dev"}');
        } catch {
            return { name: "Learner", email: "learner@dsaforge.dev" };
        }
    });

    const [readNotifs, setReadNotifs] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dsaforge-read-notifications') || '[]');
        } catch {
            return [];
        }
    });

    const [notificationList, setNotificationList] = useState(generateNotifications);

    useEffect(() => {
        function handleUpdate() {
            setNotificationList(generateNotifications());
            try {
                const saved = JSON.parse(localStorage.getItem('dsaforge-profile') || '{}');
                if (saved.name) setUserProfile(saved);
            } catch {
                // ignore
            }
        }

        window.addEventListener(ACTIVITY_EVENT, handleUpdate);
        window.addEventListener('storage', handleUpdate);

        return () => {
            window.removeEventListener(ACTIVITY_EVENT, handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, []);

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const notifications = notificationList.map(n => ({
        ...n,
        read: readNotifs.includes(n.id)
    }));

    const unreadCount = notifications.filter(
        (notification) => !notification.read
    ).length;

    function markAllAsRead() {
        const allIds = notifications.map((n) => n.id);
        const updated = Array.from(new Set([...readNotifs, ...allIds]));
        setReadNotifs(updated);
        try {
            localStorage.setItem('dsaforge-read-notifications', JSON.stringify(updated));
        } catch (e) {
            console.error('Could not save read notifications:', e);
        }
    }

    function handleLogout() {
        try {
            localStorage.removeItem('dsaforge-auth');
        } catch (e) {
            console.error('Could not log out:', e);
        }
        setIsProfileMenuOpen(false);
        navigate('/');
    }

    return (
        <header className="topbar">

            <Link to="/overview" className="logo">
                <div className="brand-logo-badge">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                        <path d="M2 17L12 22L22 17" />
                        <path d="M2 12L12 17L22 12" />
                    </svg>
                </div>
                <span className="logo-text">DSA<span className="logo-accent">Forge</span></span>
            </Link>

            <div className="rightbar">

                {/* 1. NOTIFICATIONS WRAPPER */}
                <div className="notification-wrapper" ref={notifRef}>
                    <button
                        type="button"
                        className="notification-button"
                        aria-label={`Notifications, ${unreadCount} unread`}
                        aria-expanded={isNotificationsOpen}
                        onClick={() => {
                            setIsNotificationsOpen(prev => !prev);
                            setIsProfileMenuOpen(false);
                        }}
                    >
                        <MdNotifications className="topbar-icon" />

                        {unreadCount > 0 && (
                            <span className="notification-badge" />
                        )}
                    </button>

                    {isNotificationsOpen && (
                        <section
                            className="notification-panel"
                            aria-label="Notifications"
                        >
                            <div className="notification-panel-header">
                                <h2>Notifications</h2>

                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        className="mark-read-button"
                                        onClick={markAllAsRead}
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            {notifications.length > 0 ? (
                                <div className="notification-list">
                                    {notifications.map((notification) => (
                                        <article
                                            key={notification.id}
                                            className={`notification-item ${
                                                notification.read ? 'read' : 'unread'
                                            }`}
                                        >
                                            <div className="notification-item-heading">
                                                <h3>{notification.title}</h3>

                                                {!notification.read && (
                                                    <span className="unread-dot" />
                                                )}
                                            </div>

                                            <p>{notification.message}</p>
                                            <span className="notification-time">
                                                {notification.time}
                                            </span>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-notifications">
                                    You're all caught up!
                                </p>
                            )}
                        </section>
                    )}
                </div>

                {/* 2. PROFILE MENU WRAPPER */}
                <div className="profile-wrapper" ref={profileRef}>
                    <button
                        type="button"
                        className="profile-button"
                        onClick={() => {
                            setIsProfileMenuOpen(prev => !prev);
                            setIsNotificationsOpen(false);
                        }}
                        aria-expanded={isProfileMenuOpen}
                    >
                        <div className="profile-initial-badge">
                            {(userProfile.name || 'L').charAt(0).toUpperCase()}
                        </div>
                        <span className="profile-name-preview">{userProfile.name}</span>
                        <MdKeyboardArrowDown 
                            className="dropdown-icon" 
                            style={{ transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none' }}
                        />
                    </button>

                    {isProfileMenuOpen && (
                        <div className="profile-dropdown-panel">
                            <div className="profile-user-summary">
                                <strong>{userProfile.name}</strong>
                                <span>{userProfile.email}</span>
                            </div>

                            <Link 
                                to="/profile" 
                                className="profile-menu-item"
                                onClick={() => setIsProfileMenuOpen(false)}
                            >
                                <span>👤</span> My Profile
                            </Link>

                            <Link 
                                to="/setting" 
                                className="profile-menu-item"
                                onClick={() => setIsProfileMenuOpen(false)}
                            >
                                <span>⚙️</span> Settings
                            </Link>

                            <button 
                                type="button" 
                                className="profile-menu-item logout"
                                onClick={handleLogout}
                            >
                                <span>🚪</span> Log Out
                            </button>
                        </div>
                    )}
                </div>

            </div>

        </header>
    );
}

export default Topbar;
