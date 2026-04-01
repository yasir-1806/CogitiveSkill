const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  levelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Level', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  questionText: { type: String, required: [true, 'Question text is required'] },
  options: {
    type: [{ type: String }],
    validate: { validator: (v) => v.length === 4, message: 'Exactly 4 options required' },
  },
  correctAnswer: { type: Number, required: true, min: 0, max: 3, comment: 'Index of correct option' },
  explanation: { type: String, default: '' },
  points: { type: Number, default: 10 },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
