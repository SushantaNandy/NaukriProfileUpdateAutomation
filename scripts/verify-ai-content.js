require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const ContentCreator = require('../agents/linkedin/content-creator');

async function run() {
  try {
    console.log('--- Initializing ContentCreator Agent ---');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Error: GEMINI_API_KEY is not set in the environment or .env file.');
      process.exit(1);
    }
    
    const agent = new ContentCreator(apiKey);
    const topic = 'Why Agentic AI is replacing traditional Page Object Models in 2026';
    
    console.log(`\nTopic: ${topic}`);
    console.log('Generating content...\n');
    
    const post = await agent.generatePost(topic);
    
    console.log('\n--- Generated LinkedIn Post ---\n');
    console.log(post);
    console.log('\n-------------------------------\n');
    
    // Simple verification check
    const hashtags = post.match(/#[\w]+/g) || [];
    console.log(`Found ${hashtags.length} hashtags: ${hashtags.join(', ')}`);
    
    if (hashtags.length >= 3 && hashtags.length <= 5) {
      console.log('✅ Hashtag count is within the 3-5 guideline limit.');
    } else {
      console.log('⚠️ Hashtag count is outside the 3-5 guideline limit.');
    }
    
  } catch (error) {
    console.error('Failed to verify AI content:', error.message);
  }
}

run();
