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

        const styles = [
            "Style A (The Achiever): Lead with the most impactful quantifiable achievement from the proof points.",
            "Style B (The Specialist): Lead with core technical or domain expertise from the proof points.",
            "Style C (The Strategist): Lead with broad impact and overarching value from the proof points."
        ];
        const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

        // Ensure we use the environment variable if context isn't passed directly
        const finalContext = context || process.env.USER_PROOF_POINTS || '';
        
        const prompt = `Act as an Expert Recruiter. Create a punchy, high-impact headline for a ${role}.

Context / Proof Points: ${finalContext}

Constraints:
- Limit: Exactly 160-170 characters.
- Vocabulary: Use at least 2 "Power Words" (e.g., Spearheading, Architecting, Exponential, Data-Driven Storytelling, Conversion-Focused, Funnel Optimization).
- Randomized Structure: You MUST strictly format the headline using this style: ${selectedStyle}
- Output Format: Single line. No markdown. No hashtags. Use "|" or "•" as separators.`;

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
