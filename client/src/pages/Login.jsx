import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import './Auth.css';

/**
 * Login — Email + password login for the NaukriBoost webapp.
 * On success, stores JWT and user info in localStorage, redirects to /dashboard.
 */
function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    /* Basic client-side validation */
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const data = await auth.login(formData.email, formData.password);

      localStorage.setItem('naukriboost_token', data.token);
      localStorage.setItem('naukriboost_user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
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
            Your profile, always <span className="gradient-text">fresh</span>.
          </h2>
          <p className="auth-branding-desc">
            Join thousands of professionals who boost their Naukri visibility on autopilot.
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
          <h1 className="auth-form-title" id="login-heading">Welcome Back</h1>
          <p className="auth-form-subtitle">
            Log in to your NaukriBoost account
          </p>

          {error && (
            <div className="auth-error" id="login-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="login-form">
            <div className="input-group">
              <label htmlFor="login-email" className="input-label">Email</label>
              <input
                type="email"
                id="login-email"
                name="email"
                className="input-field"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password" className="input-label">Password</label>
              <input
                type="password"
                id="login-password"
                name="password"
                className="input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              id="login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="auth-switch-text">
            Don't have an account?{' '}
            <Link to="/signup" id="goto-signup-link">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
