const { GoogleGenerativeAI } = require("@google/generative-ai");
const Question = require("../models/Question");
const Topic = require("../models/Topic");
const Level = require("../models/Level");
const TestResult = require("../models/TestResult");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const MAX_ATTEMPTS = 6;

const toKey = (value) =>
  (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractJsonArray = (text) => {
  if (!text) return [];
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return [];
  return JSON.parse(match[0]);
};

const normalizeQuestion = (q, optionsCount) => {
  if (!q || typeof q !== "object") return null;
  const questionText = (q.questionText || "").toString().trim();
  const optionsRaw = Array.isArray(q.options) ? q.options : [];
  const options = optionsRaw.map((opt) => (opt ?? "").toString().trim());
  const correctAnswer = Number(q.correctAnswer);
  const explanation = (q.explanation || "").toString().trim();
  const points = Number(q.points) > 0 ? Number(q.points) : 10;

  if (!questionText || questionText.length < 12) return null;
  if (options.length !== optionsCount) return null;
  if (options.some((opt) => !opt || opt.length < 1)) return null;
  if (new Set(options.map((opt) => toKey(opt))).size !== optionsCount) return null;
  if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= optionsCount) return null;
  if (questionText.toLowerCase().includes("which concept is most central")) return null;
  if (questionText.toLowerCase().includes("common pitfall when implementing")) return null;
  if (options.every((opt) => opt.length < 3)) return null;

  return {
    questionText,
    options,
    correctAnswer,
    explanation,
    points,
  };
};

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const uniqueByKey = (items, keyFn) => {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

const generateAptitudeFallback = (topicName, difficulty, count) => {
  const questions = [];
  let seed = Date.now() % 997;

  const rand = (min, max) => {
    seed = (seed * 37 + 11) % 10007;
    return min + (seed % (max - min + 1));
  };

  const add = (q) => {
    const normalized = normalizeQuestion(q, 4);
    if (normalized) questions.push(normalized);
  };

  for (let i = 0; i < count * 3 && questions.length < count; i += 1) {
    const type = i % 4;
    if (type === 0) {
      const a = rand(12, 85);
      const b = rand(6, 40);
      const ans = a + b;
      const opts = shuffle([ans, ans + 2, ans - 3, ans + 5]);
      add({
        questionText: `In an ${difficulty} ${topicName} test, what is ${a} + ${b}?`,
        options: opts.map(String),
        correctAnswer: opts.indexOf(ans),
        explanation: `Adding ${a} and ${b} gives ${ans}.`,
        points: 10,
      });
    } else if (type === 1) {
      const start = rand(2, 8);
      const d = rand(3, 9);
      const n1 = start;
      const n2 = start + d;
      const n3 = n2 + d;
      const n4 = n3 + d;
      const ans = n4 + d;
      const opts = shuffle([ans, ans + d, ans - d, ans + 2 * d]);
      add({
        questionText: `Find the next number in the sequence: ${n1}, ${n2}, ${n3}, ${n4}, ?`,
        options: opts.map(String),
        correctAnswer: opts.indexOf(ans),
        explanation: `This is an arithmetic progression with common difference ${d}.`,
        points: 10,
      });
    } else if (type === 2) {
      const p = rand(10, 35);
      const base = rand(120, 420);
      const ans = Math.round((p * base) / 100);
      const opts = shuffle([ans, ans + 6, ans - 4, ans + 10]);
      add({
        questionText: `What is ${p}% of ${base}?`,
        options: opts.map(String),
        correctAnswer: opts.indexOf(ans),
        explanation: `${p}% of ${base} is (${p}/${100}) x ${base} = ${ans}.`,
        points: 10,
      });
    } else {
      const speed = rand(30, 90);
      const time = rand(2, 6);
      const ans = speed * time;
      const opts = shuffle([ans, ans + speed, ans - speed, ans + 2 * speed]);
      add({
        questionText: `A vehicle travels at ${speed} km/h for ${time} hours. What distance does it cover?`,
        options: opts.map((x) => `${x} km`),
        correctAnswer: opts.indexOf(ans),
        explanation: `Distance = Speed x Time = ${speed} x ${time} = ${ans} km.`,
        points: 10,
      });
    }
  }

  return uniqueByKey(questions, (q) => toKey(q.questionText)).slice(0, count);
};

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

    const contextInstruction = context.trim() 
      ? `\n      SPECIFIC USER INSTRUCTIONS:\n      ${context}\n      Please follow these instructions closely while generating the questions.` 
      : "";

    const isIndiaBixRequested = /india\s*bix/i.test(context || "");
    const sourceStyleInstruction = isIndiaBixRequested
      ? `
      7. INDIABIX MODE (STRICT):
         - Match the style of IndiaBIX aptitude/logical/verbal MCQs.
         - Use practical exam-style wording with concrete values, not generic theory statements.
         - Every question and option set must be different from each other.
         - Do NOT copy exact published IndiaBIX questions verbatim; generate original questions in that style.
      `
      : "";

    const buildPrompt = (requiredCount, avoidQuestionTexts = []) => `
      You are an expert cognitive skill assessment creator.
      Task: Generate ${requiredCount} unique, high-quality multiple-choice questions for a professional assessment.
      Topic: "${topic.topicName}"
      Difficulty: ${level.difficulty} (${level.title || "Standard"})

      INSTRUCTIONS FOR QUALITY AND STYLE:
      1. Each question must have exactly ${safeOptionsCount} options.
      2. Options must be logical, distinct, and plausible. Avoid overlapping or ambiguous choices.
      3. Questions must be challenging but fair for the "${level.difficulty}" level.
      4. Ensure mathematical, technical, and grammatical accuracy.
      5. Do not repeat any question from this avoid list:
         ${avoidQuestionTexts.length ? avoidQuestionTexts.map((q, i) => `${i + 1}. ${q}`).join("\n         ") : "None"}
      6. Keep questions practical and test-like, not generic theory-only statements.${contextInstruction}
      7. Never output identical options in a question. Avoid "All of the above" and "None of the above".
      8. Do not repeat the same option set across different questions.
      ${sourceStyleInstruction}

      RESPONSE FORMAT:
      Return ONLY a valid JSON array. No markdown or extra text.
      [
        {
          "questionText": "Clear question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Brief explanation",
          "points": 10
        }
      ]
    `;

    let questionsData = [];
    const hasValidKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

    let isMock = !hasValidKey;

    if (!hasValidKey) {
      console.log("No valid API key found. Using fallback data.");
      questionsData = generateAptitudeFallback(topic.topicName, level.difficulty, safeCount);
    } else {
      try {
        const model = genAI.getGenerativeModel({
          model: MODEL_NAME,
          generationConfig: {
            temperature: 1,
            topP: 0.95,
          },
        });
        const avoid = [...existingTexts];

        for (let attempt = 1; attempt <= MAX_ATTEMPTS && questionsData.length < safeCount; attempt += 1) {
          const remaining = safeCount - questionsData.length;
          const requestCount = Math.min(remaining * 3, 30);
          const prompt = buildPrompt(requestCount, avoid.slice(-100));
          console.log(`AI generation attempt ${attempt}/${MAX_ATTEMPTS}: requesting ${requestCount} candidate(s) using ${MODEL_NAME}`);
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const batch = extractJsonArray(response.text());
          if (!Array.isArray(batch)) continue;

          for (const item of batch) {
            const normalized = normalizeQuestion(item, safeOptionsCount);
            if (!normalized) continue;
            questionsData.push(normalized);
            avoid.push(normalized.questionText);
            if (questionsData.length >= safeCount) break;
          }
        }
      } catch (aiError) {
        console.error("AI generation failed. Falling back to mock data. Error:", aiError.message);
        questionsData = generateAptitudeFallback(topic.topicName, level.difficulty, safeCount);
        isMock = true;
      }
    }

    // Final deduplication (both against existing questions and intra-set)
    const existingTextsSet = new Set(existingTexts.filter(t => t).map(t => toKey(t)));
    const seenOptionSets = new Set();
    const seenInResponse = new Set();
    
    const finalQuestions = Array.isArray(questionsData) ? questionsData
    .map((q) => normalizeQuestion(q, safeOptionsCount))
    .filter(Boolean)
    .filter((q) => {
      const normalizedText = toKey(q.questionText);
      const optionSetKey = q.options.map((opt) => toKey(opt)).sort().join("|");
      if (existingTextsSet.has(normalizedText) || seenInResponse.has(normalizedText)) {
        console.log(`Skipping duplicate question: ${q.questionText}`);
        return false;
      }
      if (seenOptionSets.has(optionSetKey)) {
        console.log(`Skipping duplicate option set for question: ${q.questionText}`);
        return false;
      }
      
      seenInResponse.add(normalizedText);
      seenOptionSets.add(optionSetKey);
      return true;
    }) : [];

    if (finalQuestions.length < safeCount) {
      const missing = safeCount - finalQuestions.length;
      console.warn(`Generated ${finalQuestions.length}/${safeCount}. Filling ${missing} with structured fallback.`);
      const fallback = generateAptitudeFallback(topic.topicName, level.difficulty, missing * 2);
      const filteredFallback = fallback.filter((q) => {
        const normalizedText = toKey(q.questionText);
        const optionSetKey = q.options.map((opt) => toKey(opt)).sort().join("|");
        if (existingTextsSet.has(normalizedText) || seenInResponse.has(normalizedText)) return false;
        if (seenOptionSets.has(optionSetKey)) return false;
        seenInResponse.add(normalizedText);
        seenOptionSets.add(optionSetKey);
        return true;
      }).slice(0, missing);
      finalQuestions.push(...filteredFallback);
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
