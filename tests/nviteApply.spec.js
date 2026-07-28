const { test: base, expect } = require('@playwright/test');
const NVitePage = require('../pages/NVitePage');
const { chromium } = require('../utils/stealth');

// Test configuration
const isCI = process.env.CI === 'true';
const headless = isCI ? true : process.env.HEADLESS !== 'false';

// Setup custom fixture with stealth plugin and isolated storage state
const test = base.extend({
  page: async ({}, use) => {
    const browser = await chromium.launch({ 
      headless, 
      args: ['--disable-http2', '--disable-blink-features=AutomationControlled'] 
    });
    
    // Default to SUSHANTA if not set (for local dev)
    const user = process.env.matrix_user || 'SUSHANTA';
    
    const context = await browser.newContext({
      storageState: `playwright/.auth/${user}.json`,
      viewport: { width: 1366, height: 768 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'en-IN'
    });
    
    const page = await context.newPage();
    await use(page);
    await page.close();
    await context.close();
    await browser.close();
  }
});

test.describe('Naukri NVite Auto-Apply Automation', () => {
  
  test('should process and apply to HR invites seamlessly', async ({ page }) => {
    const nvitePage = new NVitePage(page);
    
    console.log(`Starting NVite run for user: ${process.env.matrix_user || 'SUSHANTA (Default)'}`);
    
    // 1. Navigate to Inbox
    console.log('Navigating to Inbox...');
    await nvitePage.gotoInbox();
    
    // 2. Load all content
    await nvitePage.scrollToBottom();
    
    // 3. Process Invites with Demo Cap
    // Limit is explicitly set to 2 as per requirement
    await nvitePage.processInvites(2);
    
    console.log('NVite Auto-Apply flow completed successfully.');
  });
  
});
