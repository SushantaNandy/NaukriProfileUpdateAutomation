const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Image Designer Agent
 * Takes a LinkedIn post and generates a highly descriptive, 1-sentence prompt
 * for an image generation model (like Flux or Imagen).
 */
class ImageDesigner {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Gemini API key is required');
        }
        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(this.apiKey);
    }

    /**
     * Generates a concise image prompt based on post content.
     * @param {string} postContent - The generated LinkedIn post.
     * @returns {Promise<string>} The 1-sentence image prompt.
     */
    async generateImagePrompt(postContent) {
        const prompt = `
      You are an expert AI image prompt designer. 
      Read the following LinkedIn post and write a single, highly descriptive sentence to generate an accompanying image.
      
      RULES:
      1. Must be exactly ONE sentence.
      2. Emphasize a 'Professional tech aesthetic'.
      3. Instruct the model to render the post's main title prominently in the image.
      4. Specify '16:9 aspect ratio'.

      Post Content:
      "${postContent}"

      Image Prompt:
    `;

        console.log('Sending post content to Gemini to design an image prompt...');
        
        // Using the same flash model to save tokens and ensure speed
        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    }
}

module.exports = ImageDesigner;
