const { expect } = require('@playwright/test');

class NVitePage {
  constructor(page) {
    this.page = page;
    this.inboxUrl = 'https://www.naukri.com/mnjuser/inbox';
  }

  isPageOpen() {
    return !this.page.isClosed();
  }

  async safeWait(ms) {
    if (this.isPageOpen()) {
      await this.page.waitForTimeout(ms);
    }
  }

  async respawnPage() {
    console.log('--- EXECUTING PAGE RESPAWN PROTOCOL ---');
    try {
      const context = this.page.context();
      await this.page.close().catch(() => {});
      this.page = await context.newPage();
      console.log('--- RESPAWN COMPLETE ---');
    } catch (e) {
      throw new Error(`CRITICAL: Page Respawn Protocol Failed - ${e.message}`);
    }
  }

  async gotoInbox() {
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    
    console.log('Phase 1: Homepage Warmup (NVites)');
    try {
      await this.page.goto('https://www.naukri.com/', { waitUntil: 'commit', timeout: 30000 });
      await this.safeWait(3000);
    } catch (e) {
      console.log('Warmup Tarpit. Respawning...');
      await this.respawnPage();
      await this.page.goto('https://www.naukri.com/', { waitUntil: 'commit', timeout: 30000 }).catch(() => {});
    }

    console.log('Phase 2: Deep Link to Inbox');
    try {
      await this.page.goto(this.inboxUrl, { waitUntil: 'commit', timeout: 60000 });
    } catch (e) {
      if (!this.page.url().includes('mnjuser/inbox')) {
        console.log('Tarpit on deep link. Respawning...');
        await this.respawnPage();
        await this.page.goto(this.inboxUrl, { waitUntil: 'commit', timeout: 60000 });
      }
    }
    
    await this.page.waitForLoadState('domcontentloaded');
    await this.safeWait(3000);
    
    console.log('Human delay: waiting 5s for overlays to clear...');
    await this.safeWait(5000);
  }

  async scrollToBottom() {
    console.log('Scrolling to bottom to lazy load invites...');
    let previousHeight = 0;
    let currentHeight = await this.page.evaluate('document.body.scrollHeight');
    let attempts = 0;
    while (previousHeight !== currentHeight && attempts < 5) {
      previousHeight = currentHeight;
      await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await this.safeWait(2000);
      currentHeight = await this.page.evaluate('document.body.scrollHeight');
      attempts++;
    }
  }

  async processInvites(limit = 2) {
    console.log(`Starting processInvites with limit: ${limit}`);
    let appliedCount = 0;
    const summary = {
      applied: [],
      skipped: []
    };

    const applyButtons = this.page.locator('button:has-text("Apply"), button:has-text("Applied")');
    try {
      await applyButtons.first().waitFor({ state: 'visible', timeout: 20000 });
    } catch (e) {
      console.log(`No invite buttons found within 20s. Current URL: ${this.page.url()}`);
    }

    let count = await applyButtons.count();
    
    if (count === 0) {
        console.log(`Still no invite cards found. Aborting. Current URL: ${this.page.url()}`);
        return;
    }

    console.log(`Found ${count} invite cards to process.`);

    for (let i = 0; i < count; i++) {
      if (appliedCount >= limit) {
        console.log(`\nDemo cap of ${limit} reached. Stopping iteration.`);
        break;
      }

      // Re-evaluate button locator to prevent stale element errors, especially after navigations
      const currentButtons = this.page.locator('button:has-text("Apply"), button:has-text("Applied")');
      
      // Ensure the button exists at this index
      if (await currentButtons.count() <= i) {
          console.log(`Index ${i} is out of bounds for currently available buttons. Breaking loop.`);
          break;
      }

      const btn = currentButtons.nth(i);
      
      let btnText = '';
      try {
          btnText = await btn.innerText({ timeout: 2000 });
      } catch (e) {
          console.log(`Could not resolve button text for index ${i}. Skipping.`);
          continue;
      }
      
      // Attempt to extract company name intelligently
      let companyName = `Company (Index ${i})`;
      try {
          const card = btn.locator('xpath=ancestor::*[contains(@class, "tuple") or contains(@class, "msg-item") or contains(@class, "card") or contains(@class, "message")]').first();
          if (await card.count() > 0) {
              const compElem = card.locator('.company-name, .companyName, .comp-name, a.title, .subTitle').first();
              if (await compElem.isVisible({ timeout: 1000 })) {
                  companyName = await compElem.innerText();
              }
          }
      } catch (e) {}
      
      if (btnText.trim().toLowerCase() === 'applied') {
         console.log(`Skipping: Already Applied to ${companyName}`);
         summary.skipped.push(companyName);
         continue;
      }
      
      if (btnText.trim().toLowerCase() === 'apply') {
         console.log(`Applying to: ${companyName}`);
         await btn.click();
         await this.safeWait(3000);
         
         // Handle potential Notice Period Modal
         await this.handleNoticePeriodModal();
         
         summary.applied.push(companyName);
         appliedCount++;
         
         // Navigation Recovery Check
         if (!this.page.url().includes('mnjuser/inbox')) {
            console.log('Redirect detected after apply. Navigating back to inbox...');
            await this.gotoInbox();
            await this.scrollToBottom(); // Re-load lazy items to restore state
         }
      }
    }
    
    console.log('\n================================');
    console.log('--- NVITE AUTO-APPLY SUMMARY ---');
    console.log(`Successfully applied to: ${summary.applied.length > 0 ? summary.applied.join(', ') : 'None'}`);
    console.log(`Skipped: ${summary.skipped.length > 0 ? summary.skipped.join(', ') : 'None'} (Already Applied)`);
    console.log('================================\n');
  }

  async handleNoticePeriodModal() {
    try {
       // Look for the notice period/LWD text anywhere in the DOM
       const noticeText = this.page.getByText(/notice period|lwd|last working day/i).first();
       await noticeText.waitFor({ state: 'visible', timeout: 5000 });
       
       console.log('Notice Period Modal detected. Filling text area...');
       
       // Target the nearest visible textarea
       const textarea = this.page.locator('textarea').filter({ state: 'visible' }).first();
       await textarea.waitFor({ state: 'visible', timeout: 2000 });
       await textarea.fill('5');
       
       // Save/Submit button
       const saveBtn = this.page.getByRole('button', { name: /save|submit|apply/i }).filter({ visible: true }).first();
       await saveBtn.click();
       
       console.log('Modal form submitted successfully.');
       await this.safeWait(3000);
    } catch (e) {
       console.log('No Notice Period modal detected, proceeding...');
    }
  }
}

module.exports = NVitePage;
