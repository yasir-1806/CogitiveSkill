const Slot = require('../models/Slot');

const getSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const query = { isActive: true };
    if (date) query.date = date;
    
    let slots = await Slot.find(query).sort('date startTime').populate('bookedStudents', 'name email');

    const now = new Date();
    // UTC to IST offset is 5.5 hours. now.getTime() is UTC.
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const todayStr = istDate.toISOString().split('T')[0]; 
    const currentTime = istDate.toISOString().split('T')[1].slice(0, 5); // "HH:MM" in IST

    // Filter slots based on role and time
    slots = slots.filter(slot => {
      // Rule for both students and admins: Hide today's slots if they have already ended
      if (slot.date === todayStr && slot.endTime <= currentTime) {
        return false;
      }

      // Additional strict rolling visibility rules for students
      if (req.user && req.user.role === 'student') {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
        
        const isAfter8PM = currentTime >= "20:00";
        const isBefore7PM = currentTime < "19:00";

        // 1. Hide if full
        if (slot.bookedStudents.length >= slot.maxStudents) return false;

        // Today's Slots: Visible only before 7:00 PM
        if (slot.date === todayStr) {
          if (!isBefore7PM) return false;
          return true;
        }
        
        // Tomorrow's Slots: Visible only after 8:00 PM today
        if (slot.date === tomorrowStr) {
          return isAfter8PM;
        }

        // Hide all other dates (past or beyond tomorrow)
        return false;
      }

      // Admins see all other active slots (future dates and future times today)
      return true;
    });

    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createSlot = async (req, res) => {
  try {
    const { date, startTime, endTime, slotLabel, maxStudents } = req.body;
    const slot = await Slot.create({ date, startTime, endTime, slotLabel, maxStudents });
    res.status(201).json({ success: true, slot });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSlot = async (req, res) => {
  try {
    const slot = await Slot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, slot });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSlot = async (req, res) => {
  try {
    await Slot.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Slot removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSlots, createSlot, updateSlot, deleteSlot };
