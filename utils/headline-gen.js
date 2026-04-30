const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generates an AI-powered resume headline based on role and specific context/proof points.
 * @param {string} role - The job role (e.g., 'Marketing Analyst')
 * @param {string} context - Specific achievements or keywords (e.g., '15%+ YouTube Growth, GA4')
 * @returns {Promise<string>} - The generated headline
 */
async function generateHeadline(role, context = '') {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not defined in environment variables.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const promptContext = context ? ` Use these specific proof points and context: ${context}.` : '';
        const prompt = `Output only one line. Max 100 characters. No markdown. Generate a highly impactful and professional resume headline for a ${role}.${promptContext}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Failed to generate AI headline:', error.message);
        // Fallback headline
        return `${role} | Professional seeking new opportunities`;
    }
}

module.exports = { generateHeadline };
