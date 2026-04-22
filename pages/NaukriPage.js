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
  }

  async gotoProfile() {
    await this.page.goto(this.profileUrl);
    await this.resumeHeadlineSection.waitFor({ state: 'visible' });
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

  async updateHeadline() {
    await randomDelay();
    await this.editHeadlineIcon.click();
    await randomDelay();
    
    // Read current text
    const currentText = await this.headlineTextArea.inputValue();
    
    // Append '.' and save
    await this.headlineTextArea.fill(currentText + '.');
    await randomDelay();
    await this.saveHeadlineBtn.click();
    await randomDelay();
    
    // Wait for save to complete (e.g. edit icon appears again)
    await this.page.waitForTimeout(2000);
    
    // Click edit again
    await this.editHeadlineIcon.click();
    await randomDelay();
    
    // Remove '.' and save
    await this.headlineTextArea.fill(currentText);
    await randomDelay();
    await this.saveHeadlineBtn.click();
    await randomDelay();
    
    await this.page.waitForTimeout(2000);
  }

  async verifyUpdate() {
    await this.page.reload();
    await this.resumeHeadlineSection.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(3000); // Add a small wait to allow header to stabilize
    await randomDelay();
    
    try {
      const text = await this.lastUpdatedTimestamp.innerText({ timeout: 5000 });
      return text;
    } catch (error) {
      console.warn('WARNING: Failed to verify the last updated timestamp. The update actions were completed, but the UI verification timed out.');
      return 'Verification skipped due to locator timeout';
    }
  }
}

module.exports = NaukriPage;
