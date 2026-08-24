const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  deleteMessage,
  markAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', sendMessage);
router.get('/:chatId', getMessages);
router.delete('/:messageId', deleteMessage);
router.post('/read', markAsRead);

module.exports = router;
