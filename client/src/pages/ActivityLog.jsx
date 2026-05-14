import { useState, useEffect } from 'react';
import { boost } from '../services/api';
import './ActivityLog.css';

/**
 * ActivityLog — Filterable table of all automation runs.
 * Fetches paginated data from /api/boost/history.
 */
function ActivityLog() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [runs, setRuns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  /** Fetch history from API */
  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const data = await boost.history(pagination.page, pagination.limit, statusFilter);
        setRuns(data.runs);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Activity log fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [statusFilter, pagination.page]);

  /** Handle filter change — reset to page 1 */
  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  /** Format ISO date to readable string */
  function formatDate(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) + ' ' + date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return (
    <div className="activity-log-page">
      {/* Page Header */}
      <div className="activity-header animate-fade-in-up">
        <h1 className="page-title" id="activity-heading">Activity Log</h1>
        <p className="page-subtitle">Track every profile boost and its outcome.</p>
      </div>

      {/* Filters */}
      <div className="activity-filters animate-fade-in-up" id="activity-filters">
        <div className="filter-group">
          <label htmlFor="status-filter" className="input-label">Status</label>
          <select
            id="status-filter"
            className="input-field filter-select"
            value={statusFilter}
            onChange={handleFilterChange}
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="filter-summary">
          Showing <strong>{runs.length}</strong> of {pagination.total} runs
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading activity...
        </div>
      ) : runs.length === 0 ? (
        <div className="glass-card animate-fade-in-up" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No boost activity yet. Go to the Dashboard and trigger your first boost!
        </div>
      ) : (
        <div className="activity-table-wrapper animate-fade-in-up">
          <table className="activity-table activity-table-full" id="activity-log-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Headline Used</th>
                <th>Resume</th>
                <th>Status</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <>
                  <tr
                    key={run.id}
                    className={`activity-row ${run.error ? 'expandable' : ''} ${expandedRow === run.id ? 'expanded' : ''}`}
                    onClick={() => run.error && toggleRow(run.id)}
                  >
                    <td className="activity-date">{formatDate(run.startedAt)}</td>
                    <td className="activity-headline" title={run.headline || '—'}>
                      {run.headline || '—'}
                    </td>
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
                  {expandedRow === run.id && run.error && (
                    <tr key={`${run.id}-error`} className="error-detail-row">
                      <td colSpan="5">
                        <div className="error-detail">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>{run.error}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination-controls animate-fade-in-up">
          <button
            className="btn btn-ghost btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default ActivityLog;
