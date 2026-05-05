/**
 * Generates a resume headline by randomly selecting from pre-defined static arrays based on the matrix_user.
 * Gemini API calls have been paused to save tokens.
 * @param {string} role - The job role (maintained for backwards compatibility)
 * @param {string} context - Specific achievements or keywords (maintained for backwards compatibility)
 * @returns {Promise<string>} - The randomly selected static headline
 */
async function generateHeadline(role, context = '') {
    const user = process.env.matrix_user || 'SUSHANTA';

    const sushantaHeadlines = [
        "Senior Software Engineer | Backend Expert | Java & Playwright Automation | FNZ Group",
        "SDET Leader | Architecting Scalable Test Frameworks | Java & Backend Specialist",
        "Senior SDET | Java Backend Developer | Playwright Automation Expert | FNZ Group",
        "Backend Software Engineer | Test Automation Architect | Java, Playwright & CI/CD",
        "Senior Software Engineer (SDET) | FNZ Group | Backend Systems & Automation Specialist"
    ];

    const janviHeadlines = [
        "Marketing Analyst | GA4 & ROI Tracking Expert | 15%+ YouTube Growth | Great Learning",
        "Performance Marketing Analyst | Data-Driven Growth Strategist | GA4 & ROI Tracking",
        "Marketing Analyst | YouTube Growth Specialist (15%+) | Great Learning | ROI-Focused",
        "Growth Analyst | Marketing Strategy & Data Analytics | 15% YouTube Growth | Great Learning",
        "Digital Marketing Analyst | GA4 Expert | ROI & Funnel Optimization | Great Learning"
    ];

    let selectedArray;

    if (user.toUpperCase() === 'JANVI') {
        selectedArray = janviHeadlines;
    } else {
        selectedArray = sushantaHeadlines; // Defaults to SDET headlines for SUSHANTA or any missing user
    }

    const randomIndex = Math.floor(Math.random() * selectedArray.length);
    return selectedArray[randomIndex];
}

module.exports = { generateHeadline };
