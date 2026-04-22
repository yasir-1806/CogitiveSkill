const User = require('../models/User');
const TestResult = require('../models/TestResult');
const Booking = require('../models/Booking');
const Topic = require('../models/Topic');
const Level = require('../models/Level');
const Progress = require('../models/Progress');

// GET /api/admin/students
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isActive: true })
      .select('-password')
      .populate('registeredTopics', 'topicName icon')
      .sort({ createdAt: -1 });
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/students/:id
const deleteStudent = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Student deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeTopics = await Topic.find({ isActive: true }).select('_id');
    const activeTopicIds = activeTopics.map(t => t._id);
    const totalTopics = activeTopics.length;
    const totalLevels = await Level.countDocuments({ isActive: true, topicId: { $in: activeTopicIds } });
    const totalBookings = await Booking.countDocuments();
    const totalTests = await TestResult.countDocuments();
    const passedTests = await TestResult.countDocuments({ completionStatus: 'passed' });
    const avgScoreAgg = await TestResult.aggregate([{ $group: { _id: null, avg: { $avg: '$percentage' } } }]);
    const avgScore = avgScoreAgg.length ? Math.round(avgScoreAgg[0].avg) : 0;

    // Topic-wise performance
    const topicPerformance = await TestResult.aggregate([
      { $group: { _id: '$topicId', avgScore: { $avg: '$percentage' }, count: { $sum: 1 } } },
      { $lookup: { from: 'topics', localField: '_id', foreignField: '_id', as: 'topic' } },
      { $unwind: '$topic' },
      { $project: { topicName: '$topic.topicName', avgScore: { $round: ['$avgScore', 1] }, count: 1 } },
    ]);

    // Daily registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, role: 'student' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Level completion rate
    const levelCompletion = await TestResult.aggregate([
      { $group: { _id: '$completionStatus', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: { totalStudents, totalTopics, totalLevels, totalBookings, totalTests, passedTests, avgScore },
      topicPerformance,
      dailyRegistrations,
      levelCompletion,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/student-performance/:id
const getStudentPerformance = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const results = await TestResult.find({ studentId: req.params.id })
      .populate('topicId', 'topicName icon')
      .populate('levelId', 'levelNumber difficulty')
      .sort({ createdAt: -1 });

    const progress = await Progress.find({ studentId: req.params.id })
      .populate('topicId', 'topicName');

    res.json({ success: true, student, results, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/slots/:slotId/bookings
const getSlotBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ slotId: req.params.slotId })
      .populate('studentId', 'name email')
      .populate('topicId', 'topicName')
      .populate('levelId', 'title difficulty');
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/bookings/:id/attendance
const toggleStudentAttendance = async (req, res) => {
  try {
    const { isPresent } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    booking.isPresent = isPresent;
    await booking.save();
    
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/reset-password (Public with Master Key)
const resetAdminPassword = async (req, res) => {
  try {
    const { email, masterKey, newPassword } = req.body;
    
    // Check if master key matches
    if (!process.env.MASTER_ADMIN_KEY || masterKey !== process.env.MASTER_ADMIN_KEY) {
      return res.status(401).json({ success: false, message: 'Invalid master verification key' });
    }

    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin account not found' });

    admin.password = newPassword;
    await admin.save();

    res.json({ success: true, message: 'Admin password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/create-admin (Protected: Admin Only)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'User already exists' });

    const newAdmin = await User.create({
      name, email, password, role: 'admin'
    });

    res.status(201).json({ success: true, admin: newAdmin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/list-admins (Protected: Admin Only)
const listAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  getAllStudents, 
  deleteStudent, 
  getAnalytics, 
  getStudentPerformance, 
  getSlotBookings, 
  toggleStudentAttendance,
  resetAdminPassword,
  createAdmin,
  listAdmins
};
