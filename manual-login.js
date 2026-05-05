const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
    const user = process.argv[2] || 'SUSHANTA'; // Default to your profile
    const authDir = path.join(__dirname, 'playwright/.auth');
    const authFile = path.join(authDir, `${user}.json`);

    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

    console.log(`🚀 Starting manual login for: ${user}`);
    const browser = await chromium.launch({ headless: false }); // Headed mode so you can type
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://www.naukri.com/nlogin/login');

    console.log('--- ACTION REQUIRED ---');
    console.log('Please log in manually in the browser window.');
    console.log('Once you reach the dashboard, the script will save your state and close.');

    // Wait for the dashboard or profile URL to confirm login
    await page.waitForURL('**/mnjuser/homepage**', { timeout: 0 });

    await context.storageState({ path: authFile });
    console.log(`✅ Success! Auth state saved to: ${authFile}`);

    await browser.close();
}

run().catch(err => console.error(err));