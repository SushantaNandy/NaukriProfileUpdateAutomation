const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // To keep things simple and sequential
  reporter: [['html'], ['list']],
  use: {
    // General settings
    trace: 'on-first-retry',
    viewport: { width: 1366, height: 768 },
    headless: process.env.HEADLESS === 'false' ? false : true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'en-IN',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    {
      name: 'Naukri',
      testMatch: /.*\.spec\.js/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: `playwright/.auth/${process.env.matrix_user || 'default'}.json`,
      },
    },
  ],
});
