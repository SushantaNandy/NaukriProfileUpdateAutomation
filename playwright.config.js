// @ts-check
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
    viewport: { width: 1920, height: 1080 },
    headless: process.env.HEADLESS === 'false' ? false : true,
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
        storageState: 'data/auth_state.json',
      },
    },
  ],
});
