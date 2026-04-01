const express = require('express');
const router = express.Router();
const { getSlots, createSlot, updateSlot, deleteSlot } = require('../controllers/slotController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');

router.get('/', protect, getSlots);
router.post('/', protect, adminOnly, createSlot);
router.put('/:id', protect, adminOnly, updateSlot);
router.delete('/:id', protect, adminOnly, deleteSlot);

module.exports = router;
