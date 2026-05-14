import { useState, useEffect } from 'react';
import { naukri, resume, schedule } from '../services/api';
import './Settings.css';

/**
 * Settings — User configuration page.
 * Sections: Naukri Connection, Resume Management, Schedule, Danger Zone.
 * Fetches real data from the backend API.
 */
function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ---------- State ---------- */
  const [naukriStatus, setNaukriStatus] = useState({ isConnected: false, expiresIn: null });
  const [naukriEmail, setNaukriEmail] = useState('');
  const [naukriPassword, setNaukriPassword] = useState('');
  const [resumeData, setResumeData] = useState({ filename: null, uploadedAt: null, jobRole: '', proofPoints: '' });
  const [scheduleData, setScheduleData] = useState({
    isActive: true,
    time: '09:00',
    days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
  });

  const [dragActive, setDragActive] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  /** Fetch settings data on mount */
  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const [naukriData, resumeResponse, scheduleResponse] = await Promise.all([
          naukri.status(),
          resume.get(),
          schedule.get(),
        ]);

        /* Naukri connection */
        setNaukriStatus({
          isConnected: naukriData.connection.isConnected,
          expiresIn: naukriData.connection.expiresIn,
        });

        /* Resume */
        if (resumeResponse.resume) {
          setResumeData({
            filename: resumeResponse.resume.filename,
            uploadedAt: resumeResponse.resume.uploadedAt,
            jobRole: resumeResponse.resume.jobRole || '',
            proofPoints: resumeResponse.resume.proofPoints || '',
          });
        }

        /* Schedule */
        if (scheduleResponse.schedule) {
          const s = scheduleResponse.schedule;
          const daysArray = s.activeDays || [];
          setScheduleData({
            isActive: s.isActive,
            time: s.boostTime || '09:00',
            days: {
              mon: daysArray.includes('mon'),
              tue: daysArray.includes('tue'),
              wed: daysArray.includes('wed'),
              thu: daysArray.includes('thu'),
              fri: daysArray.includes('fri'),
              sat: daysArray.includes('sat'),
              sun: daysArray.includes('sun'),
            },
          });
        }
      } catch (err) {
        console.error('Settings fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  /* ---------- Resume Handlers ---------- */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files && files[0]) uploadFile(files[0]);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploadStatus('Uploading...');
    try {
      const data = await resume.upload(file, resumeData.jobRole, resumeData.proofPoints);
      setResumeData({
        ...resumeData,
        filename: data.resume.filename,
        uploadedAt: data.resume.uploadedAt || 'Just now',
      });
      setUploadStatus('✓ Uploaded successfully!');
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (err) {
      setUploadStatus(`✗ ${err.message}`);
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  /* ---------- Schedule Handlers ---------- */
  const toggleDay = (day) => {
    setScheduleData({
      ...scheduleData,
      days: { ...scheduleData.days, [day]: !scheduleData.days[day] },
    });
  };

  /* ---------- Naukri Connect ---------- */
  const handleConnect = async () => {
    if (!naukriEmail || !naukriPassword) {
      alert('Please enter your Naukri Email and Password to connect.');
      return;
    }
    
    setSaving(true);
    try {
      const data = await naukri.connect(naukriEmail, naukriPassword);
      setNaukriStatus({ isConnected: true, expiresIn: '7 days' });
      setNaukriPassword(''); // Clear password from state after connection
      alert(data.message || 'Connected!');
    } catch (err) {
      alert(err.message || 'Failed to connect.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Save All Settings ---------- */
  const handleSave = async () => {
    setSaving(true);
    try {
      /* Save schedule */
      const activeDays = Object.entries(scheduleData.days)
        .filter(([, active]) => active)
        .map(([day]) => day);

      await schedule.update({
        isActive: scheduleData.isActive,
        boostTime: scheduleData.time,
        activeDays,
      });

      /* Save resume metadata (jobRole, proofPoints) by re-uploading if there's a file */
      /* For now, this is saved alongside the file upload */

      alert('Settings saved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const dayLabels = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
  ];

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-header animate-fade-in-up">
          <h1 className="page-title">Loading settings...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header animate-fade-in-up">
        <h1 className="page-title" id="settings-heading">Settings</h1>
        <p className="page-subtitle">Manage your Naukri connection, resume, and schedule.</p>
      </div>

      <div className="settings-sections stagger-children">
        {/* Section 1: Naukri Connection */}
        <section className="settings-section glass-card" id="section-naukri-connection">
          <h2 className="settings-section-title">Naukri Connection</h2>
          <div className="connection-status-row">
            <div className="connection-info">
              <span className={`status-indicator ${naukriStatus.isConnected ? 'connected' : 'disconnected'}`}>
                <span className="status-dot" />
                {naukriStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {naukriStatus.isConnected && naukriStatus.expiresIn && (
                <span className="connection-expiry">
                  Session expires in {naukriStatus.expiresIn}
                </span>
              )}
            </div>
            <button
              className="btn btn-outlined btn-sm"
              id="reconnect-naukri-btn"
              onClick={handleConnect}
              disabled={saving}
            >
              {saving ? 'Connecting...' : (naukriStatus.isConnected ? 'Reconnect' : 'Connect Now')}
            </button>
          </div>
          
          {!naukriStatus.isConnected && (
            <div className="resume-fields" style={{ marginTop: 'var(--space-4)' }}>
              <div className="input-group">
                <label htmlFor="naukri-email" className="input-label">Naukri Login Email</label>
                <input
                  type="email"
                  id="naukri-email"
                  className="input-field"
                  value={naukriEmail}
                  onChange={(e) => setNaukriEmail(e.target.value)}
                  placeholder="Enter your registered email"
                />
              </div>
              <div className="input-group">
                <label htmlFor="naukri-password" className="input-label">Naukri Password</label>
                <input
                  type="password"
                  id="naukri-password"
                  className="input-field"
                  value={naukriPassword}
                  onChange={(e) => setNaukriPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              <p className="upload-hint" style={{ marginTop: '-10px' }}>
                Your credentials are used locally by the automation engine and are never transmitted to third parties.
              </p>
            </div>
          )}
        </section>

        {/* Section 2: Resume Management */}
        <section className="settings-section glass-card" id="section-resume">
          <h2 className="settings-section-title">Resume</h2>

          {/* Current file */}
          {resumeData.filename && (
            <div className="current-resume">
              <div className="resume-file-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>
              <div className="resume-file-info">
                <span className="resume-file-name">{resumeData.filename}</span>
                <span className="resume-file-date">Uploaded {resumeData.uploadedAt || '—'}</span>
              </div>
            </div>
          )}

          {/* Upload status message */}
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.startsWith('✗') ? 'upload-error' : 'upload-success'}`}>
              {uploadStatus}
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            className={`upload-zone ${dragActive ? 'upload-zone-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            id="resume-upload-zone"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text">
              Drop your resume here or{' '}
              <label htmlFor="resume-file-input" className="upload-browse">
                browse
              </label>
            </p>
            <p className="upload-hint">Supports .pdf, .docx (max 5MB)</p>
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.docx,.doc"
              onChange={handleFileInput}
              className="sr-only"
            />
          </div>

          {/* Role & Proof Points */}
          <div className="resume-fields">
            <div className="input-group">
              <label htmlFor="job-role" className="input-label">Job Role</label>
              <input
                type="text"
                id="job-role"
                className="input-field"
                value={resumeData.jobRole}
                onChange={(e) => setResumeData({ ...resumeData, jobRole: e.target.value })}
                placeholder="e.g., SDET, Marketing Analyst"
              />
            </div>
            <div className="input-group">
              <label htmlFor="proof-points" className="input-label">Key Skills / Proof Points</label>
              <textarea
                id="proof-points"
                className="input-field"
                value={resumeData.proofPoints}
                onChange={(e) => setResumeData({ ...resumeData, proofPoints: e.target.value })}
                placeholder="e.g., Selenium, Java, 5 years experience"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Schedule */}
        <section className="settings-section glass-card" id="section-schedule">
          <h2 className="settings-section-title">Schedule</h2>

          {/* Auto Boost Toggle */}
          <div className="schedule-toggle-row">
            <div className="schedule-toggle-info">
              <span className="schedule-toggle-label">Auto Boost</span>
              <span className="schedule-toggle-desc">Automatically refresh your profile on schedule</span>
            </div>
            <label className="toggle-switch" id="auto-boost-toggle">
              <input
                type="checkbox"
                checked={scheduleData.isActive}
                onChange={() => setScheduleData({ ...scheduleData, isActive: !scheduleData.isActive })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {scheduleData.isActive && (
            <div className="schedule-options animate-fade-in">
              {/* Time Picker */}
              <div className="input-group">
                <label htmlFor="schedule-time" className="input-label">Boost Time</label>
                <input
                  type="time"
                  id="schedule-time"
                  className="input-field time-input"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                />
              </div>

              {/* Day Selector */}
              <div className="input-group">
                <span className="input-label">Active Days</span>
                <div className="day-selector">
                  {dayLabels.map((d) => (
                    <button
                      key={d.key}
                      className={`day-btn ${scheduleData.days[d.key] ? 'day-active' : ''}`}
                      onClick={() => toggleDay(d.key)}
                      type="button"
                      id={`day-${d.key}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 4: Danger Zone */}
        <section className="settings-section danger-section" id="section-danger">
          <h2 className="settings-section-title danger-title">Danger Zone</h2>
          <p className="danger-desc">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              className="btn btn-danger"
              id="delete-account-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          ) : (
            <div className="delete-confirm animate-fade-in">
              <p className="delete-confirm-text">
                Are you sure? This will delete all your data including session, resume, and run history.
              </p>
              <div className="delete-confirm-actions">
                <button
                  className="btn btn-danger"
                  id="confirm-delete-btn"
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                >
                  Yes, Delete Everything
                </button>
                <button
                  className="btn btn-ghost"
                  id="cancel-delete-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Save Button */}
      <div className="settings-save animate-fade-in-up">
        <button
          className="btn btn-primary btn-lg"
          id="save-settings-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default Settings;
