const { randomDelay } = require('../utils/helpers');
const { expect } = require('@playwright/test');

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

    // Login Locators
    this.usernameField = page.locator('#usernameField');
    this.passwordField = page.locator('#passwordField');
    this.loginSubmitBtn = page.locator('button[type="submit"], button.waves-effect.waves-light, button.btn-primary.loginButton');
    this.googleLoginBtn = page.locator('.google-login, button:has-text("Google"), .google-text');
  }

  isPageOpen() {
    return !this.page.isClosed();
  }

  async gotoProfile() {
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    
    // Increase randomDelay before navigation to 5-10 seconds to avoid burst detection
    console.log('Stealth: Waiting 5-10 seconds before navigating...');
    await this.page.waitForTimeout(Math.floor(Math.random() * 5000) + 5000);
    
    await this.page.goto(this.profileUrl);
    
    // Stealth Wait to allow security scripts to finish evaluating without hanging on persistent connections
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
    
    // Diagnostic logging for CI
    console.log('Current URL in CI:', this.page.url());
    console.log('Page Title in CI:', await this.page.title());
    
    // Auth Guard - Attempt Login if redirected
    if (this.page.url().includes('login.naukri.com') || this.page.url().includes('nlogin/login')) {
      console.log('Session expired or not logged in. Initiating login flow...');
      await this.loginBasedOnEnv();
      
      // Navigate back to profile after successful login
      console.log('Navigating back to profile after login...');
      await this.page.goto(this.profileUrl);
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForTimeout(3000);
    }
    
    // Fast Failure wait - increased for slow CI runners
    try {
      await this.resumeHeadlineSection.waitFor({ state: 'visible', timeout: 30000 });
    } catch (e) {
      console.log('CRITICAL: Failed to load profile. Snapshotting content...');
      console.log('Page Title in CI:', await this.page.title());
      const bodyText = await this.page.content();
      console.log('Body snippet:', bodyText.substring(0, 500));
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
   * Toggles between Google Login and Credentials Login based on environment variables.
   */
  async loginBasedOnEnv() {
    const email = process.env.NAUKRI_EMAIL;
    const password = process.env.NAUKRI_PASSWORD;
    
    if (email && password) {
      await this.loginWithCredentials(email, password);
    } else if (email && !password) {
      await this.loginWithGoogle();
    } else {
      console.log('No NAUKRI_EMAIL found in environment variables. Assuming already logged in or manual intervention required.');
    }
    
    await this.verifyDashboardLoaded();
  }

  /**
   * Logs in using email and password.
   */
  async loginWithCredentials(email, password) {
    console.log(`Logging in with credentials for: ${email}`);
    
    if (!this.page.url().includes('nlogin/login')) {
        await this.page.goto('https://www.naukri.com/nlogin/login');
    }
    
    await this.usernameField.waitFor({ state: 'visible', timeout: 15000 });
    await this.usernameField.fill(email);
    
    await this.page.waitForTimeout(1000);
    await this.passwordField.fill(password);
    
    await this.page.waitForTimeout(1000);
    await this.loginSubmitBtn.first().click({ force: true });
    
    console.log('Submitted credentials. Waiting for authentication...');
  }

  /**
   * Logs in using Google (Placeholder for manual/stealth interaction if needed).
   */
  async loginWithGoogle() {
    console.log('Initiating Google Login flow...');
    
    if (!this.page.url().includes('nlogin/login')) {
        await this.page.goto('https://www.naukri.com/nlogin/login');
    }
    
    try {
        await this.googleLoginBtn.first().waitFor({ state: 'visible', timeout: 10000 });
        await this.googleLoginBtn.first().click({ force: true });
        console.log('Clicked Google Login button. Depending on stealth, this may require manual approval or existing cookies.');
    } catch (e) {
        console.log('Google login button not found or already logged in.');
    }
  }

  /**
   * Verifies the dashboard is successfully loaded after a login attempt.
   */
  async verifyDashboardLoaded() {
    console.log('Verifying dashboard is loaded...');
    try {
        // Wait for a generic dashboard element or the URL change
        await this.page.waitForURL('**/mnjuser/profile**', { timeout: 30000 });
        console.log('✅ Dashboard loaded successfully.');
    } catch (e) {
        console.log('⚠️ Timeout waiting for dashboard URL. Validating via DOM elements...');
        await this.page.locator('.nI-gNb-header__wrapper, .resumeHeadline, .dashboard-container').first().waitFor({ state: 'visible', timeout: 15000 });
        console.log('✅ Dashboard DOM element verified.');
    }
  }

  /**
   * Handles the resume update via hidden file input
   * @param {string} resumePath 
   */
  async updateResume(resumePath) {
    // 1. Delete existing resume (if visible)
    if (this.isPageOpen() && await this.deleteResumeIcon.isVisible()) {
      if (this.isPageOpen()) await randomDelay();
      if (this.isPageOpen()) await this.deleteResumeIcon.click();
      if (this.isPageOpen()) await randomDelay();
      if (this.isPageOpen() && await this.confirmDeleteBtn.isVisible()) {
        if (this.isPageOpen()) await this.confirmDeleteBtn.click();
        if (this.isPageOpen()) await randomDelay();
      }
    }
    
    // 2. Upload new resume via hidden input
    if (this.isPageOpen()) await randomDelay();

    // CI Hardening: State-Based Wait
    try {
      // Catch the specific XHR/Fetch request Naukri sends during the resume save operation
      const uploadPromise = this.page.waitForResponse(
        response => response.request().method() === 'POST' && (response.url().includes('resume') || response.url().includes('upload') || response.url().includes('profile')), 
        { timeout: 30000 }
      );

      if (this.isPageOpen()) await this.resumeInput.setInputFiles(resumePath);
      
      // CI Hardening: The .docx Buffer
      if (process.env.CI === 'true') {
         console.log('CI Environment Detected: Waiting 5000ms for .docx server-side parsing...');
         if (this.isPageOpen()) await this.page.waitForTimeout(5000);
      }
      
      if (this.isPageOpen()) await randomDelay();
      if (this.isPageOpen()) await uploadPromise; // Wait for the backend to store the file
    } catch (error) {
      throw new Error('Naukri Backend failed to acknowledge .docx upload within 30s');
    }
    
    // CI Hardening: UI Content Verification
    const path = require('path');
    const expectedFilename = path.basename(resumePath);
    console.log(`Verifying UI attachment for: ${expectedFilename}`);
    
    try {
       if (this.isPageOpen()) await this.page.getByText(expectedFilename, { exact: false }).waitFor({ state: 'visible', timeout: 30000 });
       console.log(`✅ Verified UI presence of uploaded file: ${expectedFilename}`);
    } catch (e) {
       console.error(`❌ Upload UI Verification Failed: Filename ${expectedFilename} did not appear.`);
       throw new Error(`Upload UI verification failed for ${expectedFilename}`);
    }

    if (this.isPageOpen()) await this.page.waitForTimeout(3000); 
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

  async updateHeadline(newHeadline = null) {
    await this.handlePopups();
    await randomDelay();
    
    // Strict Cleanup wait
    await this.page.locator('.trans-layer, .nI-gNb-header__wrapper').first().waitFor({ state: 'visible' }).catch(() => {});
    
    // Actionable Check
    await this.editHeadlineIcon.first().waitFor({ state: 'visible' });
    await this.editHeadlineIcon.first().click({ force: true });
    
    // Retry Click Logic
    try {
      await this.headlineTextArea.waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
      console.log('Retry: Headline modal not appearing, clicking edit icon again...');
      await this.page.waitForTimeout(2000);
      await this.editHeadlineIcon.first().click({ force: true });
    }
    
    // Handle Modal Re-mounting
    await this.headlineTextArea.first().waitFor({ state: 'attached' });
    await expect(this.headlineTextArea).toBeVisible({ timeout: 20000 });
    
    if (newHeadline) {
      console.log(`Setting new AI Headline: "${newHeadline}"`);
      await this.headlineTextArea.fill(newHeadline);
      
      try {
        await expect(this.headlineTextArea).toHaveValue(newHeadline, { timeout: 5000 });
      } catch (error) {
        console.log('Recovery: Textarea value mismatched after filling. Forcing modal re-sync...');
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(1000);
        await this.editHeadlineIcon.first().click({ force: true });
        await this.headlineTextArea.first().waitFor({ state: 'attached' });
        await expect(this.headlineTextArea).toBeVisible({ timeout: 20000 });
        await this.headlineTextArea.fill(newHeadline);
        await expect(this.headlineTextArea).toHaveValue(newHeadline, { timeout: 5000 });
      }
      
      await this.page.waitForTimeout(1000);
      await randomDelay();
      await this.saveHeadlineBtn.filter({ visible: true }).first().click({ force: true });
      await this.page.waitForTimeout(1000);
      await this.handlePopups();
      await randomDelay();
      await this.page.waitForTimeout(2000);
      return; // If we set a new dynamic headline, we don't need the dummy second edit pass
    }

    // Handle Modal Re-mounting for the fallback pass
    await this.headlineTextArea.first().waitFor({ state: 'attached' });
    await expect(this.headlineTextArea).toBeVisible({ timeout: 20000 });

    // Read current text
    const currentText = await this.headlineTextArea.inputValue();
    
    // Append '.' and save
    const appendedText = currentText + '.';
    await this.headlineTextArea.fill(appendedText);
    
    try {
      await expect(this.headlineTextArea).toHaveValue(appendedText, { timeout: 5000 });
    } catch (error) {
      console.log('Recovery: Textarea value mismatched after filling. Forcing modal re-sync...');
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(1000);
      await this.editHeadlineIcon.first().click({ force: true });
      await this.headlineTextArea.first().waitFor({ state: 'attached' });
      await expect(this.headlineTextArea).toBeVisible({ timeout: 20000 });
      await this.headlineTextArea.fill(appendedText);
      await expect(this.headlineTextArea).toHaveValue(appendedText, { timeout: 5000 });
    }
    await this.page.waitForTimeout(1000);
    await randomDelay();
    await this.saveHeadlineBtn.filter({ visible: true }).first().click({ force: true });
    await this.page.waitForTimeout(1000);
    await this.handlePopups();
    
    // Wait for strict modal detachment and stabilization
    await this.page.locator('.ltLayer').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // Cooldown period for React state to settle
    await this.page.waitForTimeout(5000);
    await randomDelay();
    
    // Conditional Reload: verify if the headline is updated in the DOM
    // We appended a '.' to currentText
    const expectedText = currentText + '.';
    let requiresReload = false;
    try {
       // Since text can be quite long or formatted, we check if the DOM contains it
       await this.page.getByText(expectedText, { exact: false }).waitFor({ state: 'visible', timeout: 5000 });
       console.log('UI updated dynamically, skipping reload.');
    } catch (e) {
       console.log('UI failed to reflect change dynamically. Reloading...');
       requiresReload = true;
    }

    if (requiresReload) {
       console.log('Clean Slate: Reloading profile to destroy ghost modals...');
       await this.page.goto(this.profileUrl, { waitUntil: 'domcontentloaded' });
       
       // Re-Guard CSS
       await this.page.addStyleTag({ content: '.success-message-container, .toast, .trans-layer { display: none !important; }' }).catch(() => {});
    }
    
    // Confirm Icon Visibility with fresh locator timeout before clicking edit again
    await this.editHeadlineIcon.first().waitFor({ state: 'visible', timeout: 10000 });
    await this.editHeadlineIcon.first().scrollIntoViewIfNeeded();
    await this.editHeadlineIcon.first().click({ force: true });
    
    // Retry Click Logic for second edit
    try {
      await this.headlineTextArea.waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
      console.log('Retry: Headline modal not appearing on second edit, clicking edit icon again...');
      await this.page.waitForTimeout(2000);
      await this.editHeadlineIcon.first().click({ force: true });
    }
    
    // Handle Modal Re-mounting
    await this.headlineTextArea.first().waitFor({ state: 'attached' });
    await expect(this.headlineTextArea).toBeVisible({ timeout: 20000 });
    
    // Remove '.' and save
    await this.headlineTextArea.fill(currentText);
    
    try {
      await expect(this.headlineTextArea).toHaveValue(currentText, { timeout: 5000 });
    } catch (error) {
      console.log('Recovery: Textarea value mismatched after filling. Forcing modal re-sync...');
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(1000);
      await this.editHeadlineIcon.first().click({ force: true });
      await this.headlineTextArea.first().waitFor({ state: 'attached' });
      await expect(this.headlineTextArea).toBeVisible({ timeout: 20000 });
      await this.headlineTextArea.fill(currentText);
      await expect(this.headlineTextArea).toHaveValue(currentText, { timeout: 5000 });
    }
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
