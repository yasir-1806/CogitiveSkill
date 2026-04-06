const { GoogleGenerativeAI } = require("@google/generative-ai");
const Question = require("../models/Question");
const Topic = require("../models/Topic");
const Level = require("../models/Level");
const TestResult = require("../models/TestResult");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * @desc    Generate questions using AI
 * @route   POST /api/ai/generate-questions
 * @access  Private/Admin
 */
exports.generateQuestions = async (req, res) => {
  try {
    const { topicId, levelId, count = 5, optionsCount = 4, context = "" } = req.body;
    const safeCount = Math.max(1, Math.min(20, Number(count) || 5));
    // Question schema requires exactly 4 options and correctAnswer 0..3.
    const safeOptionsCount = 4;

    if (!topicId || !levelId) {
      return res.status(400).json({ message: "Topic ID and Level ID are required" });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    // Fetch existing questions to avoid duplicates - handle empty results safely
    const existingQuestions = await Question.find({ topicId, levelId, isActive: true }).select('questionText');
    const existingTexts = existingQuestions.map(q => q.questionText || "");

    const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    const contextInstruction = context.trim() 
      ? `\n      SPECIFIC USER INSTRUCTIONS:\n      ${context}\n      Please follow these instructions closely while generating the questions.` 
      : "";

    const prompt = `
      You are an expert cognitive skill assessment creator.
      Task: Generate ${safeCount} unique, high-quality multiple-choice questions for a professional assessment.
      Topic: "${topic.topicName}"
      Difficulty: ${level.difficulty} (${level.title || "Standard"})
      
      INSTRUCTIONS FOR QUALITY AND STYLE:
      1. Each question must have exactly ${safeOptionsCount} options.
      2. Options must be logical, distinct, and plausible. Avoid overlapping or ambiguous choices.
      3. Questions must be challenging but fair for the "${level.difficulty}" level.
      4. Ensure mathematical, technical, and grammatical accuracy.
      5. CRITICAL: If the user context below mentions a source like "IndiaBIX", "GMAT", "CAT", etc., you MUST strictly follow the style, formatting, and difficulty patterns commonly found on those platforms for the given topic.${contextInstruction}
      6. Ensure each question is fundamentally different from others in this set.
      
      RESPONSE FORMAT:
      Return ONLY a valid JSON array. No explanations, no markdown formatting (like \`\`\`json), just the raw JSON.
      JSON Format:
      [
        {
          "questionText": "Clear and concise question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Brief, clear explanation of the correct answer and the logic behind it",
          "points": 10
        }
      ]
    `;

    // Helper to generate mock questions (used as fallback)
    const generateMockQuestions = (topicName, count, optionsCount, difficulty) => {
      const sampleQuestions = [
        { q: `Which concept is most central to ${topicName} at a ${difficulty} level?`, exp: `${topicName} requires mastery of core concepts.` },
        { q: `What is a common pitfall when implementing ${topicName} strategies?`, exp: `Identifying errors is key to ${topicName} proficiency.` },
        { q: `How does ${topicName} interact with related structural patterns?`, exp: `Structural understanding is fundamental for ${difficulty} level.` },
        { q: `Under which condition would ${topicName} be considered the optimal approach?`, exp: `Contextual application is a hallmark of skill.` },
        { q: `Evaluate the role of historical development in modern ${topicName}.`, exp: `Historical context deepens understanding.` },
      ];
      return Array.from({ length: count }).map((_, i) => {
        const sample = sampleQuestions[i % sampleQuestions.length];
        const correctIdx = Math.floor(Math.random() * optionsCount);
        
        const options = Array.from({ length: optionsCount }).map((_, oi) => {
          if (oi === correctIdx) return `The primary application of ${topicName} in a ${difficulty} environment.`;
          return `A secondary or outdated method for ${topicName} (${oi + 1})`;
        });

        return {
          questionText: sample.q,
          options: options,
          correctAnswer: correctIdx,
          explanation: sample.exp,
          points: 10
        };
      });
    };

    let questionsData;
    const hasValidKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

    let isMock = !hasValidKey;

    if (!hasValidKey) {
      console.log("No valid API key found. Using fallback data.");
      questionsData = generateMockQuestions(topic.topicName, safeCount, safeOptionsCount, level.difficulty);
    } else {
      try {
        console.log(`Generating ${safeCount} AI questions for ${topic.topicName} using ${MODEL_NAME}`);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Robust JSON extraction
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.warn("AI returned malformed text, attempting to clean.");
          text = text.replace(/```json/g, "").replace(/```/g, "").trim();
          const retryMatch = text.match(/\[[\s\S]*\]/);
          if (!retryMatch) throw new Error("AI did not return a valid JSON array");
          questionsData = JSON.parse(retryMatch[0]);
        } else {
          questionsData = JSON.parse(jsonMatch[0]);
        }
      } catch (aiError) {
        console.error("AI generation failed. Falling back to mock data. Error:", aiError.message);
        questionsData = generateMockQuestions(topic.topicName, safeCount, safeOptionsCount, level.difficulty);
        isMock = true;
      }
    }

    // Final deduplication (both against existing questions and intra-set)
    const existingTextsSet = new Set(existingTexts.filter(t => t).map(t => t.toLowerCase().trim()));
    const seenInResponse = new Set();
    
    const finalQuestions = Array.isArray(questionsData) ? questionsData.filter(q => {
      if (!q || typeof q !== 'object') return false;
      if (!q.questionText || !q.options || !Array.isArray(q.options) || q.options.length !== safeOptionsCount) {
        console.warn("Skipping malformed question object:", q);
        return false;
      }
      
      const normalizedText = q.questionText.toString().toLowerCase().trim();
      if (existingTextsSet.has(normalizedText) || seenInResponse.has(normalizedText)) {
        console.log(`Skipping duplicate question: ${q.questionText}`);
        return false;
      }
      
      seenInResponse.add(normalizedText);
      return true;
    }).map((q) => {
      const normalizedOptions = q.options.map((opt) => (opt ?? '').toString().trim());
      const parsedAnswer = Number(q.correctAnswer);
      const safeAnswer = Number.isInteger(parsedAnswer) && parsedAnswer >= 0 && parsedAnswer < safeOptionsCount ? parsedAnswer : 0;
      const safePoints = Number(q.points) > 0 ? Number(q.points) : 10;

      return {
        questionText: q.questionText.toString().trim(),
        options: normalizedOptions,
        correctAnswer: safeAnswer,
        explanation: (q.explanation || '').toString().trim(),
        points: safePoints,
      };
    }) : [];

    // Safety fallback: if all questions were filtered out, use at least one mock
    if (finalQuestions.length === 0 && safeCount > 0) {
      console.warn("All generated questions were filtered out as duplicates. Providing one mock question.");
      finalQuestions.push(...generateMockQuestions(topic.topicName, 1, safeOptionsCount, level.difficulty));
      isMock = true;
    }

    // Add topicId and levelId to each question
    const questionsToSave = finalQuestions.map(q => ({
      ...q,
      topicId,
      levelId,
      isActive: true
    }));

    res.status(200).json({
      success: true,
      count: questionsToSave.length,
      data: questionsToSave,
      isMock // Helpful for frontend to know
    });

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ message: "Failed to generate questions", error: error.message });
  }
};

/**
 * @desc    Generate performance insights using AI
 * @route   POST /api/ai/performance-insights
 * @access  Private
 */
exports.getPerformanceInsights = async (req, res) => {
  try {
    const { resultId } = req.body;

    if (!resultId) {
      return res.status(400).json({ message: "Result ID is required" });
    }

    const result = await TestResult.findById(resultId)
      .populate('topicId')
      .populate('userId', 'name');

    if (!result) {
      return res.status(404).json({ message: "Test result not found" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Analyze the following cognitive test result for a student named ${result.userId.name}.
      Topic: ${result.topicId.topicName}
      Score: ${result.score}%
      Total Questions: ${result.totalQuestions}
      Correct Answers: ${result.correctAnswers}
      
      Provide a short, encouraging, and actionable "AI Coach" feedback (2-3 sentences).
      Focus on their strengths if they scored well, or specific areas for improvement if they scored lower.
      Do not use markdown formatting, just plain text.
    `;

    let insight;
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      // Mock Insight
      if (result.score >= 80) {
        insight = `Excellent work, ${result.userId.name}! Your ${result.topicId.topicName} skills are top-notch. Keep pushing yourself with higher levels of difficulty.`;
      } else if (result.score >= 50) {
        insight = `Good effort, ${result.userId.name}. You have a solid foundation in ${result.topicId.topicName}, but focusing on accuracy under time pressure could really boost your scores.`;
      } else {
        insight = `Don't be discouraged, ${result.userId.name}. ${result.topicId.topicName} can be challenging. We recommend reviewing the basic patterns and trying a lower difficulty level first.`;
      }
    } else {
      const aiResult = await model.generateContent(prompt);
      const aiResponse = await aiResult.response;
      insight = aiResponse.text();
    }

    res.status(200).json({
      success: true,
      insight: insight.trim()
    });

  } catch (error) {
    console.error("AI Insight Error:", error);
    res.status(500).json({ message: "Failed to generate insights", error: error.message });
  }
};
