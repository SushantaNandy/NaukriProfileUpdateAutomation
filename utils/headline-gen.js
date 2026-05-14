/**
 * Generates a resume headline by randomly selecting from pre-defined static arrays based on the matrix_user.
 * Gemini API calls have been paused to save tokens.
 * @param {string} role - The job role (maintained for backwards compatibility)
 * @param {string} context - Specific achievements or keywords (maintained for backwards compatibility)
 * @returns {Promise<string>} - The randomly selected static headline
 */
async function generateHeadline(role, context = '') {
    const user = process.env.matrix_user;
    const userRole = process.env.USER_ROLE || role || 'Software Professional';
    const proofPoints = process.env.USER_PROOF_POINTS || context || '';

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

    const sakshamHeadlines = [
        "SDET | Automation Engineer | Selenium, Java & API Testing | Quality Assurance Specialist",
        "Senior Automation Tester | SDET | Expert in Selenium & Java Frameworks | QA Lead",
        "SDET | Quality Assurance Engineer | Specialized in Automation & Framework Design",
        "Automation Testing Expert | SDET | Selenium WebDriver & Java Backend Testing",
        "Senior SDET | Performance & Automation Testing Specialist | Selenium & Java Expert"
    ];

    // If legacy static user is provided, use static arrays
    if (user && user.toUpperCase() === 'SUSHANTA') {
        return sushantaHeadlines[Math.floor(Math.random() * sushantaHeadlines.length)];
    } else if (user && user.toUpperCase() === 'JANVI') {
        return janviHeadlines[Math.floor(Math.random() * janviHeadlines.length)];
    } else if (user && user.toUpperCase() === 'SAKSHAM') {
        return sakshamHeadlines[Math.floor(Math.random() * sakshamHeadlines.length)];
    }

    // SaaS Mode: Dynamic basic generation based on user inputs
    const adjectives = ['Senior', 'Expert', 'Specialist', 'Lead', 'Professional'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    
    // Split proof points into keywords if available
    const keywords = proofPoints.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const keywordStr = keywords.length > 0 ? ` | ${keywords.slice(0, 3).join(' & ')}` : '';

    const dynamicHeadline = `${randomAdjective} ${userRole}${keywordStr} | Driven by Results`;
    
    return dynamicHeadline;
}

module.exports = { generateHeadline };
