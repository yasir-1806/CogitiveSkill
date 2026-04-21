require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  try {
    console.log('Loading GEMINI_API_KEY from .env...');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('ERROR: GEMINI_API_KEY not found in .env');
      process.exit(1);
    }
    
    console.log('✓ API Key loaded successfully (first 10 chars):', apiKey.substring(0, 10) + '...');
    
    console.log('\nInitializing GoogleGenerativeAI client...');
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✓ Client initialized successfully.');
    
    console.log('\nTesting with different model names:');
    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-flash-latest', 'gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-pro', 'gemini-pro-vision', 'models/gemini-pro'];
    
    for (const modelName of modelsToTry) {
      try {
        console.log('\nTrying model:', modelName);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        console.log('✓ SUCCESS with model:', modelName);
        console.log('Response:', response.text().substring(0, 100));
        process.exit(0);
      } catch (err) {
        console.log('✗ Failed:', err.message.substring(0, 150));
      }
    }
    
    console.log('\nAll models failed. Using fallback test...');
    
  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    process.exit(1);
  }
}

testGeminiAPI();
