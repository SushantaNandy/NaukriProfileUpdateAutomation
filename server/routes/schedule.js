const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/* All schedule routes require authentication */
router.use(authenticate);

/**
 * GET /api/schedule
 * Returns the schedule preferences for the authenticated user.
 */
router.get('/', (req, res) => {
  try {
    const schedule = db.prepare(
      'SELECT * FROM schedules WHERE user_id = ?'
    ).get(req.user.id);

    if (!schedule) {
      return res.json({ schedule: null });
    }

    res.json({
      schedule: {
        isActive: !!schedule.is_active,
        boostTime: schedule.boost_time,
        activeDays: schedule.active_days ? schedule.active_days.split(',') : [],
        lastRunAt: schedule.last_run_at,
        nextRunAt: schedule.next_run_at,
      },
    });
  } catch (err) {
    console.error('Get schedule error:', err.message);
    res.status(500).json({ error: 'Failed to get schedule.' });
  }
});

/**
 * PUT /api/schedule
 * Updates the schedule preferences for the authenticated user.
 * Body: { isActive, boostTime, activeDays }
 */
router.put('/', (req, res) => {
  try {
    const { isActive, boostTime, activeDays } = req.body;
    const userId = req.user.id;

    /* Validate boostTime format (HH:MM) */
    if (boostTime && !/^\d{2}:\d{2}$/.test(boostTime)) {
      return res.status(400).json({ error: 'boostTime must be in HH:MM format.' });
    }

    /* Validate activeDays */
    const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    if (activeDays && Array.isArray(activeDays)) {
      const invalid = activeDays.filter((d) => !validDays.includes(d));
      if (invalid.length > 0) {
        return res.status(400).json({ error: `Invalid days: ${invalid.join(', ')}` });
      }
    }

    /* Upsert schedule */
    const existing = db.prepare('SELECT id FROM schedules WHERE user_id = ?').get(userId);

    if (existing) {
      db.prepare(
        'UPDATE schedules SET is_active = ?, boost_time = ?, active_days = ?, updated_at = ? WHERE user_id = ?'
      ).run(
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        boostTime || '09:00',
        Array.isArray(activeDays) ? activeDays.join(',') : 'mon,tue,wed,thu,fri',
        new Date().toISOString(),
        userId
      );
    } else {
      db.prepare(
        'INSERT INTO schedules (user_id, is_active, boost_time, active_days) VALUES (?, ?, ?, ?)'
      ).run(
        userId,
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        boostTime || '09:00',
        Array.isArray(activeDays) ? activeDays.join(',') : 'mon,tue,wed,thu,fri'
      );
    }

    /* Fetch updated schedule */
    const updated = db.prepare('SELECT * FROM schedules WHERE user_id = ?').get(userId);

    res.json({
      message: 'Schedule updated successfully.',
      schedule: {
        isActive: !!updated.is_active,
        boostTime: updated.boost_time,
        activeDays: updated.active_days ? updated.active_days.split(',') : [],
        lastRunAt: updated.last_run_at,
        nextRunAt: updated.next_run_at,
      },
    });
  } catch (err) {
    console.error('Update schedule error:', err.message);
    res.status(500).json({ error: 'Failed to update schedule.' });
  }
});

module.exports = router;
