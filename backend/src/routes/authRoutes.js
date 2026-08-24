const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  setupPin,
  verifyPin,
  getSessions,
  logoutAll,
} = require('../controllers/authController');
const { initiateGoogleAuth, googleCallback, getLinkedAccounts } = require('../controllers/oauthController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh', protect, refreshToken);
router.get('/me', protect, getMe);
router.get('/sessions', protect, getSessions);
router.post('/logout-all', protect, logoutAll);
router.get('/linked-accounts', protect, getLinkedAccounts);
router.post('/pin', protect, setupPin);
router.post('/verify-pin', protect, verifyPin);

// Google OAuth 2.0
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', googleCallback);

module.exports = router;
