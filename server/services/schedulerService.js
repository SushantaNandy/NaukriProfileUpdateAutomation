const cron = require('node-cron');
const db = require('../db/database');
const boostService = require('./boostService');

class SchedulerService {
  constructor() {
    this.cronJob = null;
  }

  /**
   * Starts the cron scheduler. Runs every minute.
   */
  start() {
    console.log('[SchedulerService] Starting node-cron automated scheduler...');

    // Runs every minute: * * * * *
    this.cronJob = cron.schedule('* * * * *', async () => {
      this.checkAndRunSchedules();
    });
  }

  /**
   * Stops the cron scheduler (useful for graceful shutdown or tests).
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('[SchedulerService] Stopped node-cron automated scheduler.');
    }
  }

  /**
   * Evaluates all active schedules and triggers boosts if time/day matches.
   */
  async checkAndRunSchedules() {
    try {
      const now = new Date();
      
      // Get current day of week (e.g., 'mon', 'tue')
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const currentDay = days[now.getDay()];

      // Get current time in HH:MM format
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      // Get today's date string (YYYY-MM-DD) to check if already run today
      const todayDate = now.toISOString().split('T')[0];

      // Query database for schedules that match the criteria
      // 1. is_active = 1
      // 2. boost_time matches currentTime
      // 3. active_days contains currentDay
      const schedules = db.prepare(`
        SELECT * FROM schedules 
        WHERE is_active = 1 
        AND boost_time = ? 
        AND active_days LIKE ?
      `).all(currentTime, `%${currentDay}%`);

      if (schedules.length === 0) {
        return; // Nothing to run this minute
      }

      console.log(`[SchedulerService] Found ${schedules.length} schedule(s) for ${currentDay} at ${currentTime}.`);

      for (const schedule of schedules) {
        const userId = schedule.user_id;

        // Ensure we haven't already run this schedule today
        let hasRunToday = false;
        if (schedule.last_run_at) {
          const lastRunDate = schedule.last_run_at.split('T')[0];
          if (lastRunDate === todayDate) {
            hasRunToday = true;
          }
        }

        if (hasRunToday) {
          console.log(`[SchedulerService] Skipping user ${userId} - already ran today.`);
          continue;
        }

        // Trigger the boost sequence!
        console.log(`[SchedulerService] Triggering scheduled boost for user ${userId}...`);
        
        try {
          // Create a run_history entry with status 'pending'
          const result = db.prepare(
            'INSERT INTO run_history (user_id, status, started_at) VALUES (?, ?, ?)'
          ).run(userId, 'pending', new Date().toISOString());

          const runId = result.lastInsertRowid;

          // Update the schedule's last_run_at immediately to prevent duplicate triggers
          db.prepare('UPDATE schedules SET last_run_at = ? WHERE id = ?')
            .run(new Date().toISOString(), schedule.id);

          // Run the boost asynchronously (fire-and-forget)
          // We intentionally don't await here so multiple users can run in parallel
          // and one slow user doesn't block the loop.
          boostService.runBoost(userId, runId)
            .then(res => console.log(`[SchedulerService] Boost succeeded for user ${userId}: ${res.headline}`))
            .catch(err => console.error(`[SchedulerService] Boost failed for user ${userId}:`, err.message));

        } catch (err) {
          console.error(`[SchedulerService] Failed to initialize boost for user ${userId}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[SchedulerService] Error evaluating schedules:', error);
    }
  }
}

module.exports = new SchedulerService();
