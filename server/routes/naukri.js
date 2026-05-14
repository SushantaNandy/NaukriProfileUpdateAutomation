const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

const router = express.Router();

/* All naukri routes require authentication */
router.use(authenticate);

/**
 * POST /api/naukri/connect
 * Initiates the Naukri session capture flow.
 *
 * In Phase 1 (local), this will launch a headed Playwright browser
 * for the user to log in manually. The session cookies are then
 * saved to the database.
 *
 * NOTE: For now, this creates a mock session. The actual Playwright
 * browser launch will be integrated when we wire the automation engine.
 */
router.post('/connect', async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Naukri email and password are required.' });
    }

    console.log(`[API] Initiating Naukri connect for user ${userId} with email ${email}`);

    // Path to the root project script
    const scriptPath = path.resolve(__dirname, '../../../scripts/headless-login.js');
    const projectRoot = path.resolve(__dirname, '../../../');

    // Run the Playwright script securely via child_process
    const { stdout, stderr } = await execPromise(`node "${scriptPath}"`, {
      cwd: projectRoot,
      env: {
        ...process.env,
        NAUKRI_EMAIL: email,
        NAUKRI_PASSWORD: password,
        USER_ID: userId
      },
      timeout: 60000 // 60 seconds max
    });

    // Extract the JSON session data from stdout
    const sessionMatch = stdout.match(/---SESSION_START---\n([\s\S]*?)\n---SESSION_END---/);
    if (!sessionMatch || !sessionMatch[1]) {
      console.error('Failed to parse session from stdout:', stdout);
      console.error('Stderr:', stderr);
      throw new Error('Failed to retrieve session from Playwright.');
    }

    const sessionData = sessionMatch[1].trim();

    /* Invalidate any existing sessions */
    db.prepare('UPDATE naukri_sessions SET is_valid = 0 WHERE user_id = ?').run(userId);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    db.prepare(
      'INSERT INTO naukri_sessions (user_id, session_data, expires_at, is_valid) VALUES (?, ?, ?, 1)'
    ).run(userId, sessionData, expiresAt);

    res.json({
      message: 'Naukri account connected successfully.',
      connection: {
        isConnected: true,
        expiresAt,
      },
    });
  } catch (err) {
    console.error('Naukri connect error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to connect Naukri account. Check credentials or try again later.' });
  }
});

/**
 * GET /api/naukri/status
 * Returns the Naukri connection status for the authenticated user.
 */
router.get('/status', (req, res) => {
  try {
    const session = db.prepare(
      'SELECT * FROM naukri_sessions WHERE user_id = ? AND is_valid = 1 ORDER BY captured_at DESC LIMIT 1'
    ).get(req.user.id);

    if (!session) {
      return res.json({
        connection: { isConnected: false, expiresAt: null, expiresIn: null },
      });
    }

    /* Calculate time until expiry */
    const now = new Date();
    const expiry = new Date(session.expires_at);
    const diffMs = expiry - now;
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    /* Auto-invalidate if expired */
    if (diffMs <= 0) {
      db.prepare('UPDATE naukri_sessions SET is_valid = 0 WHERE id = ?').run(session.id);
      return res.json({
        connection: { isConnected: false, expiresAt: null, expiresIn: null },
      });
    }

    res.json({
      connection: {
        isConnected: true,
        expiresAt: session.expires_at,
        expiresIn: `${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        capturedAt: session.captured_at,
      },
    });
  } catch (err) {
    console.error('Naukri status error:', err.message);
    res.status(500).json({ error: 'Failed to get Naukri status.' });
  }
});

module.exports = router;
