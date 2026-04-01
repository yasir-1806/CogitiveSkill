const express = require('express');
const router = express.Router();
const { bookSlot, getMyBookings, getActiveBooking, cancelBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/', protect, bookSlot);
router.get('/my', protect, getMyBookings);
router.get('/active', protect, getActiveBooking);
router.delete('/:id', protect, cancelBooking);

module.exports = router;
