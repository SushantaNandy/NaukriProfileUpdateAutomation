const { randomDelay } = require('../../utils/helpers');

/**
 * LinkedIn Playwright Skills
 * Relies on the global stealth browser context defined in the framework.
 */
class LinkedInPostActions {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    this.feedUrl = 'https://www.linkedin.com/feed/';
    
    // Locators
    this.startPostBtn = page.getByRole('button', { name: 'Start a post' }).or(page.locator('.share-box-feed-entry__trigger'));
    this.postModal = page.locator('.share-creation-state__modal').or(page.locator('.share-box-modal'));
    this.editorDiv = page.locator('.ql-editor');
    this.postSubmitBtn = page.getByRole('button', { name: 'Post' });
  }

  /**
   * Navigates to LinkedIn feed and opens the "Start a post" modal.
   */
  async openPostModal() {
    console.log('Navigating to LinkedIn Feed...');
    // Stealth delay before hitting a new domain
    await this.page.waitForTimeout(Math.floor(Math.random() * 5000) + 5000);
    
    // Navigate with domcontentloaded to avoid hanging on persistent connections
    await this.page.goto(this.feedUrl, { waitUntil: 'domcontentloaded' });
    
    // Wait for the feed to stabilize
    await this.page.waitForTimeout(3000);
    
    // Look for the "Start a post" button
    console.log('Clicking "Start a post"...');
    await this.startPostBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.startPostBtn.click({ force: true });
    
    // Wait for the modal to fully appear
    console.log('Waiting for modal to initialize...');
    await this.postModal.waitFor({ state: 'visible', timeout: 10000 });
    await this.editorDiv.waitFor({ state: 'visible', timeout: 5000 });
    
    // Let the React state settle
    await this.page.waitForTimeout(2000);
  }

  /**
   * Enters text and submits the post.
   * @param {string} content 
   */
  async createPost(content) {
    console.log('Typing post content...');
    await this.editorDiv.focus();
    
    // Fill the Quill editor
    await this.editorDiv.fill(content);
    
    await this.page.waitForTimeout(1000);
    await randomDelay();
    
    console.log('Ready to submit post...');
    await this.postSubmitBtn.waitFor({ state: 'visible' });
    
    // Uncomment when ready to execute in production
    // await this.postSubmitBtn.click({ force: true });
    
    // Wait for success toast (if enabled)
    // await this.page.locator('.artdeco-toast-item').waitFor({ state: 'visible', timeout: 10000 });
  }
}

module.exports = LinkedInPostActions;
