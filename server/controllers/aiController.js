const OpenAI = require("openai");
const Question = require("../models/Question");
const Topic = require("../models/Topic");
const Level = require("../models/Level");
const TestResult = require("../models/TestResult");

// Initialize OpenAI (lazy initialization for missing API key)
let openai = null;

const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY?.trim()) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

const MODEL_NAME = process.env.OPENAI_MODEL || "gpt-4-turbo";
const MAX_ATTEMPTS = 10;
const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "these", "those",
  "about", "based", "style", "format", "difficulty", "level", "easy", "medium", "hard",
  "question", "questions", "generate", "only", "must", "should", "use", "create",
  "mcq", "mcqs", "options", "option", "answer", "explanation", "topic",
  "indiabix", "gmat", "cat", "aptitude", "please", "make", "strict", "mode",
]);

const GRAMMAR_CUE_REGEX = /\b(grammar|grammer|sentence|preposition|article|tense|voice|synonym|antonym|spelling|fill in the blank|error detection|choose the correct|choose the best)\b/i;
const QUANT_CUE_REGEX = /\b(percentage|profit|loss|ratio|time|speed|distance|average|series|algebra|equation|solve|calculate|number)\b/i;

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
  try {
    return JSON.parse(match[0]);
  } catch (err) {
    console.warn('Failed to parse JSON array from AI output:', err.message);
    return [];
  }
};

const extractFirstJson = (text) => {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (err) {
      console.warn('Failed to parse JSON object from AI output:', err.message);
    }
  }
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (err) {
      console.warn('Failed to parse JSON array from AI output:', err.message);
    }
  }
  return null;
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

const detectCommandProfile = (context = "") => {
  const normalized = toKey(context);
  const grammarRequested = /\b(grammar|grammer|english|verbal|preposition|article|tense|voice|synonym|antonym|spelling)\b/.test(normalized);
  const quantRequested = /\b(quant|math|aptitude|percentage|profit|loss|ratio|time|speed|distance|series|equation|problem solving)\b/.test(normalized);

  let mode = "general";
  if (grammarRequested && !quantRequested) mode = "grammar";
  else if (quantRequested && !grammarRequested) mode = "quant";
  else if (grammarRequested && quantRequested) mode = "mixed";

  return { mode, grammarRequested, quantRequested };
};

const extractCommandKeywords = (context = "", topicName = "") => {
  const contextTokens = toKey(context)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
  const topicTokens = new Set(
    toKey(topicName)
      .split(" ")
      .map((t) => t.trim())
      .filter(Boolean)
  );

  const keywords = contextTokens.filter((token) => {
    if (token.length < 3) return false;
    if (STOPWORDS.has(token)) return false;
    if (topicTokens.has(token)) return false;
    return true;
  });

  return uniqueByKey(keywords, (k) => k).slice(0, 12);
};

const isQuestionCompliantWithCommands = (q, commandKeywords, profile = { mode: "general" }) => {
  const raw = `${q.questionText} ${Array.isArray(q.options) ? q.options.join(" ") : ""} ${q.explanation || ""}`;
  const haystack = toKey(raw);

  // Hard mode filters
  if (profile.mode === "grammar") {
    const hasGrammarCue = GRAMMAR_CUE_REGEX.test(raw);
    const hasQuantCue = QUANT_CUE_REGEX.test(raw) || /[\d+\-*/%=]/.test(raw);
    if (!hasGrammarCue) return false;
    if (hasQuantCue) return false;
  }

  if (profile.mode === "quant") {
    const hasQuantCue = QUANT_CUE_REGEX.test(raw) || /[\d+\-*/%=]/.test(raw);
    if (!hasQuantCue) return false;
  }

  if (!commandKeywords.length) return true;
  const matched = commandKeywords.filter((kw) => haystack.includes(kw)).length;
  const requiredMatches = profile.mode === "general" ? Math.min(2, commandKeywords.length) : Math.min(1, commandKeywords.length);
  return matched >= requiredMatches;
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

const generateGrammarFallback = (topicName, difficulty, count) => {
  const samples = [
    {
      questionText: `Choose the correct sentence.`,
      options: [
        "She does not likes coffee.",
        "She do not like coffee.",
        "She does not like coffee.",
        "She not likes coffee.",
      ],
      correctAnswer: 2,
      explanation: "With 'does', base verb form is used: 'like'.",
      points: 10,
    },
    {
      questionText: `Fill in the blank: He is good ___ mathematics.`,
      options: ["in", "at", "on", "for"],
      correctAnswer: 1,
      explanation: "The correct preposition is 'at'.",
      points: 10,
    },
    {
      questionText: `Identify the sentence with correct subject-verb agreement.`,
      options: [
        "The list of items are on the desk.",
        "The list of items is on the desk.",
        "The list of items were on the desk.",
        "The list of items be on the desk.",
      ],
      correctAnswer: 1,
      explanation: "The subject 'list' is singular, so 'is' is correct.",
      points: 10,
    },
    {
      questionText: `Choose the correct article usage: ___ honest person always speaks the truth.`,
      options: ["A", "An", "The", "No article"],
      correctAnswer: 1,
      explanation: "'Honest' starts with a vowel sound, so 'An' is correct.",
      points: 10,
    },
    {
      questionText: `Select the best synonym of "brief".`,
      options: ["Lengthy", "Short", "Noisy", "Complex"],
      correctAnswer: 1,
      explanation: "'Brief' means short in duration or length.",
      points: 10,
    },
  ];

  const out = [];
  for (let i = 0; i < count; i += 1) {
    const base = samples[i % samples.length];
    out.push({
      ...base,
      questionText: `${base.questionText} (${topicName} - ${difficulty} set ${Math.floor(i / samples.length) + 1})`,
    });
  }
  return out.map((q) => normalizeQuestion(q, 4)).filter(Boolean);
};

const generateGeneralFallback = (topicName, difficulty, count) => {
  const samples = [
    {
      questionText: `Which statement best describes the core purpose of ${topicName}?`,
      options: [
        `To improve the main ${topicName.toLowerCase()} skills through practice and strategy.`,
        `To memorize random details without context.`,
        `To focus only on speed while ignoring accuracy.`,
        `To avoid using any structured approach or method.`,
      ],
      correctAnswer: 0,
      explanation: `The core purpose of ${topicName} is to build strong skills with practice and meaningful strategies.`,
      points: 10,
    },
    {
      questionText: `Which technique is most useful when developing ${topicName} skills?`,
      options: [
        `Regular practice with structured review and examples.`,
        `Relying on random guessing without planning.`,
        `Avoiding repetition and practicing only once.`,
        `Using unrelated exercises that do not target ${topicName}.`,
      ],
      correctAnswer: 0,
      explanation: `Effective ${topicName.toLowerCase()} development uses structured review and practice-based examples.`,
      points: 10,
    },
    {
      questionText: `What is an example of a strong ${topicName.toLowerCase()} strategy?`,
      options: [
        `Breaking the skill into smaller parts and practicing each one.`,
        `Doing only one long pass through the material without review.`,
        `Trying to remember everything without any system.`,
        `Ignoring feedback and repeating the same mistakes.`,
      ],
      correctAnswer: 0,
      explanation: `A good strategy is to break ${topicName.toLowerCase()} into smaller, manageable parts and practice them deliberately.`,
      points: 10,
    },
    {
      questionText: `Why is feedback important when learning ${topicName}?`,
      options: [
        `It helps identify mistakes and improve performance quickly.`,
        `It makes the process slower and less efficient.`,
        `It is only useful for advanced learners, not beginners.`,
        `It encourages memorization without understanding.`,
      ],
      correctAnswer: 0,
      explanation: `Feedback helps learners correct errors and improve their ${topicName.toLowerCase()} skills faster.`,
      points: 10,
    },
    {
      questionText: `Which habit would most likely improve ${topicName.toLowerCase()} over time?`,
      options: [
        `Consistent practice with focused review and reflection.`,
        `Avoiding practice until the very last minute.`,
        `Studying multiple unrelated topics simultaneously.`,
        `Repeating the same task without evaluating results.`,
      ],
      correctAnswer: 0,
      explanation: `Consistent practice with review and reflection is the best way to build strong ${topicName.toLowerCase()} habits.`,
      points: 10,
    },
  ];

  const out = [];
  for (let i = 0; i < count; i += 1) {
    const base = samples[i % samples.length];
    out.push({
      ...base,
      questionText: `${base.questionText} (${topicName} - ${difficulty} set ${Math.floor(i / samples.length) + 1})`,
    });
  }

  return uniqueByKey(out, (q) => toKey(q.questionText)).slice(0, count);
};

const generateCommandAwareFallback = (topicName, difficulty, count, commandKeywords = [], profile = { mode: "general" }) => {
  const base = profile.mode === "grammar"
    ? generateGrammarFallback(topicName, difficulty, count * 3)
    : profile.mode === "quant"
    ? generateAptitudeFallback(topicName, difficulty, count * 3)
    : generateGeneralFallback(topicName, difficulty, count * 3);
  if (!commandKeywords.length) return base.slice(0, count);

  const enriched = base.map((q, i) => {
    const k1 = commandKeywords[i % commandKeywords.length];
    const k2 = commandKeywords[(i + 1) % commandKeywords.length];
    return {
      ...q,
      questionText: `${q.questionText} (${k1}${k2 ? `, ${k2}` : ""})`,
      explanation: q.explanation
        ? `${q.explanation} This item targets: ${k1}${k2 ? `, ${k2}` : ""}.`
        : `This item targets: ${k1}${k2 ? `, ${k2}` : ""}.`,
    };
  });

  return enriched
    .map((q) => normalizeQuestion(q, 4))
    .filter(Boolean)
    .filter((q) => isQuestionCompliantWithCommands(q, commandKeywords, profile))
    .slice(0, count);
};

const getCompliantIndexes = async (model, questions, topicName, difficulty, context) => {
  if (!Array.isArray(questions) || !questions.length) return [];
  if (!context || !context.trim()) return questions.map((_, idx) => idx);

  const checkerPrompt = `
    You are a strict quality gate for MCQ generation.
    USER COMMANDS (MUST FOLLOW):
    ${context}

    Topic: ${topicName}
    Difficulty: ${difficulty}

    Questions:
    ${JSON.stringify(questions, null, 2)}

    Return ONLY JSON in this exact format:
    {"acceptedIndexes":[0,2]}

    Rules:
    - Include only indexes for questions that clearly follow user commands.
    - If uncertain, reject the question.
    - No extra text.
  `;

  try {
    const result = await model.generateContent(checkerPrompt);
    const response = await result.response;
    const parsed = extractFirstJson(response.text());
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => Number.isInteger(x) && x >= 0 && x < questions.length);
    }
    if (parsed && Array.isArray(parsed.acceptedIndexes)) {
      return parsed.acceptedIndexes.filter((x) => Number.isInteger(x) && x >= 0 && x < questions.length);
    }
    return [];
  } catch (err) {
    console.warn("Compliance checker failed, allowing batch without checker filtering:", err.message);
    return questions.map((_, idx) => idx);
  }
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
      ? `\n      USER PROMPT / COMMANDS:\n      ${context}\n      Please follow these instructions closely while generating the questions.` 
      : "";

    const isIndiaBixRequested = /india\s*bix/i.test(context || "");
    const commandProfile = detectCommandProfile(context);
    const commandKeywords = extractCommandKeywords(context, topic.topicName);
    const sourceStyleInstruction = isIndiaBixRequested
      ? `
      7. INDIABIX MODE (STRICT):
         - Match the style of IndiaBIX aptitude/logical/verbal MCQs.
         - Use practical exam-style wording with concrete values, not generic theory statements.
         - Every question and option set must be different from each other.
         - Do NOT copy exact published IndiaBIX questions verbatim; generate original questions in that style.
      `
      : "";

    const modeInstruction = commandProfile.mode === "grammar"
      ? `
      9. STRICT MODE: Generate ONLY English grammar/verbal questions.
      10. DO NOT generate arithmetic, quantitative aptitude, number-series, or problem-solving math questions.
      `
      : commandProfile.mode === "quant"
      ? `
      9. STRICT MODE: Generate ONLY quantitative/problem-solving aptitude questions.
      10. Include numeric reasoning and avoid pure grammar/verbal-only questions.
      `
      : "";

    const buildPrompt = (requiredCount, avoidQuestionTexts = []) => `
You are an expert MCQ (multiple choice question) creator for cognitive skill assessments.

TASK: Generate ${requiredCount} unique, high-quality multiple-choice questions.

CONTEXT:
- Topic: "${topic.topicName}"
- Difficulty: ${level.difficulty}
- Level Title: ${level.title || "Standard"}
${context.trim() ? `- User Commands: ${context}` : ""}

REQUIREMENTS:
1. Each question MUST have exactly 4 options
2. Options must be distinct, logical, and plausible
3. Questions must be appropriate for "${level.difficulty}" difficulty level
4. All questions must be unique (do not repeat)
5. Ensure grammatical and factual accuracy
6. Questions must be practical and test-like
7. Never use "All of the above" or "None of the above"
8. Avoid repeating the same option patterns across questions

AVOID these existing questions:
${avoidQuestionTexts.length > 0 ? avoidQuestionTexts.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join("\n") : "None"}

RESPONSE FORMAT:
Return ONLY a valid JSON array with NO additional text or markdown.
Example format:
[
  {
    "questionText": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "explanation": "Paris is the capital city of France.",
    "points": 10
  }
]
`;

    let questionsData = [];
    const hasValidKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim();
    let fallbackReason = null;
    let isMock = !hasValidKey;

    if (!hasValidKey) {
      fallbackReason = "No valid OpenAI API key configured. Using fallback data.";
      console.log(fallbackReason);
      questionsData = generateCommandAwareFallback(
        topic.topicName,
        level.difficulty,
        safeCount,
        commandKeywords,
        commandProfile
      );
    } else {
      try {
        const avoid = [...existingTexts];

        for (let attempt = 1; attempt <= MAX_ATTEMPTS && questionsData.length < safeCount; attempt += 1) {
          const remaining = safeCount - questionsData.length;
          const requestCount = Math.min(Math.max(remaining * 2, 1), 10);
          const prompt = buildPrompt(requestCount, avoid.slice(-50));
          console.log(`AI generation attempt ${attempt}/${MAX_ATTEMPTS}: requesting ${requestCount} question(s) using ${MODEL_NAME}`);
          const message = await getOpenAI().chat.completions.create({
            model: MODEL_NAME,
            messages: [{
              role: "user",
              content: prompt
            }],
            temperature: 0.7,
            max_tokens: 2000,
          });
          const responseText = message.choices[0]?.message?.content || "";
          const batch = extractJsonArray(responseText);
          if (!Array.isArray(batch) || batch.length === 0) continue;

          const normalizedBatch = batch
            .map((item) => normalizeQuestion(item, safeOptionsCount))
            .filter(Boolean);

          normalizedBatch.forEach((q) => {
            if (questionsData.length >= safeCount) return;
            if (!isQuestionCompliantWithCommands(q, commandKeywords, commandProfile)) return;
            questionsData.push(q);
            avoid.push(q.questionText);
          });
        }

        if (questionsData.length === 0) {
          console.warn("AI did not generate valid questions. Using fallback.");
          questionsData = generateCommandAwareFallback(
            topic.topicName,
            level.difficulty,
            safeCount,
            commandKeywords,
            commandProfile
          );
          isMock = true;
        }
      } catch (aiError) {
        fallbackReason = `OpenAI API Error: ${aiError.message}`;
        console.error("AI generation failed:", aiError.message);
        questionsData = generateCommandAwareFallback(
          topic.topicName,
          level.difficulty,
          safeCount,
          commandKeywords,
          commandProfile
        );
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
    .filter((q) => isQuestionCompliantWithCommands(q, commandKeywords, commandProfile))
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
      const fallback = generateCommandAwareFallback(
        topic.topicName,
        level.difficulty,
        missing * 2,
        commandKeywords,
        commandProfile
      );
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

    const finalCapped = finalQuestions.slice(0, safeCount);

    // Add topicId and levelId to each question
    const questionsToSave = finalCapped.map(q => ({
      ...q,
      topicId,
      levelId,
      isActive: true
    }));

    res.status(200).json({
      success: true,
      count: questionsToSave.length,
      data: questionsToSave,
      isMock,
      fallbackReason,
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

    let insight;

    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
      // Fallback insight
      if (result.percentage >= 80) {
        insight = `Excellent work, ${result.userId.name}! Your ${result.topicId.topicName} skills are top-notch. Keep pushing yourself with higher levels of difficulty.`;
      } else if (result.percentage >= 50) {
        insight = `Good effort, ${result.userId.name}. You have a solid foundation in ${result.topicId.topicName}, but focusing on accuracy could help boost your scores.`;
      } else {
        insight = `Keep practicing, ${result.userId.name}. With more effort on ${result.topicId.topicName}, you'll improve significantly.`;
      }
    } else {
      try {
        const message = await getOpenAI().chat.completions.create({
          model: MODEL_NAME,
          messages: [
            {
              role: "system",
              content: "You are an AI coach providing encouraging and actionable feedback to students. Be supportive and specific. Keep response to 2-3 sentences."
            },
            {
              role: "user",
              content: `A student named ${result.userId.name} just completed a test on ${result.topicId.topicName}.
Score: ${result.percentage}%
Correct Answers: ${result.correctAnswers}/${result.totalQuestions}

Provide brief, encouraging, and actionable feedback. Focus on strengths if they did well, or specific improvement areas if they struggled.`
            }
          ],
          temperature: 0.7,
          max_tokens: 200,
        });

        insight = message.choices[0]?.message?.content?.trim() || "Great effort on the test!";
      } catch (error) {
        console.error("OpenAI API Error:", error.message);
        // Fallback if API fails
        if (result.percentage >= 80) {
          insight = `Excellent work, ${result.userId.name}! Your ${result.topicId.topicName} skills are top-notch. Keep pushing yourself with higher levels of difficulty.`;
        } else if (result.percentage >= 50) {
          insight = `Good effort, ${result.userId.name}. You have a solid foundation in ${result.topicId.topicName}, but focusing on accuracy could help boost your scores.`;
        } else {
          insight = `Keep practicing, ${result.userId.name}. With more effort on ${result.topicId.topicName}, you'll improve significantly.`;
        }
      }
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
