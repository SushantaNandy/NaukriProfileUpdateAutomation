const { test: base, expect } = require('@playwright/test');
const path = require('path');
const NaukriPage = require('../pages/NaukriPage');
const { createStampedResume, deleteStampedResume } = require('../utils/fileHelper');
const { generateHeadline } = require('../utils/headline-gen');
const { chromium } = require('../utils/stealth');

const test = base.extend({
  page: async ({}, use) => {
    const browser = await chromium.launch({ 
      headless: false, 
      slowMo: 1000,
      args: ['--disable-http2']
    });
    const context = await browser.newContext({
      storageState: `playwright/.auth/SAKSHAM.json`,
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

test.describe('Local Verification: Saksham Profile', () => {
  
  test('should update resume and headline flawlessly', async ({ page }) => {
    // Environment setup for Saksham
    process.env.matrix_user = 'SAKSHAM';
    const role = 'SDET / Automation Tester';
    const proofPoints = 'Selenium, Java, API Testing, Framework Design';
    const resumePath = './data/Saksham_Agrawal_QA_Resume_Clean.docx';
    
    console.log('Generating Headline for Saksham...');
    const aiHeadline = await generateHeadline(role, proofPoints);
    console.log(`Headline selected: ${aiHeadline}`);

    console.log('Creating Stamped Resume Copy...');
    let stampedResumePath = null;
    let uploadSuccessful = false;
    
    try {
        stampedResumePath = createStampedResume(resumePath);
        console.log(`Stamped resume created: ${path.basename(stampedResumePath)}`);
        
        const naukriPage = new NaukriPage(page);
        
        console.log('Navigating to profile page...');
        await naukriPage.gotoProfile();
        
        console.log(`Updating resume headline to: ${aiHeadline}`);
        await naukriPage.updateHeadline(aiHeadline);

        console.log('Uploading new resume...');
        await naukriPage.updateResume(stampedResumePath);
        
        console.log('Verifying update...');
        const lastUpdated = await naukriPage.verifyUpdate();
        console.log(`Success! Profile timestamp: ${lastUpdated}`);
        
        expect(lastUpdated).toBeTruthy();
        uploadSuccessful = true;
    } finally {
        if (stampedResumePath && uploadSuccessful) {
            deleteStampedResume(stampedResumePath);
        } else if (stampedResumePath) {
            console.log(`Skipping cleanup of ${path.basename(stampedResumePath)} due to failure.`);
        }
    }
  });
});
