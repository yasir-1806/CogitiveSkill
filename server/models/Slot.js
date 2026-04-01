const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true, comment: 'YYYY-MM-DD format' },
  startTime: { type: String, required: true, comment: 'HH:MM format' },
  endTime: { type: String, required: true },
  slotLabel: { type: String, required: true, comment: 'e.g. Slot 1' },
  maxStudents: { type: Number, default: 30 },
  bookedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

slotSchema.virtual('availableSeats').get(function () {
  return this.maxStudents - this.bookedStudents.length;
});

slotSchema.virtual('isFull').get(function () {
  return this.bookedStudents.length >= this.maxStudents;
});

slotSchema.set('toJSON', { virtuals: true });
slotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Slot', slotSchema);
