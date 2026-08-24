const { Chat, ChatMember, User, Message } = require('../models');

// GET /api/chats
const getChats = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const memberships = await ChatMember.findAll({ where: { userId: currentUserId } });
    const chats = [];

    for (const membership of memberships) {
      const chat = await Chat.findByPk(membership.chatId);
      if (!chat) continue;

      let chatName = chat.name;
      let chatAvatar = chat.avatar;
      let otherMember = null;
      let isOnline = false;

      // In direct chats, resolve other participant's profile
      const allMembers = await ChatMember.findAll({ where: { chatId: chat.id } });
      const otherMembership = allMembers.find((m) => m.userId !== currentUserId);

      if (otherMembership) {
        const otherUser = await User.findByPk(otherMembership.userId);
        if (otherUser) {
          chatName = otherUser.displayName || otherUser.username;
          chatAvatar = otherUser.avatar;
          isOnline = otherUser.isOnline;
          otherMember = {
            id: otherUser.id,
            username: otherUser.username,
            displayName: otherUser.displayName || otherUser.username,
            avatar: otherUser.avatar,
            isOnline: otherUser.isOnline,
            lastSeen: otherUser.lastSeen,
          };
        }
      }

      // Fetch latest message
      const messages = await Message.findAll({ where: { chatId: chat.id }, limit: 1 });
      const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

      chats.push({
        id: chat.id,
        name: chatName,
        type: 'direct',
        avatar: chatAvatar,
        isPrivate: chat.isPrivate,
        disappearingTimer: chat.disappearingTimer,
        adminId: chat.adminId,
        unreadCount: membership.unreadCount,
        lastReadAt: membership.lastReadAt,
        isMuted: membership.isMuted,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt,
        otherMember,
        isOnline,
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              content: latestMessage.content,
              messageType: latestMessage.messageType,
              createdAt: latestMessage.createdAt,
              senderId: latestMessage.senderId,
              isDeleted: latestMessage.isDeleted,
              status: latestMessage.status,
            }
          : null,
      });
    }

    // Sort by last message timestamp
    chats.sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));

    return res.status(200).json({
      success: true,
      count: chats.length,
      chats,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/chats/:chatId
const getChatById = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    const membership = await ChatMember.findOne({ where: { chatId, userId: currentUserId } });
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this conversation.',
      });
    }

    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/chats (One-to-One direct conversation only)
const createChat = async (req, res, next) => {
  try {
    const { recipientId, isPrivate = false, disappearingTimer = 0 } = req.body;
    const currentUserId = req.user.id;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required to start a direct chat.',
      });
    }

    if (recipientId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot start a conversation with yourself.',
      });
    }

    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user does not exist.',
      });
    }

    // Check if direct conversation already exists between these 2 users
    const myMemberships = await ChatMember.findAll({ where: { userId: currentUserId } });
    for (const m of myMemberships) {
      const existingOther = await ChatMember.findOne({ where: { chatId: m.chatId, userId: recipientId } });
      if (existingOther) {
        const existingChat = await Chat.findByPk(m.chatId);
        if (existingChat && existingChat.type === 'direct') {
          return res.status(200).json({
            success: true,
            message: 'Conversation already exists.',
            chat: existingChat,
            isExisting: true,
          });
        }
      }
    }

    // Create new direct conversation
    const chat = await Chat.create({
      name: `${recipient.displayName || recipient.username}`,
      type: 'direct',
      avatar: recipient.avatar,
      isPrivate: Boolean(isPrivate),
      disappearingTimer: Number(disappearingTimer || 0),
      adminId: currentUserId,
    });

    // Add both members
    await ChatMember.create({
      chatId: chat.id,
      userId: currentUserId,
      role: 'admin',
    });

    await ChatMember.create({
      chatId: chat.id,
      userId: recipientId,
      role: 'member',
    });

    return res.status(201).json({
      success: true,
      message: 'Direct conversation created successfully.',
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/chats/:chatId
const deleteChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    const membership = await ChatMember.findOne({ where: { chatId, userId: currentUserId } });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this chat.' });
    }

    await Chat.deleteChat(chatId);

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully.',
      chatId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChats,
  getChatById,
  createChat,
  deleteChat,
};
