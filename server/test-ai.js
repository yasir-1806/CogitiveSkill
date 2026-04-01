require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    console.log("Testing Gemini API with key:", process.env.GEMINI_API_KEY.substring(0, 8) + "...");
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent("Hello, are you working? Reply with one word: Yes.");
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (error) {
    console.error("API Test Failed:", error.message);
  }
}

test();
