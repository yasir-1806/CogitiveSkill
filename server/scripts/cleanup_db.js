const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Booking = require('../models/Booking');
const TestResult = require('../models/TestResult');
const Progress = require('../models/Progress');
const Leaderboard = require('../models/Leaderboard');
const Slot = require('../models/Slot');

async function cleanupDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Delete transactional data
    console.log('Deleting bookings...');
    const deletedBookings = await Booking.deleteMany({});
    console.log(`Deleted ${deletedBookings.deletedCount} bookings.`);

    console.log('Deleting test results...');
    const deletedResults = await TestResult.deleteMany({});
    console.log(`Deleted ${deletedResults.deletedCount} test results.`);

    console.log('Deleting progress records...');
    const deletedProgress = await Progress.deleteMany({});
    console.log(`Deleted ${deletedProgress.deletedCount} progress records.`);

    console.log('Deleting leaderboard entries...');
    const deletedLeaderboard = await Leaderboard.deleteMany({});
    console.log(`Deleted ${deletedLeaderboard.deletedCount} leaderboard entries.`);

    console.log('Deleting slots...');
    const deletedSlots = await Slot.deleteMany({});
    console.log(`Deleted ${deletedSlots.deletedCount} slots.`);

    // 2. Delete core content as requested
    console.log('Deleting questions...');
    const deletedQuestions = await Question.deleteMany({});
    console.log(`Deleted ${deletedQuestions.deletedCount} questions.`);

    console.log('Deleting levels...');
    const deletedLevels = await Level.deleteMany({});
    console.log(`Deleted ${deletedLevels.deletedCount} levels.`);

    console.log('Deleting topics...');
    const deletedTopics = await Topic.deleteMany({});
    console.log(`Deleted ${deletedTopics.deletedCount} topics.`);

    // 3. Delete student users
    console.log('Deleting student accounts...');
    const deletedStudents = await User.deleteMany({ role: 'student' });
    console.log(`Deleted ${deletedStudents.deletedCount} student accounts.`);

    // 3. Count remaining (should be admins and core content)
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`Remaining admins: ${adminCount}`);

    console.log('\nCleanup completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDatabase();
