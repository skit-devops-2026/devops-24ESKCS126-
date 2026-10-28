import { useState } from 'react';
import './login.css';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();

        const email = e.target.email.value.trim();
        const password = e.target.password.value;

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        try {
            const savedProfile = JSON.parse(localStorage.getItem('dsaforge-profile') || '{}');
            const fallbackName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
            const updatedProfile = {
                name: savedProfile.name || fallbackName,
                email: email,
                goal: savedProfile.goal || 'Master Data Structures & Algorithms'
            };
            localStorage.setItem('dsaforge-profile', JSON.stringify(updatedProfile));
            localStorage.setItem('dsaforge-auth', JSON.stringify({ isLoggedIn: true, name: updatedProfile.name, email }));
        } catch (err) {
            console.error('Could not save login session:', err);
        }

        setError('');
        navigate('/overview');
    };

    return (
        <div className="login-page">

            <div className="login-left">
                <Link to="/" className="login-logo">
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' }}>
                        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M12 2L2 7L12 12L22 7L12 2Z' />
                            <path d='M2 17L12 22L22 17' />
                            <path d='M2 12L12 17L22 12' />
                        </svg>
                    </div>
                    <span>DSAForge</span>
                </Link>

                <div className="login-intro">
                    <h1>
                        Welcome
                        <br />
                        <span>back.</span>
                    </h1>

                    <p>
                        Continue your DSA journey and keep
                        building your problem-solving skills.
                    </p>
                </div>
            </div>

            <div className="login-right">

                <div className="login-box">

                    <h2>Login to DSAForge</h2>

                    <p className="login-subtitle">
                        Enter your details to continue.
                    </p>

                    <form onSubmit={handleLogin}>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <div className="login-options">
                            <label>
                                <input type="checkbox" defaultChecked />
                                Remember me
                            </label>

                            <button
                                type="button"
                                className="forgot-password"
                                onClick={() =>
                                    setForgotMessage(
                                        'Use your registered email and password to log in.'
                                    )
                                }
                            >
                                Forgot password?
                            </button>
                        </div>

                        {forgotMessage && (
                            <p style={{ fontSize: '12px', color: '#6366f1', margin: '4px 0 10px' }}>
                                {forgotMessage}
                            </p>
                        )}

                        {error && <p className="login-error">{error}</p>}

                        <button type="submit" className="login-button">
                            Login →
                        </button>

                    </form>

                    <p className="login-footer">
                        Don't have an account?{' '}
                        <Link to="/register">Create one</Link>
                    </p>

                </div>

            </div>

        </div>
    );
}

export default Login;
