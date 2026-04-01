const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalScore: { type: Number, default: 0 },
  testsCompleted: { type: Number, default: 0 },
  levelsUnlocked: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
