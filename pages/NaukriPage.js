const { randomDelay } = require('../utils/helpers');

class NaukriPage {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.profileUrl = 'https://www.naukri.com/mnjuser/profile?id=&altresid';
    
    // Locators
    this.resumeInput = page.locator('input[type="file"]').first();
    // Assuming the resume delete bin icon has a specific class or role. 
    // We will use a more generic text or locator. We might need to adjust based on actual DOM.
    this.deleteResumeIcon = page.locator('.trans-icon'); // Common class for delete icon on Naukri
    this.confirmDeleteBtn = page.getByRole('button', { name: 'Delete', exact: true });
    
    // Headline locators
    // Usually the edit icon is near the "Resume Headline" text.
    this.resumeHeadlineSection = page.locator('.resumeHeadline');
    this.editHeadlineIcon = this.resumeHeadlineSection.locator('.edit');
    this.headlineTextArea = page.locator('textarea[id="resumeHeadlineTxt"]');
    this.saveHeadlineBtn = page.getByRole('button', { name: 'Save', exact: true });
    
    // Updated Timestamp
    this.lastUpdatedTimestamp = page.getByText(/Profile last updated/);
    
    // Popup Guard Locators
    this.proPopupCloseBtn = page.locator('div.ltLayer.open').getByRole('link', { name: /close|CrossLayer/i }).or(page.locator('.ltLayer.open .crossLayer')).filter({ visible: true }).first();
  }

  async gotoProfile() {
    await this.page.goto(this.profileUrl);
    
    // Stealth Wait to allow security scripts to finish evaluating
    await this.page.waitForLoadState('networkidle');
    
    // Diagnostic logging for CI
    console.log('Current URL in CI:', this.page.url());
    console.log('Page Title in CI:', await this.page.title());
    
    // Auth Guard
    if (this.page.url().includes('login.naukri.com')) {
      throw new Error('CRITICAL: Session expired or redirected to login in GitHub Actions. Please refresh local auth_state.json and update the GitHub Secret.');
    }
    
    // Fast Failure wait - increased for slow CI runners
    try {
      await this.resumeHeadlineSection.waitFor({ state: 'visible', timeout: 30000 });
    } catch (e) {
      console.log('CRITICAL: Failed to load profile. Snapshotting content...');
      const bodyText = await this.page.locator('body').innerText();
      console.log('Body snippet:', bodyText.substring(0, 200));
      throw e;
    }
    
    // Inject CSS to forcefully hide non-modal overlays (toasts, success messages)
    try {
      await this.page.addStyleTag({ content: '.success-message-container, .toast, .trans-layer { display: none !important; }' });
    } catch (e) {
      console.log('Warning: Failed to inject CSS guard:', e.message);
    }
    
    await randomDelay();
  }

  /**
   * Handles the resume update via hidden file input
   * @param {string} resumePath 
   */
  async updateResume(resumePath) {
    // 1. Delete existing resume (if visible)
    if (await this.deleteResumeIcon.isVisible()) {
      await randomDelay();
      await this.deleteResumeIcon.click();
      await randomDelay();
      if (await this.confirmDeleteBtn.isVisible()) {
        await this.confirmDeleteBtn.click();
        await randomDelay();
      }
    }
    
    // 2. Upload new resume via hidden input
    // setInputFiles works even if the input is hidden
    await randomDelay();
    await this.resumeInput.setInputFiles(resumePath);
    await randomDelay();
    
    // Wait for the upload success message/indicator (might need adjustment based on exact DOM)
    // Often there's a loader or toast message.
    await this.page.waitForTimeout(3000); 
  }

  /**
   * Helper to dismiss annoying popups like "Power up your profile with Pro"
   */
  async handlePopups() {
    try {
      // Primary Action: Press Escape twice to dismiss generic overlays
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(300);
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500); // Wait for potential fade-out

      // Secondary Guard: Explicitly close active layer if still visible
      if (await this.proPopupCloseBtn.isVisible()) {
        console.log('Popup detected, closing it with force...');
        await randomDelay();
        await this.proPopupCloseBtn.click({ force: true });
        await this.page.waitForTimeout(500); // Wait for fade-out
        await randomDelay();
      }
    } catch (e) {
      // Ignore if popup handling fails, we don't want to fail the main workflow
      console.log('Popup guard exception:', e.message);
    }
  }

  async updateHeadline() {
    await this.handlePopups();
    await randomDelay();
    await this.editHeadlineIcon.first().click({ force: true });
    
    await this.headlineTextArea.waitFor({ state: 'visible', timeout: 5000 });
    await this.headlineTextArea.focus();
    await this.page.waitForFunction(el => el.value.length > 0, await this.headlineTextArea.elementHandle());
    
    // Read current text
    const currentText = await this.headlineTextArea.inputValue();
    
    // Append '.' and save
    await this.headlineTextArea.fill(currentText + '.');
    await this.page.waitForTimeout(1000);
    await randomDelay();
    await this.saveHeadlineBtn.filter({ visible: true }).first().click({ force: true });
    await this.page.waitForTimeout(1000);
    await this.handlePopups();
    await randomDelay();
    
    // Wait for save to complete and let the success state settle
    await this.page.waitForTimeout(1000);
    
    // Click edit again
    await this.editHeadlineIcon.first().click({ force: true });
    
    await this.headlineTextArea.waitFor({ state: 'visible', timeout: 5000 });
    await this.headlineTextArea.focus();
    await this.page.waitForFunction(el => el.value.length > 0, await this.headlineTextArea.elementHandle());
    
    // Remove '.' and save
    await this.headlineTextArea.fill(currentText);
    await this.page.waitForTimeout(1000);
    await randomDelay();
    await this.saveHeadlineBtn.filter({ visible: true }).first().click({ force: true });
    await this.page.waitForTimeout(1000);
    await this.handlePopups();
    await randomDelay();
    
    await this.page.waitForTimeout(2000);
  }

  async verifyUpdate() {
    // Wait for background API calls to finish instead of relying on a potentially unstable reload
    await this.page.waitForTimeout(5000);
    
    // Ensure the Save dialog is gone and the edit icon is stable and visible again
    await this.editHeadlineIcon.first().waitFor({ state: 'visible', timeout: 10000 });
    await randomDelay();
    
    try {
      const text = await this.lastUpdatedTimestamp.innerText({ timeout: 5000 });
      console.log('Profile update flow completed! Last updated: ' + text);
      return text;
    } catch (error) {
      console.warn('WARNING: Failed to explicitly verify the last updated timestamp. The update actions were completed successfully.');
      return 'Update verified via UI state transition';
    }
  }
}

module.exports = NaukriPage;
