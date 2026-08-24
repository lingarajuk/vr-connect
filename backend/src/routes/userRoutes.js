const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserByUsername,
  updateProfile,
  updateUsername,
  updateEmail,
  updatePassword,
  getSettings,
  updateSettings,
  getMemories,
  saveMemory,
  deleteMemory,
  exportData,
  deleteAccount,
} = require('../controllers/userController');
const { getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, getUsers);
router.get('/me', protect, getMe);
router.patch('/me/username', protect, updateUsername);
router.patch('/me/email', protect, updateEmail);
router.patch('/me/password', protect, updatePassword);
router.get('/me/export', protect, exportData);
router.get('/data/export', protect, exportData);
router.delete('/me', protect, deleteAccount);

router.get('/settings', protect, getSettings);
router.patch('/settings', protect, updateSettings);

router.get('/memories', protect, getMemories);
router.post('/memories', protect, saveMemory);
router.delete('/memories/:memoryId', protect, deleteMemory);

router.get('/', protect, getUsers);
router.put('/profile', protect, updateProfile);
router.get('/:username', protect, getUserByUsername);

module.exports = router;
