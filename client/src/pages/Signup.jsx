import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import './Auth.css';

/**
 * Signup — Create a new NaukriBoost account.
 * Collects name, email, password, confirm password.
 */
function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    /* Client-side validation */
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await auth.signup(formData.name, formData.email, formData.password);

      localStorage.setItem('naukriboost_token', data.token);
      localStorage.setItem('naukriboost_user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background Effects */}
      <div className="auth-bg-glow" aria-hidden="true" />

      {/* Left — Branding */}
      <div className="auth-branding">
        <Link to="/" className="auth-logo">
          <span className="gradient-text">Naukri</span>Boost
        </Link>
        <div className="auth-branding-content animate-fade-in-up">
          <h2 className="auth-branding-title">
            Start getting noticed, <span className="gradient-text">today</span>.
          </h2>
          <p className="auth-branding-desc">
            Create your account and connect your Naukri profile in under 2 minutes.
          </p>
          <div className="auth-branding-stats">
            <div className="auth-stat">
              <span className="auth-stat-value">200+</span>
              <span className="auth-stat-label">Active Users</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">5K+</span>
              <span className="auth-stat-label">Boosts Completed</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">94%</span>
              <span className="auth-stat-label">Success Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="auth-form-section">
        <div className="auth-form-card glass-card animate-fade-in-up">
          <h1 className="auth-form-title" id="signup-heading">Create Account</h1>
          <p className="auth-form-subtitle">
            Sign up for NaukriBoost — it's free
          </p>

          {error && (
            <div className="auth-error" id="signup-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="signup-form">
            <div className="input-group">
              <label htmlFor="signup-name" className="input-label">Full Name</label>
              <input
                type="text"
                id="signup-name"
                name="name"
                className="input-field"
                placeholder="Saksham Agrawal"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-email" className="input-label">Email</label>
              <input
                type="email"
                id="signup-email"
                name="email"
                className="input-field"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-password" className="input-label">Password</label>
              <input
                type="password"
                id="signup-password"
                name="password"
                className="input-field"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-confirm-password" className="input-label">Confirm Password</label>
              <input
                type="password"
                id="signup-confirm-password"
                name="confirmPassword"
                className="input-field"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              id="signup-submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account?{' '}
            <Link to="/login" id="goto-login-link">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
