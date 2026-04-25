const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Image Orchestrator Skill
 * Handles sending prompts to the Google Gemini API for image generation.
 */
class ImageOrchestrator {
    constructor() {
        this.outputDir = path.join(__dirname, '../../data');
        this.outputPath = path.join(this.outputDir, 'temp_post_image.jpg');
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    /**
     * Orchestrates the full flow: Generate -> Save to disk.
     * @param {string} prompt - The image generation prompt.
     * @returns {Promise<string>} The local path to the generated image.
     */
    async generateAndDownload(prompt) {
        try {
            console.log('Orchestrating image generation with Gemini...');
            console.log(`Prompt: "${prompt}"`);
            
            if (!this.genAI) {
                throw new Error('GEMINI_API_KEY not found in environment.');
            }

            const model = this.genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image-preview' });
            let base64Data = null;

            // Many recent SDK versions use generateImages or generateImage
            if (typeof model.generateImages === 'function' || typeof model.generateImage === 'function') {
                const method = typeof model.generateImages === 'function' ? model.generateImages : model.generateImage;
                console.log('Using dedicated image generation method...');
                const imgResult = await method.call(model, {
                    prompt: prompt,
                    aspectRatio: '16:9'
                });
                
                if (imgResult.images && imgResult.images.length > 0) {
                    base64Data = imgResult.images[0].base64 || imgResult.images[0].image;
                } else if (imgResult.image) {
                    base64Data = imgResult.image.base64 || imgResult.image;
                } else {
                    base64Data = imgResult; // Fallback structure
                }
            } else {
                // Fallback to standard generateContent if specialized method isn't in this SDK version
                console.log('Using standard generateContent method...');
                const result = await model.generateContent({
                    contents: [{
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { text: "CRITICAL: Ensure aspect ratio is exactly 16:9 (1280x720)." }
                        ]
                    }]
                });
                
                const response = result.response;
                if (!response.candidates || response.candidates.length === 0) {
                     throw new Error('Gemini API returned no candidates.');
                }
                
                const part = response.candidates[0].content.parts.find(p => p.inlineData);
                if (part && part.inlineData) {
                    base64Data = part.inlineData.data;
                } else {
                    throw new Error("No inlineData found in the Gemini response. Check model compatibility.");
                }
            }
            
            if (!base64Data) {
                 throw new Error("Failed to extract image buffer/base64 from Gemini response.");
            }

            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }

            console.log('Saving image buffer directly to disk...');
            
            // Clean up base64 prefix if present (e.g. data:image/jpeg;base64,...)
            if (typeof base64Data === 'string' && base64Data.startsWith('data:image')) {
                base64Data = base64Data.split(',')[1];
            }
            
            fs.writeFileSync(this.outputPath, Buffer.from(base64Data, 'base64'));
            
            console.log(`Image successfully saved to ${this.outputPath}`);
            return this.outputPath;

        } catch (error) {
            console.error('Image generation orchestration failed:', error.message);
            throw error;
        }
    }
}

module.exports = ImageOrchestrator;
