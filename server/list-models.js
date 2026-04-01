require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    // Note: older versions of the SDK might not have listModels or handle it differently
    // Usually it's accessed via the manager or just not available in very early versions
    // Let's try to just fetch typical models or use the newer syntax
    console.log("Fetching models...");
    // In newer SDKs it's: const models = await genAI.getGenerativeModel({ model: "gemini-pro" }).listModels(); 
    // Wait, the standard way is to use the REST API or the SDK helper
    // If the SDK is old, maybe it's just 'gemini-pro' but the API version is different?
    
    // Let's try 'gemini-1.0-pro' which is a common fallback
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    const result = await model.generateContent("Hi");
    console.log("gemini-1.0-pro worked!");
  } catch (error) {
    console.error("gemini-1.0-pro failed:", error.message);
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Hi");
      console.log("gemini-1.5-flash worked!");
    } catch (e) {
      console.error("gemini-1.5-flash failed:", e.message);
    }
  }
}

listModels();
