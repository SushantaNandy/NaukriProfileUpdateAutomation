const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

// Add stealth plugin and use defaults (all evasion techniques)
chromium.use(stealth);

module.exports = { chromium };
