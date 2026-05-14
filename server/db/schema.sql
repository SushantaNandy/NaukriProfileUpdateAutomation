-- ==========================================================================
-- NaukriBoost Database Schema
-- Engine: SQLite via better-sqlite3
-- ==========================================================================

-- Users of the NaukriBoost webapp (NOT Naukri credentials)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',  -- 'user' or 'admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Naukri browser session cookies (encrypted, NOT passwords)
CREATE TABLE IF NOT EXISTS naukri_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_data TEXT NOT NULL,       -- JSON blob of browser cookies
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,             -- Auto-expire after 7 days
    is_valid INTEGER DEFAULT 1       -- 1 = valid, 0 = expired
);

-- Uploaded resume files
CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    stored_path TEXT NOT NULL,        -- Disk path: ./uploads/{userId}/{filename}
    job_role TEXT,                    -- e.g., "SDET", "Marketing Analyst"
    proof_points TEXT,               -- Keywords for headline generation
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- History of every automation run
CREATE TABLE IF NOT EXISTS run_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,             -- 'success', 'failed', 'session_expired'
    headline_used TEXT,               -- The AI headline that was set
    resume_uploaded INTEGER DEFAULT 0,-- 1 = yes, 0 = no
    error_message TEXT,
    screenshot_path TEXT,             -- Screenshot path on failure
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    duration_seconds INTEGER
);

-- Per-user schedule preferences
CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    is_active INTEGER DEFAULT 1,     -- 1 = enabled, 0 = paused
    boost_time TEXT DEFAULT '09:00', -- HH:MM format (IST)
    active_days TEXT DEFAULT 'mon,tue,wed,thu,fri', -- Comma-separated
    last_run_at DATETIME,
    next_run_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_run_history_user ON run_history(user_id);
CREATE INDEX IF NOT EXISTS idx_run_history_status ON run_history(status);
CREATE INDEX IF NOT EXISTS idx_naukri_sessions_user ON naukri_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(is_active);
