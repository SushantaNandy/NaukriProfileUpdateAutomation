const { test, expect } = require('@playwright/test');
const path = require('path');
const NaukriPage = require('../pages/NaukriPage');
const { getFreshResumePath } = require('../utils/fileHelper');

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
