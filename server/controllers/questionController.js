const Question = require('../models/Question');

const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ levelId: req.params.levelId, isActive: true })
      .sort('order')
      .select('-correctAnswer -__v'); // hide answers from students
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getQuestionsAdmin = async (req, res) => {
  try {
    const questions = await Question.find({ levelId: req.params.levelId, isActive: true }).sort('order');
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addQuestion = async (req, res) => {
  try {
    const { levelId, topicId, questionText, options, correctAnswer, explanation, points, order } = req.body;
    const question = await Question.create({ levelId, topicId, questionText, options, correctAnswer, explanation, points, order });
    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAllQuestions = async (req, res) => {
  try {
    await Question.updateMany({ levelId: req.params.levelId }, { isActive: false });
    res.json({ success: true, message: 'All questions for this level have been deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getQuestions, getQuestionsAdmin, addQuestion, updateQuestion, deleteQuestion, deleteAllQuestions };
