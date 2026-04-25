require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const ImageOrchestrator = require('../skills/media/image-orchestrator');

async function run() {
  console.log('--- Initializing Image Orchestrator in Cost-Saver Mode ---');
  
  if (!process.env.TOGETHER_API_KEY) {
      console.warn('Warning: TOGETHER_API_KEY is not set. The orchestrator will use a fallback image.');
  }

  const orchestrator = new ImageOrchestrator();
  
  const mockPrompt = 'A minimalist 3D isometric workspace with a glowing holographic display showing the text "Agentic AI 2026", neon blue accents, high-end digital art style, 16:9 aspect ratio.';
  
  console.log(`\nMock Prompt: ${mockPrompt}`);
  
  const startTime = Date.now();
  
  try {
      const savedPath = await orchestrator.generateAndDownload(mockPrompt);
      const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`\n✅ Verification Complete!`);
      console.log(`⏱️  Generation Time: ${generationTime} seconds`);
      console.log(`📁 File saved to: ${savedPath}`);
  } catch (error) {
      console.error('❌ Image verification failed:', error);
  }
}

run();
