const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGeneration() {
  const topic = { topicName: "JavaScript Closures" };
  const level = { difficulty: "medium", title: "Intermediate" };
  const count = 3;
  const optionsCount = 4;
  const context = "Focus on lexical scoping and memory management.";

  const contextInstruction = context.trim() 
    ? `\n      SPECIFIC USER INSTRUCTIONS:\n      ${context}\n      Please follow these instructions closely while generating the questions.` 
    : "";

  const prompt = `
    You are an expert cognitive skill assessment creator.
    Task: Generate ${count} high-quality multiple-choice questions.
    Topic: "${topic.topicName}"
    Difficulty: ${level.difficulty} (${level.title || "Standard"})
    Instructions: Each question must have exactly ${optionsCount} options. Ensure the options are logical, distinct, and appropriate for the difficulty level.${contextInstruction}
    
    CRITICAL: Return ONLY a valid JSON array. No explanations or extra text.
    JSON Format:
    [
      {
        "questionText": "The question string",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": 0,
        "explanation": "Brief explanation",
        "points": 10
      }
    ]
  `;

  console.log("Using model: gemini-flash-latest");
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    console.log("RAW RESPONSE START >>>");
    console.log(text);
    console.log("<<< RAW RESPONSE END");

    // Removal logic from aiController.js
    let cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.log("FAILED TO MATCH JSON ARRAY");
    } else {
      console.log("MATCHED JSON:", jsonMatch[0]);
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("SUCCESSFULLY PARSED JSON. Count:", parsed.length);
      } catch (e) {
        console.log("JSON PARSE ERROR:", e.message);
      }
    }
  } catch (error) {
    console.error("GENERATION ERROR:", error);
  }
}

testGeneration();
