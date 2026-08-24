const { Message, ChatMember, Chat, User } = require('../models');
const MessageService = require('../services/messageService');

const getDisappearingDurationSeconds = (settingVal) => {
  switch (settingVal) {
    case 'view': return 3;
    case '10s': return 10;
    case '30s': return 30;
    case '1m': return 60;
    case '24h': return 86400;
    default: return 0;
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;
    const { limit = 100 } = req.query;

    const membership = await ChatMember.findOne({ where: { chatId, userId: currentUserId } });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view messages in this chat.' });
    }

    const messages = await Message.findAll({ where: { chatId }, limit: parseInt(limit, 10) });

    const fullMessages = [];
    for (const msg of messages) {
      const sender = await User.findByPk(msg.senderId);
      fullMessages.push({
        ...msg,
        sender: sender ? { id: sender.id, username: sender.username, avatar: sender.avatar, isOnline: sender.isOnline } : null,
      });
    }

    if (membership.unreadCount > 0) {
      await membership.update({ unreadCount: 0, lastReadAt: new Date() });
    }

    return res.status(200).json({
      success: true,
      count: fullMessages.length,
      messages: fullMessages,
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { chatId, content, messageType = 'text', fileUrl, fileName, fileSize, disappearingDuration } = req.body;
    const senderId = req.user.id;

    if (!chatId) {
      return res.status(400).json({ success: false, message: 'Chat ID is required.' });
    }

    if (!content && !fileUrl) {
      return res.status(400).json({ success: false, message: 'Message content or attachment is required.' });
    }

    const membership = await ChatMember.findOne({ where: { chatId, userId: senderId } });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this chat.' });
    }

    const senderSetting = req.user.settings?.message_delete_after_viewing;
    const senderDuration = getDisappearingDurationSeconds(senderSetting);
    const finalDisappearingDuration = disappearingDuration > 0 ? disappearingDuration : senderDuration;

    const message = await MessageService.createMessage({
      chatId,
      senderId,
      content: content || '',
      messageType,
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      disappearingDuration: finalDisappearingDuration,
    });

    const otherMembers = await ChatMember.findAll({ where: { chatId } });
    for (const m of otherMembers) {
      if (m.userId !== senderId) {
        await m.increment('unreadCount', { by: 1 });
      }
    }

    return res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (message.senderId !== currentUserId) {
      const chat = await Chat.findByPk(message.chatId);
      if (!chat || chat.adminId !== currentUserId) {
        return res.status(403).json({ success: false, message: 'You are not authorized to delete this message.' });
      }
    }

    await message.update({
      isDeleted: true,
      content: 'This message was deleted.',
      fileUrl: '',
    });

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully.',
      deletedMessageId: messageId,
      chatId: message.chatId,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.body;
    const currentUserId = req.user.id;

    if (!chatId) {
      return res.status(400).json({ success: false, message: 'Chat ID is required.' });
    }

    const membership = await ChatMember.findOne({ where: { chatId, userId: currentUserId } });
    if (membership) {
      await membership.update({ unreadCount: 0, lastReadAt: new Date() });
    }

    return res.status(200).json({ success: true, message: 'Messages marked as read.', chatId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage,
  markAsRead,
};
