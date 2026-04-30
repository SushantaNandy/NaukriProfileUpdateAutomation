require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { chromium } = require('../utils/stealth');
const NaukriPage = require('../pages/NaukriPage');
const path = require('path');
const fs = require('fs');
const { generateHeadline } = require('../utils/headline-gen');
const { createStampedResume, deleteStampedResume } = require('../utils/fileHelper');

async function runTest() {
    // 1. Environment Mocking
    process.env.NAUKRI_EMAIL = 'raijanv547@gmail.com';
    process.env.NAUKRI_PASSWORD = 'Happy2@auli';
    
    const resumePath = path.resolve(__dirname, '../data/Janvi_Rai_Marketing_Analyst_Resume.docx');
    process.env.NAUKRI_RESUME_PATH = resumePath;

    // Create a dummy docx file if it doesn't exist so the file picker doesn't crash during the test
    if (!fs.existsSync(resumePath)) {
        console.log('Test file not found. Creating a dummy .docx file for verification...');
        fs.mkdirSync(path.dirname(resumePath), { recursive: true });
        fs.writeFileSync(resumePath, 'Dummy Word Document for Automation Test');
    }

    // 2. Identity Verification
    const role = 'Marketing Analyst';
    const proofPoints = '15%+ YouTube Growth, GA4, ROI Tracking, Great Learning';
    
    console.log('\n--- Identity Verification ---');
    console.log(`Detected User Role: ${role}`);
    console.log(`Target Resume: ${path.basename(resumePath)}`);
    console.log('Initializing multi-tenant credentials flow...\n');

    // 3. Final Workflow Preparation
    console.log('Generating AI Headline...');
    const aiHeadline = await generateHeadline(role, proofPoints);
    console.log(`AI Headline generated: ${aiHeadline}`);
    
    console.log('Creating Stamped Resume Copy...');
    let stampedResumePath = null;
    let uploadSuccessful = false;
    try {
        stampedResumePath = createStampedResume(resumePath);
        console.log(`Stamped resume created: ${path.basename(stampedResumePath)}`);
        
        // 4. Headed Mode Setup
        console.log('Launching browser in Headed mode for visual confirmation...');
        const browser = await chromium.launch({ headless: false });
        const context = await browser.newContext({
            viewport: { width: 1366, height: 768 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            locale: 'en-IN'
        });
        
        const page = await context.newPage();

        try {
            const naukriPage = new NaukriPage(page);

            // 5. Credential Flow Test
            console.log('\nInitiating login sequence...');
            await naukriPage.loginWithCredentials(process.env.NAUKRI_EMAIL, process.env.NAUKRI_PASSWORD);
            
            console.log('Waiting for authentication to complete and dashboard to load...');
            await naukriPage.verifyDashboardLoaded();

            console.log('\nNavigating to profile page to execute updates...');
            await page.goto(naukriPage.profileUrl);
            await page.waitForLoadState('domcontentloaded');

            console.log(`Executing updateHeadline with: ${aiHeadline}`);
            await naukriPage.updateHeadline(aiHeadline);

            console.log(`Executing updateResume with path: ${stampedResumePath}`);
            await naukriPage.updateResume(stampedResumePath);

            console.log('\nVerifying update completion...');
            await naukriPage.verifyUpdate();
            uploadSuccessful = true;

            console.log('\n✅ Janvi Flow Verification Complete. The Word document and AI headline were successfully updated.');
            
            console.log('Keeping browser open for 10 seconds for final visual confirmation...');
            await page.waitForTimeout(10000);

        } catch (error) {
            console.error('\n❌ Flow Verification Failed:', error);
        } finally {
            await browser.close();
        }
    } finally {
        if (stampedResumePath && uploadSuccessful) {
            deleteStampedResume(stampedResumePath);
        } else if (stampedResumePath) {
            console.log(`Skipping cleanup of ${path.basename(stampedResumePath)} due to upload failure (for debugging).`);
        }
    }
}

runTest();
