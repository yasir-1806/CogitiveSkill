const Topic = require('../models/Topic');

const getTopics = async (req, res) => {
  try {
    const topics = await Topic.find({ isActive: true }).select('-__v');
    res.json({ success: true, topics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createTopic = async (req, res) => {
  try {
    const { topicName, description, icon, color, gradient } = req.body;
    const topic = await Topic.create({ topicName, description, icon, color, gradient });
    res.status(201).json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
    res.json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteTopic = async (req, res) => {
  try {
    await Topic.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Topic deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const registerTopic = async (req, res) => {
  try {
    const topicId = req.params.id;
    const User = require('../models/User'); // Import User model inline to avoid circular deps if any, or just import at top
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already registered
    const alreadyRegistered = (user.registeredTopics || []).some(id => id.toString() === topicId);
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, message: 'Already registered for this topic' });
    }

    // Initialize array if it doesn't exist (Mongoose usually handles this but safe check)
    if (!user.registeredTopics) {
      user.registeredTopics = [];
    }

    user.registeredTopics.push(topicId);
    await user.save();

    // Create a Progress document to store in the 'progresses' collection immediately
    const Progress = require('../models/Progress');
    const existingProgress = await Progress.findOne({ studentId: user._id, topicId });
    if (!existingProgress) {
      await Progress.create({
        studentId: user._id,
        topicId,
        levelsCompleted: [],
        currentLevel: 1
      });
    }

    res.json({ success: true, message: 'Registered successfully', registeredTopics: user.registeredTopics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTopics, createTopic, updateTopic, deleteTopic, registerTopic };
