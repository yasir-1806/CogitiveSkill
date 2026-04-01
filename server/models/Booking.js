const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  levelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Level', required: true },
  bookingStatus: { type: String, enum: ['confirmed', 'completed', 'cancelled', 'missed'], default: 'confirmed' },
  isPresent: { type: Boolean, default: false },
  testStarted: { type: Boolean, default: false },
  testStartedAt: { type: Date },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
}, { timestamps: true });

bookingSchema.index({ studentId: 1, slotId: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
