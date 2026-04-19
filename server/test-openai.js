#!/usr/bin/env node
require("dotenv").config();
const OpenAI = require("openai");

console.log("?? OpenAI Configuration Test\n");
console.log("Environment Check:");
console.log("- OPENAI_API_KEY set:", !!process.env.OPENAI_API_KEY);
console.log("- OPENAI_API_KEY value:", process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : "NOT SET");
console.log("- Is placeholder:", process.env.OPENAI_API_KEY?.includes("YOUR_OPENAI"));

const apiKey = process.env.OPENAI_API_KEY?.trim();
const isPlaceholder = !apiKey || apiKey.includes("YOUR_OPENAI") || apiKey === "sk-";

if (isPlaceholder) {
  console.log("\n? PROBLEM: API key is not configured or is a placeholder");   
  console.log("\n?? To fix:");
  console.log("1. Go to https://platform.openai.com/api-keys");
  console.log("2. Create a new secret key");
  console.log("3. Update server/.env with: OPENAI_API_KEY=sk-your-actual-key-here");
  console.log("4. Restart the server");
  process.exit(1);
}

console.log("\n? API key format looks valid. Testing connection...\n");       

const openai = new OpenAI({ apiKey });

(async () => {
  try {
    console.log("Sending test request to OpenAI API...");
    const message = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a test assistant. Respond with exactly: TEST_SUCCESS"
        },
        {
          role: "user",
          content: "Test"
        }
      ],
      max_tokens: 10,
      temperature: 0
    });

    const response = message.choices[0]?.message?.content?.trim();
    console.log("? OpenAI connection successful!");
    console.log("Response:", response);
    console.log("\n? AI generation should now work properly and follow prompts.");
    process.exit(0);
  } catch (error) {
    console.log("? OpenAI API Error:", error.message);

    if (error.message.includes("401") || error.message.includes("invalid")) {   
      console.log("\n??  Invalid API key - check if key is correct and active");
    } else if (error.message.includes("429")) {
      console.log("\n??  Rate limit exceeded - try again in a moment");      
    } else if (error.message.includes("model")) {
      console.log("\n??  Model not found or not available");
    }
    
    process.exit(1);
  }
})();
