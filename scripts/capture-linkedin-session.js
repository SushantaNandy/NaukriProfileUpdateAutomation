const { chromium } = require('../utils/stealth');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function waitForInput(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function captureSession() {
  console.log('--- LinkedIn Session Capturer ---');
  console.log('Launching browser in Headed mode with Stealth enabled...');
  
  // 1. Headed Mode & Stealth Integration
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'en-IN'
  });
  
  const page = await context.newPage();
  
  // 2. Interactive Login
  console.log('Navigating to LinkedIn login...');
  await page.goto('https://www.linkedin.com/login');
  
  console.log('\n--- ACTION REQUIRED ---');
  console.log('1. Please log into your LinkedIn account in the opened browser window.');
  console.log('2. Complete any CAPTCHA or 2FA security challenges if prompted.');
  console.log('3. Wait until you are fully loaded onto the main LinkedIn Feed page.');
  
  // 3. Wait for User Signal
  await waitForInput('\nPress [ENTER] in this terminal when you are fully logged in and on the feed page...');
  
  // Ensure the data directory exists
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 4. State Export
  console.log('\nSaving session state...');
  const statePath = path.join(dataDir, 'auth_state_linkedin.json');
  await context.storageState({ path: statePath });
  
  console.log(`Session successfully saved to ${statePath} ✅`);
  console.log('This will serve as the persistent Anchor for the LinkedIn Career Agent.');
  
  // 5. Clean Exit
  await browser.close();
  rl.close();
}

captureSession().catch(err => {
  console.error('\nError capturing session:', err);
  process.exit(1);
});
