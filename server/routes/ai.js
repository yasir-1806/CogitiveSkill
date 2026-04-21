const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');

// Apply protection to all AI routes
router.use(protect);

// Admin only: Generate questions
router.post('/generate-questions', adminOnly, aiController.generateQuestions);

// Any authenticated user: Get insights for their own results
router.post('/performance-insights', aiController.getPerformanceInsights);

// Diagnostic test route (Public)
router.get('/test', (req, res) => res.json({ success: true, message: 'AI routes are working correctly' }));

module.exports = router;
