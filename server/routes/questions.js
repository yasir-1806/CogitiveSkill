const express = require('express');
const router = express.Router();
const { getQuestions, getQuestionsAdmin, addQuestion, updateQuestion, deleteQuestion, deleteAllQuestions } = require('../controllers/questionController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');

router.get('/:levelId', protect, getQuestions);
router.get('/admin/:levelId', protect, adminOnly, getQuestionsAdmin);
router.post('/', protect, adminOnly, addQuestion);
router.put('/:id', protect, adminOnly, updateQuestion);
router.delete('/:id', protect, adminOnly, deleteQuestion);
router.delete('/level/:levelId', protect, adminOnly, deleteAllQuestions);

module.exports = router;
