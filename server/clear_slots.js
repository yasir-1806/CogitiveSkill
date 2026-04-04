require('dotenv').config();
const mongoose = require('mongoose');
const Slot = require('./models/Slot');
const Booking = require('./models/Booking');

const clearSlots = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Count before
    const count = await Slot.countDocuments({});
    
    // Clear all slots
    await Slot.deleteMany({});
    
    // Also clear bookings as they depend on slots
    await Booking.deleteMany({});

    console.log(`Successfully cleared ${count} slot documents and all associated bookings.`);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing slots:', err);
    process.exit(1);
  }
};

clearSlots();
