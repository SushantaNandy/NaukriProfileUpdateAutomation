const fs = require('fs');
const path = require('path');
const { chromium } = require('../utils/stealth');
const NaukriPage = require('../pages/NaukriPage');
const { generateHeadline } = require('../utils/headline-gen');
const { createStampedResume, deleteStampedResume } = require('../utils/fileHelper');

async function run() {
  const sessionPath = process.env.SESSION_FILE_PATH;
  const resumePath = process.env.RESUME_FILE_PATH;
  const role = process.env.USER_ROLE || 'Software Engineer';
  const proofPoints = process.env.USER_PROOF_POINTS || '';

  if (!sessionPath || !fs.existsSync(sessionPath)) {
    console.error('Missing or invalid SESSION_FILE_PATH');
    process.exit(1);
  }

  if (!resumePath || !fs.existsSync(resumePath)) {
    console.error('Missing or invalid RESUME_FILE_PATH');
    process.exit(1);
  }

  console.log(`Starting headless boost...`);
  let stampedResumePath = null;
  let browser = null;
  
  try {
    const aiHeadline = await generateHeadline(role, proofPoints);
    console.log(`Headline generated: ${aiHeadline}`);

    stampedResumePath = createStampedResume(resumePath);
    console.log(`Stamped resume created: ${path.basename(stampedResumePath)}`);

    browser = await chromium.launch({ headless: true, args: ['--disable-http2', '--disable-blink-features=AutomationControlled'] });
    const context = await browser.newContext({ storageState: sessionPath });
    const page = await context.newPage();
    
    const naukriPage = new NaukriPage(page);

    // Ensure we are logged in by going to the profile directly
    console.log('Navigating to profile...');
    await naukriPage.gotoProfile();

    console.log('Updating resume...');
    await naukriPage.updateResume(stampedResumePath);
    
    console.log('Updating headline...');
    await naukriPage.updateHeadline(aiHeadline);
    
    console.log('Verifying update...');
    await naukriPage.verifyUpdate();
    
    // Output success data
    console.log('---BOOST_SUCCESS---');
    console.log(JSON.stringify({ headline: aiHeadline }));
    console.log('---BOOST_END---');

    await browser.close();
    if (stampedResumePath) deleteStampedResume(stampedResumePath);
    process.exit(0);
  } catch (error) {
    console.error(`Boost failed: ${error.message}`);
    if (browser) await browser.close();
    if (stampedResumePath) deleteStampedResume(stampedResumePath);
    process.exit(1);
  }
}

run();
