const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email?.toString().trim().toLowerCase();
    if (!name || !normalizedEmail || !password) return res.status(400).json({ success: false, message: 'All fields required' });

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email: normalizedEmail, password, role: role === 'admin' ? 'admin' : 'student' });

    // Initialize leaderboard entry for student
    if (user.role === 'student') {
      await Leaderboard.create({ studentId: user._id });
    }

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toString().trim().toLowerCase();
    if (!normalizedEmail || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, message: 'Use Google sign-in for this account' });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, badges: user.badges, registeredTopics: user.registeredTopics },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const { OAuth2Client } = require('google-auth-library');

const getGoogleAudiences = () => {
  const primary = process.env.GOOGLE_CLIENT_ID?.trim();
  const additional = (process.env.GOOGLE_CLIENT_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return [primary, ...additional].filter(Boolean);
};

const getGoogleClient = () => {
  const audiences = getGoogleAudiences();
  if (!audiences.length) return null;
  return new OAuth2Client(audiences[0]);
};

// POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential required' });
    }

    const audiences = getGoogleAudiences();
    if (!audiences.length) {
      console.error('Google auth misconfigured: GOOGLE_CLIENT_ID missing');
      return res.status(500).json({ success: false, message: 'Google auth is not configured on server' });
    }

    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });

    const payload = ticket.getPayload();
    const email = payload?.email?.toString().trim().toLowerCase();
    const sub = payload?.sub;

    if (!email || !sub) {
      return res.status(400).json({ success: false, message: 'Invalid Google profile data' });
    }

    if (payload?.email_verified === false) {
      return res.status(401).json({ success: false, message: 'Google email is not verified' });
    }

    const name = payload?.name || email.split('@')[0];
    const picture = payload?.picture || '';

    let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });

    if (user) {
      if (!user.googleId) user.googleId = sub;
      if (!user.avatar && picture) user.avatar = picture;
      if (!user.name && name) user.name = name;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId: sub,
        avatar: picture,
        role: 'student',
      });
      await Leaderboard.create({ studentId: user._id });
    }

    return res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        badges: user.badges,
        avatar: user.avatar,
        registeredTopics: user.registeredTopics,
      },
    });
  } catch (err) {
    console.error('Google Login Error:', err?.message || err);

    const msg = err?.message || '';
    if (msg.toLowerCase().includes('audience')) {
      return res.status(401).json({
        success: false,
        message: 'Google client mismatch: check VITE_GOOGLE_CLIENT_ID and server GOOGLE_CLIENT_ID',
      });
    }

    if (msg.toLowerCase().includes('token used too early') || msg.toLowerCase().includes('token used too late') || msg.toLowerCase().includes('expired')) {
      return res.status(401).json({ success: false, message: 'Google token expired, try again' });
    }

    return res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
};

module.exports = { register, login, getProfile, googleLogin };

