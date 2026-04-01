const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  levelNumber: { type: Number, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  timeLimit: { type: Number, default: 600, comment: 'seconds' },
  passingScore: { type: Number, default: 70, comment: 'percentage' },
  totalQuestions: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

levelSchema.index({ topicId: 1, levelNumber: 1 }, { unique: true });

module.exports = mongoose.model('Level', levelSchema);
