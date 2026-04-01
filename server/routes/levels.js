const express = require('express');
const router = express.Router();
const { getLevelsByTopic, createLevel, updateLevel, deleteLevel } = require('../controllers/levelController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');

router.get('/:topicId', protect, getLevelsByTopic);
router.post('/', protect, adminOnly, createLevel);
router.put('/:id', protect, adminOnly, updateLevel);
router.delete('/:id', protect, adminOnly, deleteLevel);

module.exports = router;
