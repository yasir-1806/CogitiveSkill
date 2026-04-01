const Level = require('../models/Level');
const Progress = require('../models/Progress');

const getLevelsByTopic = async (req, res) => {
  try {
    const levels = await Level.find({ topicId: req.params.topicId, isActive: true }).sort('levelNumber');

    // If student, attach unlock and completion status
    let unlockedLevels = [1];
    let completedLevelIds = [];
    if (req.user && req.user.role === 'student') {
      const progress = await Progress.findOne({ studentId: req.user._id, topicId: req.params.topicId });
      if (progress) {
        completedLevelIds = progress.levelsCompleted.map(id => id.toString());
        const completedNums = progress.levelsCompleted.length;
        unlockedLevels = Array.from({ length: completedNums + 1 }, (_, i) => i + 1);
      }
    }

    const levelsWithStatus = levels.map(l => ({
      ...l.toObject(),
      isUnlocked: req.user?.role === 'admin' || unlockedLevels.includes(l.levelNumber),
      isCompleted: completedLevelIds.includes(l._id.toString())
    }));

    res.json({ success: true, levels: levelsWithStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createLevel = async (req, res) => {
  try {
    const { topicId, levelNumber, difficulty, title, description, timeLimit, passingScore } = req.body;
    const level = await Level.create({ topicId, levelNumber, difficulty, title, description, timeLimit, passingScore });
    res.status(201).json({ success: true, level });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateLevel = async (req, res) => {
  try {
    const level = await Level.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!level) return res.status(404).json({ success: false, message: 'Level not found' });
    res.json({ success: true, level });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteLevel = async (req, res) => {
  try {
    await Level.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Level deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLevelsByTopic, createLevel, updateLevel, deleteLevel };
