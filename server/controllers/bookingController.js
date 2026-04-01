const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Level = require('../models/Level');
const Progress = require('../models/Progress');
const Topic = require('../models/Topic');

// POST /api/bookings
const bookSlot = async (req, res) => {
  try {
    const { slotId, topicId, levelId } = req.body;
    const studentId = req.user._id;

    // Check slot exists and has capacity
    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    if (slot.isFull) return res.status(400).json({ success: false, message: 'Slot is full' });

    // Check if level is unlocked for student
    const level = await Level.findById(levelId);
    if (!level) return res.status(404).json({ success: false, message: 'Level not found' });

    const progress = await Progress.findOne({ studentId, topicId });
    if (progress && progress.levelsCompleted.includes(levelId)) {
      return res.status(400).json({ success: false, message: 'You have already completed this level. Retakes are not allowed.' });
    }

    if (level.levelNumber > 1) {
      const completed = progress ? progress.levelsCompleted.length : 0;
      if (completed < level.levelNumber - 1) {
        return res.status(403).json({ success: false, message: 'Complete previous levels first' });
      }
    }

    // Check duplicate booking for same slot
    const existingBooking = await Booking.findOne({ studentId, slotId });
    if (existingBooking) return res.status(400).json({ success: false, message: 'Already booked this slot' });

    const booking = await Booking.create({ studentId, slotId, topicId, levelId, isPresent: false });

    // Add student to slot
    await Slot.findByIdAndUpdate(slotId, { $addToSet: { bookedStudents: studentId } });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/my
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Fetch bookings and populate related data
    const bookings = await Booking.find({ studentId: userId })
      .populate('slotId')
      .populate('topicId', 'topicName icon color description')
      .populate('levelId', 'levelNumber difficulty title passingScore')
      .sort({ createdAt: -1 });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Filter out missed tests: past date or past time today, and still 'confirmed'
    const filteredBookings = bookings.filter(b => {
      const slot = b.slotId;
      if (!slot) return false;

      // Filter out completed, cancelled (history) - User wants completed to disappear
      if (['completed', 'cancelled'].includes(b.bookingStatus)) return false;

      // Keep if in the future
      if (slot.date > todayStr) return true;

      // If today, check if it has ended
      if (slot.date === todayStr) {
        return slot.endTime > currentTime;
      }

      // If past date and not completed/cancelled, it's missed - hide it
      return false;
    });
      
    res.json({ success: true, bookings: filteredBookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/active
const getActiveBooking = async (req, res) => {
  try {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const currentTime = now.toTimeString().slice(0, 5);

    console.log(`Checking active bookings for user ${req.user._id}. Today: ${todayStr}, Time: ${currentTime}`);

    const bookings = await Booking.find({ studentId: req.user._id, bookingStatus: 'confirmed' })
      .populate('slotId')
      .populate('topicId', 'topicName icon color')
      .populate('levelId', 'levelNumber difficulty title timeLimit passingScore');

    const activeBooking = bookings.find(b => {
      const slot = b.slotId;
      if (!slot) return false;
      const isToday = slot.date === todayStr;
      const isWithinTime = currentTime >= slot.startTime && currentTime <= slot.endTime;
      return isToday && isWithinTime && b.isPresent === true;
    });

    if (activeBooking) {
      const slot = activeBooking.slotId;
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const slotEndDate = new Date(now);
      slotEndDate.setHours(endHour, endMin, 0, 0);

      const secondsRemaining = Math.floor((slotEndDate.getTime() - now.getTime()) / 1000);
      const dynamicLimit = Math.min(activeBooking.levelId.timeLimit, secondsRemaining);
      
      const responseBooking = {
        ...activeBooking.toObject(),
        dynamicTimeLimit: Math.max(0, dynamicLimit),
        originalTimeLimit: activeBooking.levelId.timeLimit
      };

      console.log(`Found active booking: ${activeBooking._id}. Dynamic Limit: ${dynamicLimit}s`);
      return res.json({ success: true, activeBooking: responseBooking });
    }

    console.log(`No active booking found for user ${req.user._id}.`);
    res.json({ success: true, activeBooking: null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/bookings/:id
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    booking.bookingStatus = 'cancelled';
    await booking.save();
    await Slot.findByIdAndUpdate(booking.slotId, { $pull: { bookedStudents: req.user._id } });
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { bookSlot, getMyBookings, getActiveBooking, cancelBooking };
