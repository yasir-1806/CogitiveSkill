const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Question = require('../models/Question');
const Level = require('../models/Level');
const Slot = require('../models/Slot');
require('dotenv').config();

async function auditWorkflow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB for audit.");

    // Check if we can find at least one booking to simulate startTest logic
    const booking = await Booking.findOne().populate('slotId').populate('levelId');
    if (!booking) {
      console.log("No bookings found in DB to audit. Skipping deep dive.");
    } else {
      console.log("Found booking for audit simulator.");
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const slot = booking.slotId;
      
      console.log("Simulator Check:");
      console.log("- now:", now);
      console.log("- todayStr:", todayStr);
      console.log("- slot available:", !!slot);
      if (slot) console.log("- slot date:", slot.date);
      
      // Verification of logic fixed in testController.js
      if (slot && slot.date !== todayStr) {
        console.log("INFO: Date mismatch (expected for non-today slots)");
      }
    }

    console.log("Workflow audit complete.");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Audit failed:", err.message);
    process.exit(1);
  }
}

auditWorkflow();
