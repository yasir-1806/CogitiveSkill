const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  levelsCompleted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Level' }],
  currentLevel: { type: Number, default: 1 },
  bestScore: { type: Number, default: 0 },
  totalAttempts: { type: Number, default: 0 },
  attemptsPerLevel: { type: Map, of: Number, default: {} },
  totalTimeSpent: { type: Number, default: 0, comment: 'seconds' },
  lastAttemptAt: { type: Date },
}, { timestamps: true });

progressSchema.index({ studentId: 1, topicId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
