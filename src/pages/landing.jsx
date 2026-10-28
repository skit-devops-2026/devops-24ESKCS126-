import './landing.css';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { getActivityData } from '../data/activityData';

function Landing() {
    const [auth] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dsaforge-auth') || '{}');
        } catch {
            return {};
        }
    });

    const [activity] = useState(() => getActivityData());
    const isLoggedIn = Boolean(auth.isLoggedIn);

    const displayAccuracy = activity.problemsSolved > 0 ? `${activity.accuracy}%` : '85%';
    const displaySolved = activity.problemsSolved > 0 ? activity.problemsSolved : '30+';
    const displayStreak = activity.currentStreak > 0 ? `${activity.currentStreak}d` : 'Daily';

    return (
        <div className="landing-page">

            <header className="landing-navbar">
                <div className="landing-logo">
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' }}>
                        <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M12 2L2 7L12 12L22 7L12 2Z' />
                            <path d='M2 17L12 22L22 17' />
                            <path d='M2 12L12 17L22 12' />
                        </svg>
                    </div>
                    <span>DSAForge</span>
                </div>

                <div className="landing-nav-actions">
                    {isLoggedIn ? (
                        <Link to="/overview" className="nav-register">
                            Go to Dashboard →
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="nav-login">
                                Login
                            </Link>

                            <Link to="/register" className="nav-register">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <main className="landing-main">

                <section className="hero-section">

                    <div className="hero-content">

                        <span className="hero-badge">
                            ✦ Adaptive DSA Recommendation Engine
                        </span>

                        <h1>
                            Master DSA.
                            <br />
                            <span>Improve Smarter.</span>
                        </h1>

                        <p>
                            DSAForge connects to your coding handles, analyzes your practice history,
                            and recommends targeted problems using machine learning to maximize your interview readiness.
                        </p>

                        <div className="hero-buttons">
                            {isLoggedIn ? (
                                <Link to="/overview" className="hero-primary">
                                    Open Your Dashboard →
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className="hero-primary">
                                        Start Your Journey →
                                    </Link>

                                    <Link to="/login" className="hero-secondary">
                                        I already have an account
                                    </Link>
                                </>
                            )}
                        </div>

                    </div>

                    <div className="hero-visual">

                        <div className="visual-card main-visual-card">

                            <div className="visual-card-header">
                                <span>Curriculum Progress</span>
                                <span className="visual-dot">●</span>
                            </div>

                            <div className="progress-number">
                                {displayAccuracy}
                            </div>

                            <p>Target Pass Accuracy</p>

                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: displayAccuracy }}></div>
                            </div>

                            <div className="visual-stats">
                                <div>
                                    <strong>{displaySolved}</strong>
                                    <span>Problems</span>
                                </div>

                                <div>
                                    <strong>{displayStreak}</strong>
                                    <span>Streak</span>
                                </div>

                                <div>
                                    <strong>8</strong>
                                    <span>Modules</span>
                                </div>
                            </div>

                        </div>

                        <div className="floating-card recommendation-floating">
                            <span>🎯</span>
                            <div>
                                <strong>ML Frontier</strong>
                                <p>Two Pointers & Window</p>
                            </div>
                        </div>

                        <div className="floating-card skill-floating">
                            <span>✓</span>
                            <div>
                                <strong>Curriculum Map</strong>
                                <p>Arrays & Hashing Verified</p>
                            </div>
                        </div>

                    </div>

                </section>

                <section className="features-section">

                    <div className="feature">
                        <span>📊</span>
                        <h3>Analyze</h3>
                        <p>
                            Understand your strengths and weaknesses
                            through real-time telemetry from LeetCode, CF, and GFG.
                        </p>
                    </div>

                    <div className="feature">
                        <span>🎯</span>
                        <h3>Personalize</h3>
                        <p>
                            Get problem recommendations tailored to your rating
                            and weak algorithmic patterns with LightGBM ranking.
                        </p>
                    </div>

                    <div className="feature">
                        <span>⚡</span>
                        <h3>Improve</h3>
                        <p>
                            Follow a visual skill tree roadmap from
                            Foundations all the way to Advanced DP and Graphs.
                        </p>
                    </div>

                </section>

            </main>

        </div>
    );
}

export default Landing;
