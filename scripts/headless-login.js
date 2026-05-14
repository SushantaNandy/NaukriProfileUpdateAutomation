const fs = require('fs');
const path = require('path');
const { chromium } = require('../utils/stealth');
const NaukriPage = require('../pages/NaukriPage');

async function run() {
  const email = process.env.NAUKRI_EMAIL;
  const password = process.env.NAUKRI_PASSWORD;
  const userId = process.env.USER_ID || 'default';

  if (!email || !password) {
    console.error('Missing NAUKRI_EMAIL or NAUKRI_PASSWORD environment variables.');
    process.exit(1);
  }

  console.log(`Starting headless login for ${email}...`);
  const browser = await chromium.launch({ headless: true, args: ['--disable-http2', '--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const naukriPage = new NaukriPage(page);
  
  try {
    await naukriPage.loginWithCredentials(email, password);
    await naukriPage.verifyDashboardLoaded();
    
    // Capture session using native Playwright storageState format
    const sessionData = await context.storageState();
    
    // Output session data as JSON string to stdout (last line)
    console.log('---SESSION_START---');
    console.log(JSON.stringify(sessionData));
    console.log('---SESSION_END---');
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(`Login failed: ${error.message}`);
    await browser.close();
    process.exit(1);
  }
}

run();
