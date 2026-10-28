import './topbar.css';
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import { getActivityData, ACTIVITY_EVENT } from '../data/activityData';
import { MdNotifications, MdKeyboardArrowDown } from 'react-icons/md';

const THEMES = [
    { id: 'warm-cashmere', label: 'Warm Cashmere & Jade', icon: '🌱' },
    { id: 'sandstone-indigo', label: 'Sandstone & Royal Indigo', icon: '🔷' },
    { id: 'tuscan-sage', label: 'Tuscan Alabaster & Sage', icon: '🌿' }
];

export default function Topbar() {
    const navigate = useNavigate();

    // 1. Theme State
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem('dsaforge-theme') || 'warm-cashmere';
        } catch {
            return 'warm-cashmere';
        }
    });

    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const themeRef = useRef(null);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    // Synchronize data-theme on html element
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('dsaforge-theme', theme);
        } catch {
            // ignore
        }
    }, [theme]);

    // 2. User Profile State
    const [userProfile, setUserProfile] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem('dsaforge-profile') ||
                '{"name": "garima", "email": "shaili@example.com"}'
            );
        } catch {
            return { name: "garima", email: "shaili@example.com" };
        }
    });

    // 3. Activity & Solved Counts for dynamic badges
    const [activity, setActivity] = useState(() => getActivityData());

    useEffect(() => {
        function handleUpdate() {
            setActivity(getActivityData());
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

    // 4. Click outside handler to dismiss all popovers
    useEffect(() => {
        function handleClickOutside(event) {
            if (themeRef.current && !themeRef.current.contains(event.target)) {
                setIsThemeMenuOpen(false);
            }
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

    const handleSelectTheme = (themeId) => {
        setTheme(themeId);
        setIsThemeMenuOpen(false);
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem('dsaforge-auth');
        } catch (e) {
            console.error('Logout error:', e);
        }
        setIsProfileMenuOpen(false);
        navigate('/');
    };

    const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

    // Notifications matching screenshot design
    const notifications = [
        {
            id: 'notif-1',
            title: 'LightGBM Curriculum Updated',
            message: 'New problem recommendations generated for your 1100 target.',
            time: '12m ago',
            read: false
        },
        {
            id: 'notif-2',
            title: '14-Day Streak Milestone! 🔥',
            message: 'You are in the top 8% consistency tier this month.',
            time: '1h ago',
            read: false
        }
    ];

    return (
        <header className="topbar">
            {/* LEFT: BRAND LOGO & ML PILL */}
            <div className="topbar-left">
                <Link to="/overview" className="logo">
                    <div className="brand-logo-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                            <path d="M2 17L12 22L22 17" />
                            <path d="M2 12L12 17L22 12" />
                        </svg>
                    </div>
                    <span className="logo-text">DSA<span className="logo-accent">Forge</span></span>
                </Link>

                <span className="ml-version-pill">ML v2.4</span>
            </div>

            {/* CENTER: SEGMENTED NAVIGATION PILLS */}
            <nav className="topbar-nav">
                <NavLink 
                    to="/overview" 
                    className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}
                >
                    Overview
                </NavLink>

                <NavLink 
                    to="/my-skill-map" 
                    className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}
                >
                    My Skill Map
                </NavLink>

                <NavLink 
                    to="/recommendations" 
                    className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}
                >
                    <span>Recommendations</span>
                    <span className="nav-badge-count">28</span>
                </NavLink>

                <NavLink 
                    to="/activity" 
                    className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}
                >
                    Activity
                </NavLink>

                <NavLink 
                    to="/setting" 
                    className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}
                >
                    Settings
                </NavLink>
            </nav>

            {/* RIGHT: THEME SWITCHER + NOTIFICATIONS + PROFILE */}
            <div className="topbar-right">
                
                {/* 1. Theme Selector Popover */}
                <div className="theme-wrapper" ref={themeRef}>
                    <button
                        type="button"
                        className="theme-btn"
                        onClick={() => {
                            setIsThemeMenuOpen(prev => !prev);
                            setIsNotificationsOpen(false);
                            setIsProfileMenuOpen(false);
                        }}
                        aria-expanded={isThemeMenuOpen}
                        title="Switch theme color scheme"
                    >
                        <span className="theme-btn-content">
                            <span>{currentThemeObj.icon}</span>
                            <span className="theme-label">{currentThemeObj.label}</span>
                        </span>
                        <MdKeyboardArrowDown className="chevron-icon" />
                    </button>

                    {isThemeMenuOpen && (
                        <div className="theme-dropdown-panel">
                            <div className="theme-panel-header">
                                WARM ELEGANT SCHEMES
                            </div>
                            <div className="theme-options-list">
                                {THEMES.map((item) => {
                                    const isSelected = item.id === theme;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`theme-option-row ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleSelectTheme(item.id)}
                                        >
                                            <span className="theme-option-name">
                                                {item.label}
                                            </span>
                                            {isSelected && <span className="theme-check">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Notification Popover */}
                <div className="notification-wrapper" ref={notifRef}>
                    <button
                        type="button"
                        className="notification-btn"
                        aria-label="Notifications"
                        onClick={() => {
                            setIsNotificationsOpen(prev => !prev);
                            setIsThemeMenuOpen(false);
                            setIsProfileMenuOpen(false);
                        }}
                    >
                        <MdNotifications className="bell-icon" />
                        <span className="notification-badge-dot">2</span>
                    </button>

                    {isNotificationsOpen && (
                        <div className="notification-dropdown-panel">
                            <div className="notif-panel-header">
                                <h3>Notifications</h3>
                                <span className="notif-count-badge">2 New</span>
                            </div>

                            <div className="notif-items-list">
                                {notifications.map((n) => (
                                    <div key={n.id} className="notif-card-item">
                                        <h4>{n.title}</h4>
                                        <p>{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. User Profile Dropdown */}
                <div className="profile-wrapper" ref={profileRef}>
                    <button
                        type="button"
                        className="profile-pill-btn"
                        onClick={() => {
                            setIsProfileMenuOpen(prev => !prev);
                            setIsThemeMenuOpen(false);
                            setIsNotificationsOpen(false);
                        }}
                        aria-expanded={isProfileMenuOpen}
                    >
                        <div className="avatar-circle">
                            {(userProfile.name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <span className="profile-name-text">
                            {userProfile.name || 'garima'}
                        </span>
                        <MdKeyboardArrowDown className="chevron-icon" />
                    </button>

                    {isProfileMenuOpen && (
                        <div className="profile-dropdown-panel">
                            <div className="profile-header-summary">
                                <strong>{userProfile.name || 'garima'}</strong>
                                <span>{userProfile.email || 'shaili@example.com'}</span>
                            </div>

                            <div className="profile-menu-links">
                                <Link 
                                    to="/profile" 
                                    className="menu-link-row"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                >
                                    <span className="menu-icon">👤</span> My Profile
                                </Link>

                                <Link 
                                    to="/setting" 
                                    className="menu-link-row"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                >
                                    <span className="menu-icon">⚙️</span> Settings
                                </Link>

                                <button 
                                    type="button" 
                                    className="menu-link-row logout-row"
                                    onClick={handleLogout}
                                >
                                    <span className="menu-icon">🚪</span> Log Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}
