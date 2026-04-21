const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const { generateQuestions } = require('./controllers/aiController');
const Topic = require('./models/Topic');
const Level = require('./models/Level');

async function verify() {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    // Get a sample topic and level
    const topic = await Topic.findOne({ topicName: 'Logical Reasoning' });
    const level = await Level.findOne({ topicId: topic._id });
    
    if (!topic || !level) {
      console.log('Could not find topic or level for testing');
      process.exit(1);
    }

    console.log(`Testing for topic: ${topic.topicName}, level: ${level.difficulty}`);
    
    // Mock req and res
    const req = {
      body: {
        topicId: topic._id.toString(),
        levelId: level._id.toString(),
        count: 3
      }
    };
    
    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(data) { this.data = data; return this; }
    };

    // Temporarily invalidate API key in memory for this test
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'invalid_key_for_testing';
    
    await generateQuestions(req, res);
    
    console.log('--- Response ---');
    console.log('Status:', res.statusCode);
    console.log('isMock:', res.data.isMock);
    console.log('fallbackReason:', res.data.fallbackReason);
    console.log('Count:', res.data.count);
    console.log('Sample Question 1:', res.data.data[0].questionText);
    
    // Restore key
    process.env.GEMINI_API_KEY = originalKey;
    
    if (res.data.isMock === false && res.data.count > 0 && res.data.data[0].questionText.includes('Logical Reasoning') === false) {
       // Our backup questions for Logic don't necessarily have the word 'Logical Reasoning' but they are from the set
       console.log('SUCCESS: Backup questions returned without mock flags.');
    } else {
       console.log('Verification check result:', res.data.isMock === false ? 'No mock flag (Good)' : 'Mock flag present (Bad)');
    }

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

verify();
