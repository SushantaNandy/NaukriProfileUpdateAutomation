const { test: base, expect } = require('@playwright/test');
const path = require('path');
const NaukriPage = require('../pages/NaukriPage');
const { createStampedResume, deleteStampedResume } = require('../utils/fileHelper');
const { generateHeadline } = require('../utils/headline-gen');
const { chromium } = require('../utils/stealth');

// Override the default page fixture to use playwright-extra stealth
const test = base.extend({
  page: async ({}, use) => {
    const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
    const context = await browser.newContext({
      storageState: `playwright/.auth/${process.env.matrix_user || 'default'}.json`,
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
    // Determine User Role
    const role = process.env.USER_ROLE || 'Software Professional';
    const proofPoints = process.env.USER_PROOF_POINTS || '';
    
    console.log('Generating AI Headline...');
    const aiHeadline = await generateHeadline(role, proofPoints);
    console.log(`AI Headline generated: ${aiHeadline}`);

    // Create Stamped Resume
    const resumePath = process.env.NAUKRI_RESUME_PATH;
    if (!resumePath) {
        throw new Error('NAUKRI_RESUME_PATH is not defined');
    }
    
    console.log('Creating Stamped Resume Copy...');
    let stampedResumePath = null;
    let uploadSuccessful = false;
    
    try {
        stampedResumePath = createStampedResume(resumePath);
        console.log(`Stamped resume created: ${path.basename(stampedResumePath)}`);
        
        const naukriPage = new NaukriPage(page);
        
        // 1. Navigate directly to Profile Page
        console.log('Navigating to profile page...');
        await naukriPage.gotoProfile();
        
        // 2. Headline Update
        console.log(`Updating resume headline to: ${aiHeadline}`);
        await naukriPage.updateHeadline(aiHeadline);

        // 3. Resume Update
        console.log('Uploading new resume...');
        await naukriPage.updateResume(stampedResumePath);
        
        // 4. Verify Update
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
