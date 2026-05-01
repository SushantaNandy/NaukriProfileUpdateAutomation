const { test: setup, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { chromium } = require('../utils/stealth'); // Stealth plugin
const NaukriPage = require('../pages/NaukriPage'); // Added for automated login

const user = process.env.matrix_user || 'default';
const authFile = path.join(__dirname, `../playwright/.auth/${user}.json`);

setup('authenticate', async () => {
  // Ensure the .auth directory exists
  if (!fs.existsSync(path.dirname(authFile))) {
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
  }

  setup.setTimeout(0); // Disable timeout for manual login
  
  // Check if auth_state.json exists and its age
  let needsLogin = true;
  if (fs.existsSync(authFile)) {
    const stats = fs.statSync(authFile);
    const now = new Date().getTime();
    const ageInDays = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageInDays < 7) {
      console.log(`Valid auth state found for ${user}. Skipping login.`);
      needsLogin = false;
    } else {
      console.log(`Auth state for ${user} is older than 7 days. Re-authenticating.`);
    }
  } else {
    console.log(`No auth state found for ${user}. Initializing login.`);
  }

  if (needsLogin) {
    const isCI = !!process.env.CI;
    const headless = isCI ? true : false;
    
    console.log(`Opening browser for login (Headless: ${headless})...`);
    const browser = await chromium.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const naukriPage = new NaukriPage(page);
    const email = process.env.NAUKRI_EMAIL;
    const password = process.env.NAUKRI_PASSWORD;

    if (email && password) {
      console.log(`Automated login sequence initiated for ${email}...`);
      await naukriPage.loginWithCredentials(email, password);
      console.log('Waiting for successful login (navigating to dashboard/profile)...');
      await naukriPage.verifyDashboardLoaded();
      console.log('Login successful! Saving state...');
    } else {
      console.log('No credentials provided. Falling back to manual login. Please log in via Gmail...');
      await page.goto('https://www.naukri.com/nlogin/login');
      console.log('Waiting for successful login (navigating to dashboard/profile)...');
      await page.waitForURL('**/mnjuser/**', { timeout: 0 }); 
      console.log('Login successful! Saving state...');
    }
    
    // Save storage state into the file
    await context.storageState({ path: authFile });
    await browser.close();
  }
});
