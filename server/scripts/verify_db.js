const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Booking = require('../models/Booking');
const TestResult = require('../models/TestResult');
const Progress = require('../models/Progress');
const Leaderboard = require('../models/Leaderboard');
const Slot = require('../models/Slot');
const Topic = require('../models/Topic');
const Level = require('../models/Level');
const Question = require('../models/Question');

async function verifyCleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const counts = {
      bookings: await Booking.countDocuments(),
      results: await TestResult.countDocuments(),
      progress: await Progress.countDocuments(),
      leaderboard: await Leaderboard.countDocuments(),
      slots: await Slot.countDocuments(),
      students: await User.countDocuments({ role: 'student' }),
      admins: await User.countDocuments({ role: 'admin' }),
      topics: await Topic.countDocuments(),
      levels: await Level.countDocuments(),
      questions: await Question.countDocuments()
    };

    console.log('--- Verification Results ---');
    console.log(`Bookings (Expected 0): ${counts.bookings}`);
    console.log(`Test Results (Expected 0): ${counts.results}`);
    console.log(`Progress (Expected 0): ${counts.progress}`);
    console.log(`Leaderboard (Expected 0): ${counts.leaderboard}`);
    console.log(`Slots (Expected 0): ${counts.slots}`);
    console.log(`Students (Expected 0): ${counts.students}`);
    console.log(`Admins (Expected >0): ${counts.admins}`);
    console.log(`Topics (Expected >0): ${counts.topics}`);
    console.log(`Levels (Expected >0): ${counts.levels}`);
    console.log(`Questions (Expected >0): ${counts.questions}`);

    const allPassed = 
      counts.bookings === 0 && 
      counts.results === 0 && 
      counts.progress === 0 && 
      counts.leaderboard === 0 && 
      counts.slots === 0 && 
      counts.students === 0 && 
      counts.admins > 0 &&
      counts.topics > 0;

    if (allPassed) {
      console.log('\nSUCCESS: Database is in the requested state.');
    } else {
      console.log('\nFAILURE: Database state does not match requirements.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Verification error:', error);
    process.exit(1);
  }
}

verifyCleanup();
