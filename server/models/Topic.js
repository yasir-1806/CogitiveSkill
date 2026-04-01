const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  topicName: { type: String, required: [true, 'Topic name is required'], trim: true, unique: true },
  description: { type: String, required: [true, 'Description is required'] },
  icon: { type: String, default: '🧠' },
  color: { type: String, default: '#6366f1' },
  gradient: { type: String, default: 'from-indigo-500 to-purple-600' },
  totalLevels: { type: Number, default: 3 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Topic', topicSchema);
