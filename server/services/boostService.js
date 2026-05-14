const db = require('../db/database');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

class BoostService {
  /**
   * Executes the Playwright automation for the given user.
   */
  async runBoost(userId, runId) {
    const startTime = Date.now();
    let sessionFilePath = null;

    try {
      // 1. Fetch Naukri session
      const session = db.prepare(
        'SELECT session_data FROM naukri_sessions WHERE user_id = ? AND is_valid = 1 ORDER BY captured_at DESC LIMIT 1'
      ).get(userId);

      if (!session) {
        throw new Error('No valid Naukri connection found. Please connect your account in Settings.');
      }

      // 2. Fetch Resume
      const resume = db.prepare(
        'SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1'
      ).get(userId);

      if (!resume) {
        throw new Error('No resume found. Please upload a resume in Settings.');
      }

      // 3. Write session data to a temporary file for Playwright
      const tempDir = path.resolve(__dirname, '../../playwright/.auth');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      sessionFilePath = path.join(tempDir, `temp_session_${userId}_${runId}.json`);
      fs.writeFileSync(sessionFilePath, session.session_data);

      // 4. Set up paths and environment
      const scriptPath = path.resolve(__dirname, '../../scripts/headless-boost.js');
      const projectRoot = path.resolve(__dirname, '../../');
      
      console.log(`[BoostService] Spawning headless Playwright for User ${userId}`);

      // 5. Execute Playwright script
      const { stdout, stderr } = await execPromise(`node "${scriptPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          SESSION_FILE_PATH: sessionFilePath,
          RESUME_FILE_PATH: resume.stored_path,
          USER_ROLE: resume.job_role || 'Software Engineer',
          USER_PROOF_POINTS: resume.proof_points || '',
        },
        timeout: 120000 // 2 minutes max
      });

      // 6. Extract Success Information
      const successMatch = stdout.match(/---BOOST_SUCCESS---\n([\s\S]*?)\n---BOOST_END---/);
      if (!successMatch || !successMatch[1]) {
        console.error('[BoostService] Failed to find success marker in stdout:', stdout);
        console.error('[BoostService] Stderr:', stderr);
        throw new Error('Playwright script completed but success marker was not found.');
      }

      const successData = JSON.parse(successMatch[1].trim());
      const durationMs = Date.now() - startTime;
      const durationSeconds = Math.round(durationMs / 1000);

      // 7. Update Run History Database
      db.prepare(`
        UPDATE run_history 
        SET status = 'success', duration_seconds = ?, headline_used = ?, resume_updated = 1
        WHERE id = ?
      `).run(durationSeconds, successData.headline, runId);

      return {
        success: true,
        message: 'Boost completed successfully!',
        headline: successData.headline
      };

    } catch (error) {
      console.error(`[BoostService] Error for run ${runId}:`, error.message);
      
      const durationMs = Date.now() - startTime;
      const durationSeconds = Math.round(durationMs / 1000);

      // Update Run History Database with failure
      db.prepare(`
        UPDATE run_history 
        SET status = 'failed', duration_seconds = ?, error_message = ?
        WHERE id = ?
      `).run(durationSeconds, error.message, runId);

      throw error;
    } finally {
      // Cleanup temporary session file
      if (sessionFilePath && fs.existsSync(sessionFilePath)) {
        try {
          fs.unlinkSync(sessionFilePath);
        } catch (e) {
          console.error('[BoostService] Failed to cleanup session file:', e.message);
        }
      }
    }
  }
}

module.exports = new BoostService();
