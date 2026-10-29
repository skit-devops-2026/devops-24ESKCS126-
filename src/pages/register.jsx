import { useState } from 'react';
import './register.css';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleRegister = (e) => {
        e.preventDefault();

        const name = e.target.name.value.trim();
        const email = e.target.email.value.trim();
        const password = e.target.password.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            // Save registered profile to localStorage so user's real name and email are used across the dashboard
            const profileData = {
                name: name,
                email: email,
                goal: 'Master Data Structures & Algorithms'
            };
            localStorage.setItem('dsaforge-profile', JSON.stringify(profileData));
            localStorage.setItem('dsaforge-auth', JSON.stringify({ isLoggedIn: true, name, email }));
            window.dispatchEvent(new Event('storage'));
        } catch (err) {
            console.error('Could not save user profile:', err);
        }

        setError('');
        navigate('/overview');
    };

    return (
        <div className="register-page">

            <div className="register-left">
                <Link to="/" className="register-logo">
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' }}>
                        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M12 2L2 7L12 12L22 7L12 2Z' />
                            <path d='M2 17L12 22L22 17' />
                            <path d='M2 12L12 17L22 12' />
                        </svg>
                    </div>
                    <span>DSAForge</span>
                </Link>

                <div className="register-intro">
                    <h1>
                        Start
                        <br />
                        <span>building.</span>
                    </h1>

                    <p>
                        Create your DSAForge account and get a
                        personalized path to improve your
                        problem-solving skills.
                    </p>
                </div>
            </div>

            <div className="register-right">

                <div className="register-box">

                    <h2>Create your account</h2>

                    <p className="register-subtitle">
                        Start your DSA journey today.
                    </p>

                    <form onSubmit={handleRegister}>

                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your name"
                                required
                            />
                        </div>

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
                                placeholder="Create a password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        {error && <p className="register-error">{error}</p>}

                        <button type="submit" className="register-button">
                            Create Account →
                        </button>

                    </form>

                    <p className="register-footer">
                        Already have an account?{' '}
                        <Link to="/login">Login</Link>
                    </p>

                </div>

            </div>

        </div>
    );
}

export default Register;
