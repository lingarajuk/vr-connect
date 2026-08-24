const { Message, Chat, User } = require('../models');
const fs = require('fs');
const path = require('path');

class MessageService {
  static async createMessage({
    chatId,
    senderId,
    content,
    messageType = 'text',
    fileUrl = '',
    fileName = '',
    fileSize = 0,
    disappearingDuration = 0,
  }) {
    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      throw new Error('Chat conversation not found');
    }

    const effectiveDuration = disappearingDuration > 0 ? disappearingDuration : chat.disappearingTimer;
    let isDisappearing = false;
    let expiresAt = null;

    if (effectiveDuration > 0) {
      isDisappearing = true;
      expiresAt = new Date(Date.now() + effectiveDuration * 1000);
    }

    const message = await Message.create({
      chatId,
      senderId,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      isDisappearing,
      disappearingDuration: effectiveDuration,
      expiresAt,
      status: 'sent',
      readBy: [senderId],
    });

    await chat.update({ lastMessageAt: new Date() });

    // Attach sender details
    const sender = await User.findByPk(senderId);
    const fullMessage = {
      ...message,
      sender: sender ? { id: sender.id, username: sender.username, avatar: sender.avatar, isOnline: sender.isOnline } : null,
    };

    return fullMessage;
  }

  static async cleanExpiredDisappearingMessages(io) {
    try {
      const expiredMessages = await Message.findAll({
        where: { isDisappearingExpired: true },
      });

      if (expiredMessages.length > 0) {
        for (const msg of expiredMessages) {
          if (msg.fileUrl) {
            const filename = path.basename(msg.fileUrl);
            const filePath = path.resolve(__dirname, '../../uploads', filename);
            if (fs.existsSync(filePath)) {
              fs.unlink(filePath, (err) => {
                if (err) console.error('[Disappearing] File unlink error:', err.message);
              });
            }
          }

          await msg.update({
            isDeleted: true,
            content: 'This message has expired and disappeared.',
            fileUrl: '',
          });

          if (io) {
            io.to(msg.chatId).emit('message:deleted', {
              messageId: msg.id,
              chatId: msg.chatId,
              isExpired: true,
            });
          }
        }
      }
    } catch (error) {
      console.error('[Disappearing Cleaner] Error during cleanup:', error.message);
    }
  }

  static startCleanupJob(io, intervalMs = 5000) {
    const timer = setInterval(() => {
      MessageService.cleanExpiredDisappearingMessages(io);
    }, intervalMs);
    return timer;
  }
}

module.exports = MessageService;
