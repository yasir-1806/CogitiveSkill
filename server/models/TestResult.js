const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  levelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Level', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  timeTaken: { type: Number, comment: 'seconds' },
  completionStatus: { type: String, enum: ['passed', 'failed', 'incomplete'], required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeTaken: Number,
  }],
  attemptNumber: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('TestResult', testResultSchema);
