const { test: setup, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { chromium } = require('../utils/stealth'); // Stealth plugin

const authFile = path.join(__dirname, '../data/auth_state.json');

setup('authenticate', async () => {
  setup.setTimeout(0); // Disable timeout for manual login
  // Check if auth_state.json exists and its age
  let needsLogin = true;
  if (fs.existsSync(authFile)) {
    const stats = fs.statSync(authFile);
    const now = new Date().getTime();
    const ageInDays = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageInDays < 7) {
      console.log('Valid auth state found. Skipping manual login.');
      needsLogin = false;
    } else {
      console.log('Auth state is older than 7 days. Re-authenticating.');
    }
  } else {
    console.log('No auth state found. Initializing manual login.');
  }

  if (needsLogin) {
    console.log('Opening browser for manual login. Please log in via Gmail...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('https://www.naukri.com/nlogin/login');
    
    // We pause here to give the user time to manually click "Login with Google"
    // and complete the flow. The user must click "Resume" in the Playwright inspector
    // or wait for the dashboard URL.
    
    // Instead of forcing the user to use the inspector, we can wait for the profile/dashboard URL.
    console.log('Waiting for successful login (navigating to dashboard/profile)...');
    
    // Wait until the URL changes to the logged-in user dashboard or profile
    await page.waitForURL('**/mnjuser/**', { timeout: 0 }); 
    console.log('Login successful! Saving state...');
    
    // Save storage state into the file
    await context.storageState({ path: authFile });
    await browser.close();
  }
});
