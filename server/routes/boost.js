const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');
const boostService = require('../services/boostService');

const router = express.Router();

/* All boost routes require authentication */
router.use(authenticate);

/**
 * POST /api/boost/trigger
 * Manually triggers a profile boost for the authenticated user.
 * This creates a run_history entry and will eventually call the automation engine.
 *
 * NOTE: In this phase, we create the DB record only. The actual Playwright
 * automation integration (boostService.js) will be wired in a later step.
 */
router.post('/trigger', async (req, res) => {
  try {
    const userId = req.user.id;

    /* Verify user has a valid Naukri session */
    const session = db.prepare(
      'SELECT * FROM naukri_sessions WHERE user_id = ? AND is_valid = 1 ORDER BY captured_at DESC LIMIT 1'
    ).get(userId);

    if (!session) {
      return res.status(400).json({
        error: 'No active Naukri session found. Please connect your Naukri account in Settings.',
      });
    }

    /* Verify user has a resume uploaded */
    const resume = db.prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1').get(userId);
    if (!resume) {
      return res.status(400).json({
        error: 'No resume uploaded. Please upload your resume in Settings first.',
      });
    }

    /* Create a run_history entry with status 'pending' */
    const result = db.prepare(
      'INSERT INTO run_history (user_id, status, started_at) VALUES (?, ?, ?)'
    ).run(userId, 'pending', new Date().toISOString());

    const runId = result.lastInsertRowid;

    // Call the actual Playwright service
    const boostResult = await boostService.runBoost(userId, runId);

    // Update schedule's last_run_at
    db.prepare('UPDATE schedules SET last_run_at = ? WHERE user_id = ?')
      .run(new Date().toISOString(), userId);

    res.json({
      message: 'Profile boost triggered successfully!',
      run: { id: runId, status: 'success', headline: boostResult.headline },
    });
  } catch (err) {
    console.error('Boost trigger error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to trigger boost. The automation engine encountered an error.' });
  }
});

/**
 * GET /api/boost/history
 * Returns paginated run history for the authenticated user.
 * Query params: page (default 1), limit (default 10), status (optional filter)
 */
router.get('/history', (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status;

    let query = 'SELECT * FROM run_history WHERE user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM run_history WHERE user_id = ?';
    const params = [userId];

    if (statusFilter && ['success', 'failed', 'session_expired', 'pending'].includes(statusFilter)) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(statusFilter);
    }

    query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';

    const countParams = [...params];
    params.push(limit, offset);

    const runs = db.prepare(query).all(...params);
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      runs: runs.map((r) => ({
        id: r.id,
        status: r.status,
        headline: r.headline_used,
        resumeUpdated: !!r.resume_uploaded,
        error: r.error_message,
        startedAt: r.started_at,
        completedAt: r.completed_at,
        duration: r.duration_seconds,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Boost history error:', err.message);
    res.status(500).json({ error: 'Failed to get boost history.' });
  }
});

/**
 * GET /api/boost/stats
 * Returns aggregate stats for the authenticated user.
 */
router.get('/stats', (req, res) => {
  try {
    const userId = req.user.id;

    const total = db.prepare('SELECT COUNT(*) as count FROM run_history WHERE user_id = ?').get(userId);
    const successful = db.prepare('SELECT COUNT(*) as count FROM run_history WHERE user_id = ? AND status = ?').get(userId, 'success');

    /* Calculate current streak (consecutive successful days) */
    const recentRuns = db.prepare(
      'SELECT status, DATE(started_at) as run_date FROM run_history WHERE user_id = ? ORDER BY started_at DESC LIMIT 30'
    ).all(userId);

    let streak = 0;
    for (const run of recentRuns) {
      if (run.status === 'success') {
        streak++;
      } else {
        break;
      }
    }

    const successRate = total.count > 0 ? Math.round((successful.count / total.count) * 100) : 0;

    res.json({
      stats: {
        totalBoosts: total.count,
        successRate,
        currentStreak: streak,
        totalSuccessful: successful.count,
        totalFailed: total.count - successful.count,
      },
    });
  } catch (err) {
    console.error('Boost stats error:', err.message);
    res.status(500).json({ error: 'Failed to get stats.' });
  }
});

module.exports = router;
