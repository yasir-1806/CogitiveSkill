const express = require('express');
const router = express.Router();
const { startTest, submitTest, getMyResults, getMyProgress, getLeaderboard } = require('../controllers/testController');
const { protect } = require('../middleware/auth');

router.post('/start', protect, startTest);
router.post('/submit', protect, submitTest);
router.get('/results', protect, getMyResults);
router.get('/progress', protect, getMyProgress);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
