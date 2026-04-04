require('dotenv').config();
const mongoose = require('mongoose');
const Slot = require('./models/Slot');

const checkSlots = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await Slot.countDocuments({ isActive: true });
    console.log(`Current active slots: ${count}`);
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
};
checkSlots();
