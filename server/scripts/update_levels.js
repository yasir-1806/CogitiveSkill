require('dotenv').config();
const mongoose = require('mongoose');
const Level = require('../models/Level');

const updateLevels = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await Level.updateMany(
      {},
      { 
        $set: { 
          passingScore: 60,
          totalQuestions: 40
        } 
      }
    );

    console.log(`Successfully updated ${result.modifiedCount} level documents.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
};

updateLevels();
