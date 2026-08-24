const bcrypt = require('bcryptjs');
const { User, Chat, ChatMember, Message } = require('../models');
const { isValidEmail, isValidUsername, isValidPassword } = require('../utils/validation');

const getUsers = async (req, res, next) => {
  try {
    const search = req.query.search || req.query.q || '';
    const currentUserId = req.user?.id;

    const users = await User.findAll({
      where: {
        excludeId: currentUserId,
        search,
      },
      limit: 50,
    });

    const safeUsers = users.map((u) => u.toSafeObject());

    return res.status(200).json({
      success: true,
      count: safeUsers.length,
      users: safeUsers,
    });
  } catch (error) {
    next(error);
  }
};

const getUserByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User @${username} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatar,
        statusMessage: user.statusMessage,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { avatar, statusMessage, settings, displayName } = req.body;
    const user = req.user;

    const updateFields = {};
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (displayName !== undefined) updateFields.displayName = displayName;
    if (statusMessage !== undefined) updateFields.statusMessage = statusMessage;
    if (settings !== undefined) {
      updateFields.settings = {
        ...user.settings,
        ...settings,
      };
    }

    await user.update(updateFields);

    const safeUser = user.toSafeObject();
    safeUser.hasPin = !!user.pinCode;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/me/username
const updateUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    const currentUserId = req.user.id;

    if (!username || !isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters (letters, numbers, underscores).',
      });
    }

    const trimmed = username.trim();

    if (trimmed.toLowerCase() === req.user.username.toLowerCase().trim()) {
      return res.status(200).json({
        success: true,
        message: 'This is already your current username.',
        user: req.user.toSafeObject(),
      });
    }

    const existing = await User.findOne({ where: { username: trimmed } });
    if (existing && existing.id !== currentUserId) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken.',
      });
    }

    await req.user.update({ username: trimmed });

    return res.status(200).json({
      success: true,
      message: 'Username updated successfully.',
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/me/email
const updateEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const currentUserId = req.user.id;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    const trimmed = email.toLowerCase().trim();

    if (trimmed === req.user.email.toLowerCase().trim()) {
      return res.status(200).json({
        success: true,
        message: 'This is already your current email.',
        user: req.user.toSafeObject(),
      });
    }

    const existing = await User.findOne({ where: { email: trimmed } });
    if (existing && existing.id !== currentUserId) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.',
      });
    }

    await req.user.update({ email: trimmed });

    return res.status(200).json({
      success: true,
      message: 'Email updated successfully.',
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/me/password
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.',
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/settings or /api/users/settings
const getSettings = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    return res.status(200).json({
      success: true,
      settings: user.settings || {
        soundEnabled: true,
        desktopNotifications: true,
        theme: 'dark',
        message_delete_after_viewing: 'off',
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/settings or /api/users/settings
const updateSettings = async (req, res, next) => {
  try {
    const user = req.user;
    const incomingSettings = req.body;

    const allowedDisappearingOptions = ['off', 'view', '10s', '30s', '1m', '24h'];
    if (
      incomingSettings.message_delete_after_viewing &&
      !allowedDisappearingOptions.includes(incomingSettings.message_delete_after_viewing)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid option for message_delete_after_viewing. Allowed: ${allowedDisappearingOptions.join(', ')}`,
      });
    }

    const merged = {
      ...user.settings,
      ...incomingSettings,
    };

    await user.update({ settings: merged });

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      settings: merged,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/memories or /api/users/memories
const getMemories = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const memories = user.savedMemories || [];
    return res.status(200).json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/memories or /api/users/memories
const saveMemory = async (req, res, next) => {
  try {
    const { messageId, content, mediaUrl, mediaType, senderName, timestamp } = req.body;
    const user = req.user;

    const newMemory = {
      id: 'mem_' + Date.now().toString(36),
      messageId: messageId || null,
      content: content || '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || 'text',
      senderName: senderName || 'Unknown',
      savedAt: new Date(),
      timestamp: timestamp || new Date(),
    };

    const currentMemories = user.savedMemories || [];
    const updatedMemories = [newMemory, ...currentMemories];

    await user.update({ savedMemories: updatedMemories });

    return res.status(201).json({
      success: true,
      message: 'Saved to Memories successfully.',
      memory: newMemory,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/memories/:memoryId
const deleteMemory = async (req, res, next) => {
  try {
    const { memoryId, id } = req.params;
    const targetId = memoryId || id;
    const user = req.user;

    const currentMemories = user.savedMemories || [];
    const updatedMemories = currentMemories.filter((m) => m.id !== targetId);

    await user.update({ savedMemories: updatedMemories });

    return res.status(200).json({
      success: true,
      message: 'Removed from Memories.',
      memoryId: targetId,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/me/export
const exportData = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const user = await User.findByPk(currentUserId);

    const memberships = await ChatMember.findAll({ where: { userId: currentUserId } });
    const userChats = [];

    for (const m of memberships) {
      const chat = await Chat.findByPk(m.chatId);
      if (chat) {
        const msgs = await Message.findAll({ where: { chatId: chat.id } });
        userChats.push({
          chatId: chat.id,
          type: chat.type,
          isPrivate: chat.isPrivate,
          createdAt: chat.createdAt,
          messages: msgs.map((msg) => ({
            id: msg.id,
            isMyMessage: msg.senderId === currentUserId,
            content: msg.content,
            messageType: msg.messageType,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            createdAt: msg.createdAt,
          })),
        });
      }
    }

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      service: 'VR Connect Data Archive',
      userProfile: {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        email: user.email,
        avatar: user.avatar,
        statusMessage: user.statusMessage,
        createdAt: user.createdAt,
      },
      settings: user.settings,
      savedMemories: user.savedMemories || [],
      conversations: userChats,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=vr_connect_data_${user.username}.json`);

    return res.status(200).json(exportPayload);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/me
const deleteAccount = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE' && req.query.confirm !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'Please type DELETE to confirm permanent account deletion.',
      });
    }

    await User.deleteUser(currentUserId);

    return res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
