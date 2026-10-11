import './topbar.css';
import { NavLink } from "react-router-dom";
import { useState } from 'react';

import {
    MdNotifications,
    MdAccountCircle,
    MdKeyboardArrowDown
} from 'react-icons/md';

const initialNotifications = [
    {
        id: 1,
        title: 'Keep your streak alive!',
        message: 'Solve a problem today to continue your progress.',
        time: 'Today',
        read: false
    },
    {
        id: 2,
        title: 'Practice milestone',
        message: 'You are making progress on your DSA journey.',
        time: 'Yesterday',
        read: false
    },
    {
        id: 3,
        title: 'Welcome to DSAForge',
        message: 'Explore your dashboard and track your learning.',
        time: 'Earlier',
        read: true
    }
];

function Topbar() {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);

    const unreadCount = notifications.filter(
        (notification) => !notification.read
    ).length;

    function markAllAsRead() {
        setNotifications((currentNotifications) =>
            currentNotifications.map((notification) => ({
                ...notification,
                read: true
            }))
        );
    }

    return (
        <header className="topbar">

            <div className="logo">
                <span className="logo-icon">🚀</span>
                <span className="logo-text">DSAForge</span>
            </div>

            <div className="rightbar">

                <div className="notification-wrapper">
                    <button
                        type="button"
                        className="notification-button"
                        aria-label={`Notifications, ${unreadCount} unread`}
                        aria-expanded={isNotificationsOpen}
                        onClick={() =>
                            setIsNotificationsOpen((isOpen) => !isOpen)
                        }
                    >
                        <MdNotifications className="topbar-icon" />

                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount}
                            </span>
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

                <NavLink to="/profile" className="profile-link">

                    <MdAccountCircle
                        className="profile-picture"
                        aria-label="User profile"
                    />

                    <MdKeyboardArrowDown className="dropdown-icon" />

                </NavLink>

            </div>

        </header>
    );
}

export default Topbar;