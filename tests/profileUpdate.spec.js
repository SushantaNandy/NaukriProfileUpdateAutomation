const { test: base, expect } = require('@playwright/test');
const path = require('path');
const NaukriPage = require('../pages/NaukriPage');
const { getFreshResumePath } = require('../utils/fileHelper');
const { chromium } = require('../utils/stealth');

// Override the default page fixture to use playwright-extra stealth
const test = base.extend({
  page: async ({}, use) => {
    const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
    const context = await browser.newContext({
      storageState: 'data/auth_state.json',
      viewport: { width: 1366, height: 768 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'en-IN'
    });
    const page = await context.newPage();
    await use(page);
    await browser.close();
  }
});

test.describe('Naukri Profile Update Automation', () => {
  
  test('should update resume and headline', async ({ page }) => {
    const naukriPage = new NaukriPage(page);
    
    // 1. Navigate directly to Profile Page
    console.log('Navigating to profile page...');
    await naukriPage.gotoProfile();
    
    // 2. Resume Update
    console.log('Preparing fresh resume...');
    const dataDirPath = path.join(__dirname, '../data');
    const freshResumePath = getFreshResumePath(dataDirPath);
    console.log(`Using fresh resume: ${path.basename(freshResumePath)}`);
    
    console.log('Uploading new resume...');
    await naukriPage.updateResume(freshResumePath);
    
    // 3. Headline Update
    console.log('Updating resume headline...');
    await naukriPage.updateHeadline();
    
    // 4. Verify Update
    console.log('Verifying update...');
    const lastUpdated = await naukriPage.verifyUpdate();
    console.log(`Success! Profile timestamp: ${lastUpdated}`);
    
    expect(lastUpdated).toBeTruthy();
  });
  
});
