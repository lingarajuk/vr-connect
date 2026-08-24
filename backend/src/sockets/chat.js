const { verifyToken } = require('../utils/jwt');
const { User, ChatMember, Message } = require('../models');
const MessageService = require('../services/messageService');

// Map to track active user socket connections: userId -> Set of socket IDs
const onlineUsers = new Map();

const getDisappearingDurationSeconds = (settingVal) => {
  switch (settingVal) {
    case 'view': return 3; // disappears 3s after opening
    case '10s': return 10;
    case '30s': return 30;
    case '1m': return 60;
    case '24h': return 86400;
    default: return 0;
  }
};

const initializeChatSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    const userId = user.id;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      await User.update({ isOnline: true, lastSeen: new Date() }, { where: { id: userId } });
      io.emit('user:online', { userId, isOnline: true });
    }
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user:${userId}`);

    // Join conversation room
    socket.on('join:chat', async ({ chatId }) => {
      if (chatId) socket.join(chatId);
    });

    // Leave conversation room
    socket.on('leave:chat', ({ chatId }) => {
      if (chatId) socket.leave(chatId);
    });

    // Send Message
    socket.on('message:send', async (payload, callback) => {
      try {
        const { chatId, conversationId, content, messageType = 'text', fileUrl, fileName, fileSize, disappearingDuration } = payload;
        const targetChatId = chatId || conversationId;

        const membership = await ChatMember.findOne({ where: { chatId: targetChatId, userId } });
        if (!membership) {
          if (callback) callback({ success: false, message: 'You are not a member of this conversation' });
          return;
        }

        const senderSetting = user.settings?.message_delete_after_viewing;
        const senderDuration = getDisappearingDurationSeconds(senderSetting);
        const finalDisappearingDuration = disappearingDuration > 0 ? disappearingDuration : senderDuration;

        const message = await MessageService.createMessage({
          chatId: targetChatId,
          senderId: userId,
          content: content || '',
          messageType,
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          fileSize: fileSize || 0,
          disappearingDuration: finalDisappearingDuration,
        });

        await ChatMember.increment('unreadCount', {
          by: 1,
          where: { chatId: targetChatId },
        });
        await ChatMember.update({ unreadCount: 0 }, { where: { chatId: targetChatId, userId } });

        io.to(targetChatId).emit('message:new', message);

        if (callback) callback({ success: true, message });
      } catch (error) {
        console.error('[Socket] message:send error:', error.message);
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // Message Delivered
    socket.on('message:delivered', async ({ messageId, chatId }) => {
      if (messageId) {
        await Message.update({ status: 'delivered' }, { where: { id: messageId, status: 'sent' } });
        io.to(chatId).emit('message:delivered', { messageId, chatId, userId });
      }
    });

    // Message Read (calculates expiration timer on viewing)
    socket.on('message:read', async ({ messageId, chatId }) => {
      try {
        if (chatId) {
          await ChatMember.update(
            { unreadCount: 0, lastReadAt: new Date() },
            { where: { chatId, userId } }
          );

          if (messageId) {
            const msg = await Message.findByPk(messageId);
            if (msg) {
              const currentReadBy = Array.isArray(msg.readBy) ? msg.readBy : [];
              const updates = {};
              if (!currentReadBy.includes(userId)) {
                updates.status = 'read';
                updates.readBy = [...currentReadBy, userId];
              }

              // Check if message should start disappearing countdown upon viewing
              if (!msg.expiresAt) {
                const sender = await User.findByPk(msg.senderId);
                const senderSetting = sender?.settings?.message_delete_after_viewing;
                const duration = getDisappearingDurationSeconds(senderSetting);

                if (duration > 0) {
                  updates.isDisappearing = true;
                  updates.disappearingDuration = duration;
                  updates.expiresAt = new Date(Date.now() + duration * 1000);
                }
              }

              if (Object.keys(updates).length > 0) {
                await msg.update(updates);
              }
            }
          }

          io.to(chatId).emit('message:read', { messageId, chatId, userId });
        }
      } catch (error) {
        console.error('[Socket] message:read error:', error.message);
      }
    });

    // Typing start
    socket.on('typing:start', ({ chatId }) => {
      if (chatId) {
        socket.to(chatId).emit('typing:start', {
          chatId,
          userId,
          username: user.username,
        });
      }
    });

    // Typing stop
    socket.on('typing:stop', ({ chatId }) => {
      if (chatId) {
        socket.to(chatId).emit('typing:stop', {
          chatId,
          userId,
          username: user.username,
        });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const now = new Date();
          await User.update({ isOnline: false, lastSeen: now }, { where: { id: userId } });
          io.emit('user:offline', { userId, isOnline: false, lastSeen: now });
        }
      }
    });
  });
};

module.exports = { initializeChatSocket };
