import { useState, useEffect } from 'react';
import { boost, naukri } from '../services/api';
import './Dashboard.css';

/**
 * Dashboard — Main authenticated view.
 * Shows stats, profile status, current headline, and recent activity.
 * Fetches real data from the backend API.
 */
function Dashboard() {
  const user = JSON.parse(localStorage.getItem('naukriboost_user') || '{}');
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [boostingNow, setBoostingNow] = useState(false);

  /* Data state */
  const [stats, setStats] = useState({ totalBoosts: 0, successRate: 0, currentStreak: 0 });
  const [profileStatus, setProfileStatus] = useState({ isConnected: false, lastBoost: '—', nextScheduled: '—' });
  const [currentHeadline, setCurrentHeadline] = useState('No headline yet. Trigger your first boost!');
  const [recentActivity, setRecentActivity] = useState([]);

  /** Compute greeting based on time of day */
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  /** Fetch dashboard data from API */
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        /* Fetch all data in parallel */
        const [statsData, historyData, naukriData] = await Promise.all([
          boost.stats(),
          boost.history(1, 5),
          naukri.status(),
        ]);

        /* Stats */
        setStats(statsData.stats);

        /* Recent Activity */
        setRecentActivity(historyData.runs);

        /* Current headline from the most recent successful run */
        const lastSuccess = historyData.runs.find((r) => r.status === 'success' && r.headline);
        if (lastSuccess) {
          setCurrentHeadline(lastSuccess.headline);
        }

        /* Profile status */
        const connection = naukriData.connection;
        const lastRun = historyData.runs.length > 0 ? historyData.runs[0] : null;
        setProfileStatus({
          isConnected: connection.isConnected,
          lastBoost: lastRun ? formatDate(lastRun.startedAt) : '—',
          nextScheduled: 'Scheduled',
          expiresIn: connection.expiresIn || null,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  /** Handle Boost Now button */
  const handleBoostNow = async () => {
    if (boostingNow) return;
    setBoostingNow(true);
    try {
      const result = await boost.trigger();
      alert(result.message || 'Boost triggered!');
      /* Reload dashboard data */
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to trigger boost.');
    } finally {
      setBoostingNow(false);
    }
  };

  /** Format ISO date to readable string */
  function formatDate(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    }) + ', ' + date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header animate-fade-in-up">
          <h1 className="dashboard-greeting">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="dashboard-header animate-fade-in-up">
        <div>
          <h1 className="dashboard-greeting" id="dashboard-greeting">
            {greeting}, {user.name || 'User'} 👋
          </h1>
          <p className="dashboard-date">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid stagger-children">
        <div className="stat-card glass-card" id="stat-total-boosts">
          <div className="stat-header">
            <span className="stat-label">Total Boosts</span>
            <span className="stat-trend stat-trend-up">↑ 12%</span>
          </div>
          <div className="stat-value">{stats.totalBoosts}</div>
          <div className="stat-bar">
            <div className="stat-bar-fill stat-bar-blue" style={{ width: `${Math.min(100, stats.totalBoosts * 2)}%` }} />
          </div>
        </div>

        <div className="stat-card glass-card" id="stat-success-rate">
          <div className="stat-header">
            <span className="stat-label">Success Rate</span>
            <span className="stat-trend stat-trend-up">↑ 2%</span>
          </div>
          <div className="stat-value">{stats.successRate}%</div>
          <div className="stat-bar">
            <div className="stat-bar-fill stat-bar-green" style={{ width: `${stats.successRate}%` }} />
          </div>
        </div>

        <div className="stat-card glass-card" id="stat-streak">
          <div className="stat-header">
            <span className="stat-label">Current Streak</span>
            <span className="stat-trend">🔥</span>
          </div>
          <div className="stat-value">{stats.currentStreak} days</div>
          <div className="stat-bar">
            <div className="stat-bar-fill stat-bar-orange" style={{ width: `${Math.min(100, stats.currentStreak * 5)}%` }} />
          </div>
        </div>
      </div>

      {/* Profile Status + Headline Row */}
      <div className="dashboard-cards-row stagger-children">
        {/* Profile Status Card */}
        <div className="profile-status-card glass-card" id="profile-status-card">
          <h3 className="card-title">Profile Status</h3>
          <div className="status-row">
            <span className="status-label">Naukri Connection</span>
            <span className={`status-indicator ${profileStatus.isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot" />
              {profileStatus.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">Last Boost</span>
            <span className="status-value">{profileStatus.lastBoost}</span>
          </div>
          <div className="status-row">
            <span className="status-label">Next Scheduled</span>
            <span className="status-value">{profileStatus.nextScheduled}</span>
          </div>
          <button
            className="btn btn-primary boost-now-btn"
            id="boost-now-btn"
            onClick={handleBoostNow}
            disabled={boostingNow}
          >
            {boostingNow ? '⏳ Boosting...' : '⚡ Boost Now'}
          </button>
        </div>

        {/* Current Headline Card */}
        <div className="headline-card glass-card" id="headline-card">
          <div className="card-title-row">
            <h3 className="card-title">Current Headline</h3>
            {recentActivity.length > 0 && (
              <span className="badge badge-success">AI Generated</span>
            )}
          </div>
          <p className="headline-text">{currentHeadline}</p>
          <div className="headline-meta">
            <span className="headline-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              {recentActivity.length > 0 ? `Updated ${formatDate(recentActivity[0].startedAt)}` : 'No updates yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-section animate-fade-in-up">
        <div className="section-header">
          <h3 className="card-title">Recent Activity</h3>
          <a href="/activity" className="view-all-link">View All →</a>
        </div>
        {recentActivity.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No boost activity yet. Click "Boost Now" to get started!
          </div>
        ) : (
          <div className="activity-table-wrapper">
            <table className="activity-table" id="recent-activity-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Headline</th>
                  <th>Resume</th>
                  <th>Status</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((run) => (
                  <tr key={run.id}>
                    <td className="activity-date">{formatDate(run.startedAt)}</td>
                    <td className="activity-headline" title={run.headline || '—'}>{run.headline || '—'}</td>
                    <td>
                      {run.resumeUpdated ? (
                        <span className="resume-check">✓</span>
                      ) : (
                        <span className="resume-cross">✗</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${run.status === 'success' ? 'success' : 'failed'}`}>
                        {run.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="activity-duration">{run.duration ? `${run.duration}s` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
