const express = require('express');
const router = express.Router();
const { getChats, getChatById, createChat, deleteChat } = require('../controllers/chatController');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getChats);
router.post('/', createChat);
router.get('/:chatId', getChatById);
router.delete('/:chatId', deleteChat);

// Nested message routes
router.get('/:chatId/messages', getMessages);
router.post('/:chatId/messages', sendMessage);

module.exports = router;
