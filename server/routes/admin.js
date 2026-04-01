const express = require('express');
const router = express.Router();
const { 
  getAllStudents, 
  deleteStudent, 
  getAnalytics, 
  getStudentPerformance,
  getSlotBookings,
  toggleStudentAttendance,
  resetAdminPassword,
  createAdmin,
  listAdmins
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');

router.get('/students', protect, adminOnly, getAllStudents);
router.delete('/students/:id', protect, adminOnly, deleteStudent);
router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/students/:id/performance', protect, adminOnly, getStudentPerformance);

// Attendance routes
router.get('/slots/:slotId/bookings', protect, adminOnly, getSlotBookings);
router.put('/bookings/:id/attendance', protect, adminOnly, toggleStudentAttendance);

// Admin management
router.post('/reset-password', resetAdminPassword);
router.post('/create-admin', protect, adminOnly, createAdmin);
router.get('/list-admins', protect, adminOnly, listAdmins);

module.exports = router;
