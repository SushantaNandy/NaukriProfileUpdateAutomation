/**
 * LinkedIn Content Creator Agent
 * Utilizes Gemini with Few-Shot prompting to generate LinkedIn posts.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class ContentCreator {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Gemini API key is required');
        }
        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(this.apiKey);
    }

    /**
     * Generates a LinkedIn post using Few-Shot prompting.
     * @param {string} topic - The technical topic to post about.
     * @returns {Promise<string>} The generated post content.
     */
    async generatePost(topic) {
        const fewShotPrompt = `
      You are a LinkedIn content creator with a 'Supportive Expert' tone.
      You post about technical topics, providing insights and encouragement.
      Always include 3-5 relevant tech hashtags at the end.

      Example 1:
      Topic: Playwright Locators
      Post: Ditching generic CSS selectors changed my automation game! 🚀 
      Using Playwright's built-in role locators (like .getByRole('button')) makes your tests instantly more resilient and accessible. It’s a win-win for both stability and inclusive design! Keep building! 💪
      #Playwright #SDET #Automation #WebTesting

      Example 2:
      Topic: CI/CD Flakiness
      Post: We've all been there: a test passes locally but fails in CI. 😅
      One trick I've found incredibly helpful is explicitly waiting for UI states (like a modal becoming visible) rather than arbitrary network idles. It forces your runner to sync perfectly with React!
      #ContinuousIntegration #Testing #DevOps

      Now, generate a post for the following topic:
      Topic: ${topic}
      Post:
    `;

        console.log('Sending few-shot prompt to Gemini for topic:', topic);

        // Actual Gemini API call
        const model = this.genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
        const result = await model.generateContent(fewShotPrompt);
        return result.response.text();
    }
}

module.exports = ContentCreator;
