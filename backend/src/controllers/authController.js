const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken, verifyToken } = require('../utils/jwt');
const { isValidEmail, isValidUsername, isValidPassword, isValidPin } = require('../utils/validation');

const register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password.',
      });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters (letters, numbers, underscore).',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username is already taken. Please choose another.',
      });
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username.trim())}`;

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      displayName: displayName || username.trim(),
      avatar: defaultAvatar,
      isOnline: true,
      lastSeen: new Date(),
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { emailOrUsername, email, username, password } = req.body;
    const identifier = emailOrUsername || email || username;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password.',
      });
    }

    const user = await User.findOne({
      where: {
        email: identifier,
        username: identifier,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const userAgent = req.headers['user-agent'] || 'Web Browser (Windows)';
    const ip = req.ip || '127.0.0.1';

    const currentSession = {
      id: 'sess_' + Date.now().toString(36),
      device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser (Windows)',
      ip,
      lastActive: new Date(),
      loginDate: new Date(),
      isCurrent: true,
    };

    const existingSessions = (user.sessions || []).map((s) => ({ ...s, isCurrent: false }));
    const updatedSessions = [currentSession, ...existingSessions.slice(0, 4)];

    await user.update({
      isOnline: true,
      lastSeen: new Date(),
      sessions: updatedSessions,
    });

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await req.user.update({
        isOnline: false,
        lastSeen: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const newToken = generateToken(user);
    return res.status(200).json({
      success: true,
      token: newToken,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const safeUser = user.toSafeObject();
    safeUser.hasPin = !!user.pinCode;

    return res.status(200).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

const setupPin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin || !isValidPin(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 numeric digits.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    await req.user.update({
      pinCode: hashedPin,
      settings: {
        ...req.user.settings,
        appLockEnabled: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: '4-digit security PIN configured successfully.',
      hasPin: true,
    });
  } catch (error) {
    next(error);
  }
};

const verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required.',
      });
    }

    const isMatch = await req.user.comparePin(pin);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect security PIN. Access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'PIN verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/sessions
const getSessions = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const sessions = user?.sessions || [
      {
        id: 'sess_default',
        device: 'Current Web Browser (Windows 11)',
        ip: '127.0.0.1',
        lastActive: new Date(),
        loginDate: new Date(),
        isCurrent: true,
      },
    ];

    return res.status(200).json({
      success: true,
      sessions,
      currentDevice: 'Current Web Browser (Windows 11)',
      lastActive: user.lastSeen,
      loginDate: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout-all
const logoutAll = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const currentSession = {
      id: 'sess_' + Date.now().toString(36),
      device: 'Current Web Browser (Windows 11)',
      ip: '127.0.0.1',
      lastActive: new Date(),
      loginDate: new Date(),
      isCurrent: true,
    };

    await user.update({
      sessions: [currentSession],
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out of all other devices successfully.',
      sessions: [currentSession],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  setupPin,
  verifyPin,
  getSessions,
  logoutAll,
};
