const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test() {
  try {
    console.log('Testing Gemini API key...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = 'Generate 1 simple question about memory techniques. Return only JSON: [{"questionText":"Question","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Exp","points":10}]';

    console.log('Sending prompt...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Response received');
    console.log('Raw text length:', text.length);
    console.log('Raw text start:', text.substring(0, 200));

    // Test parsing
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    console.log('JSON match found:', !!match);

    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        console.log('Parsed successfully:', parsed.length, 'questions');
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    }

  } catch (e) {
    console.log('Error:', e.message);
  }
}
test();