const express = require('express');
const router = express.Router();
const { getTopics, createTopic, updateTopic, deleteTopic, registerTopic } = require('../controllers/topicController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');

router.get('/', protect, getTopics);
router.post('/:id/register', protect, registerTopic);
router.post('/', protect, adminOnly, createTopic);
router.put('/:id', protect, adminOnly, updateTopic);
router.delete('/:id', protect, adminOnly, deleteTopic);

module.exports = router;
