const Question = require('../models/Question');
const TestResult = require('../models/TestResult');
const Progress = require('../models/Progress');
const Leaderboard = require('../models/Leaderboard');
const Booking = require('../models/Booking');
const Level = require('../models/Level');

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';
const getNowParts = () => {
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const getPart = (type) => dateParts.find((p) => p.type === type)?.value || '';
  const date = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;

  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hh = timeParts.find((p) => p.type === 'hour')?.value || '00';
  const mm = timeParts.find((p) => p.type === 'minute')?.value || '00';
  const time = `${hh}:${mm}`;
  return { now, todayStr: date, currentTime: time };
};

// POST /api/tests/start
const startTest = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('slotId').populate('levelId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.bookingStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'This test session has already been completed.' });
    }

    const { now, todayStr, currentTime } = getNowParts();
    const slot = booking.slotId;

    // Require admin attendance verification
    if (!booking.isPresent) {
      return res.status(403).json({ success: false, message: 'You cannot start the test until an Admin marks you as present.' });
    }

    // Verify timing: must be today
    if (slot && slot.date !== todayStr) {
      return res.status(400).json({ success: false, message: 'This test is scheduled for ' + slot.date });
    }

    // Ensure session is active
    if (slot && currentTime > slot.endTime) {
      return res.status(400).json({ success: false, message: 'This session has already ended.' });
    }
    
    if (slot && currentTime < slot.startTime) {
       return res.status(400).json({ success: false, message: 'This session has not started yet. Starts at ' + slot.startTime });
    }

    // Select questions if not already locked in
    if (!booking.questions || booking.questions.length === 0) {
      const allQuestions = await Question.find({ levelId: booking.levelId._id, isActive: true }).select('_id');
      
      if (allQuestions.length === 0) {
        return res.status(400).json({ success: false, message: 'No questions available for this level' });
      }

      // Shuffle and pick the required number of questions from the Level model
      const targetCount = booking.levelId.totalQuestions || 10;
      
      // Fisher-Yates shuffle algorithm
      const shuffled = [...allQuestions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const selected = shuffled.slice(0, targetCount);
      
      // Ensure we store unique IDs (though Question.find with _id selection should already be unique)
      booking.questions = selected.map(q => q._id);
    }

    // Fetch the actual question details for the selected IDs
    const questions = await Question.find({ _id: { $in: booking.questions } }).select('-correctAnswer -__v');

    // Ensure they return in the same order as stored in the booking, and drop stale/missing references.
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
    const questionsInOrder = booking.questions
      .map((id) => questionMap.get(id.toString()))
      .filter(Boolean);

    if (!questionsInOrder.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found for this test. Please contact admin and regenerate questions.',
      });
    }

    // If some question IDs are stale, persist only valid IDs to prevent blank test rendering.
    if (questionsInOrder.length !== booking.questions.length) {
      booking.questions = questionsInOrder.map((q) => q._id);
    }

    // Mark booking as started
    booking.testStarted = true;
    booking.testStartedAt = now;
    await booking.save();

    // Calculate dynamic time limit based on slot end time
    let dynamicTimeLimit = booking.levelId.timeLimit;
    if (slot && slot.endTime && slot.date) {
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const slotEndDate = new Date(slot.date);
      slotEndDate.setHours(endHour, endMin, 0, 0);

      const secondsRemaining = Math.floor((slotEndDate.getTime() - now.getTime()) / 1000);
      
      if (secondsRemaining <= 0) {
        return res.status(400).json({ success: false, message: 'This slot has already ended. You cannot start the test now.' });
      }

      // Time limit is whichever is smaller: the level's limit or the time until slot ends
      dynamicTimeLimit = Math.min(booking.levelId.timeLimit, secondsRemaining);
    }

    res.json({
      success: true,
      questions: questionsInOrder,
      timeLimit: dynamicTimeLimit,
      originalTimeLimit: booking.levelId.timeLimit,
      levelInfo: booking.levelId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tests/submit
const submitTest = async (req, res) => {
  try {
    const { bookingId, answers, timeTaken } = req.body;
    const studentId = req.user._id;

    const booking = await Booking.findById(bookingId).populate('levelId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.bookingStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'This test session has already been submitted.' });
    }

    if (!booking.questions || booking.questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No questions were assigned to this test session.' });
    }

    // Fetch the specific questions assigned to this booking
    const questions = await Question.find({ _id: { $in: booking.questions } });
    if (!questions.length) return res.status(400).json({ success: false, message: 'Assigned questions not found' });

    // Maintain the order from the booking and remove stale question references.
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
    const questionsInOrder = booking.questions
      .map((id) => questionMap.get(id.toString()))
      .filter(Boolean);

    if (!questionsInOrder.length) {
      return res.status(400).json({ success: false, message: 'No valid questions available for submission' });
    }

    let score = 0;
    let maxScore = 0;
    const processedAnswers = questionsInOrder.map((q, idx) => {
      const selectedAnswer = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = selectedAnswer === q.correctAnswer;
      if (isCorrect) score += q.points;
      maxScore += q.points;
      return { questionId: q._id, selectedAnswer, isCorrect, timeTaken: 0 };
    });

    const percentage = Math.round((score / maxScore) * 100);
    const level = booking.levelId;
    const completionStatus = percentage >= level.passingScore ? 'passed' : 'failed';

    // Count previous attempts
    const prevAttempts = await TestResult.countDocuments({ studentId, levelId: level._id });

    const result = await TestResult.create({
      studentId, topicId: booking.topicId, levelId: level._id, bookingId,
      score, maxScore, percentage, timeTaken, completionStatus,
      answers: processedAnswers, attemptNumber: prevAttempts + 1,
    });

    // Update booking status
    booking.bookingStatus = 'completed';
    await booking.save();

      // Update progress
      let progress = await Progress.findOne({ studentId, topicId: booking.topicId });
      if (!progress) {
        progress = await Progress.create({ studentId, topicId: booking.topicId, levelsCompleted: [], currentLevel: 1 });
      }

      // Use level number for attempt tracking (better for frontend lookup)
      const levelNumStr = String(level.levelNumber);
      let currentAttempts = 0;
      
      // Handle both Mongoose Map and plain object access
      if (progress.attemptsPerLevel.get) {
        currentAttempts = progress.attemptsPerLevel.get(levelNumStr) || 0;
        progress.attemptsPerLevel.set(levelNumStr, currentAttempts + 1);
      } else {
        currentAttempts = progress.attemptsPerLevel[levelNumStr] || 0;
        progress.attemptsPerLevel[levelNumStr] = currentAttempts + 1;
      }
      progress.totalAttempts += 1;

      // Always update best score if current percentage is higher
      if (percentage > (progress.bestScore || 0)) {
        progress.bestScore = percentage;
      }

      const levelIdStr = level._id.toString();
      const alreadyCompleted = progress.levelsCompleted.map(id => id.toString()).includes(levelIdStr);
      
      if (completionStatus === 'passed') {
        if (!alreadyCompleted) {
          progress.levelsCompleted.push(level._id);
          progress.currentLevel = level.levelNumber + 1;
        }

        // Update leaderboard
        await Leaderboard.findOneAndUpdate(
          { studentId },
          { $inc: { totalScore: score, testsCompleted: 1 }, lastActive: new Date() },
          { upsert: true }
        );
      } else {
        // IF FAILED: Unregister the user from the topic
        const User = require('../models/User');
        await User.findByIdAndUpdate(studentId, {
          $pull: { registeredTopics: booking.topicId }
        });
        // RESET levels and currentLevel on failure but KEEP the progress record for attempts and bestScore
        progress.levelsCompleted = [];
        progress.currentLevel = 1;
      }

      progress.totalTimeSpent += timeTaken;
      progress.lastAttemptAt = new Date();
      await progress.save();

    // Award badges
    const badges = [];
    if (completionStatus === 'passed' && percentage === 100) badges.push({ name: 'Perfect Score', icon: '🏆' });
    if (completionStatus === 'passed') badges.push({ name: 'Level Cleared', icon: '⭐' });

    res.json({
      success: true,
      result: { score, maxScore, percentage, completionStatus, timeTaken, badges },
      questions: questionsInOrder.map(q => {
        const qObj = q.toObject();
        delete qObj.correctAnswer;
        return qObj;
      }),
      selectedAnswers: answers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tests/results
const getMyResults = async (req, res) => {
  try {
    const results = await TestResult.find({ studentId: req.user._id })
      .populate('topicId', 'topicName icon color')
      .populate('levelId', 'levelNumber difficulty title')
      .sort({ createdAt: -1 });
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tests/progress
const getMyProgress = async (req, res) => {
  try {
    const progress = await Progress.find({ studentId: req.user._id })
      .populate('topicId', 'topicName icon color gradient totalLevels')
      .populate('levelsCompleted', 'levelNumber difficulty title');
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tests/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find()
      .populate('studentId', 'name email badges')
      .sort({ totalScore: -1 })
      .limit(50);
    const ranked = leaderboard.map((entry, idx) => ({ ...entry.toObject(), rank: idx + 1 }));
    res.json({ success: true, leaderboard: ranked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { startTest, submitTest, getMyResults, getMyProgress, getLeaderboard };
