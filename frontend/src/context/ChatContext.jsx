import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import chatService from '../services/chat';
import messageService from '../services/messages';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socketService, socket } = useSocket();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { [chatId]: [username1, username2] }
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'direct' | 'groups' | 'vault'
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Load chat conversations
  const loadChats = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingChats(true);
    try {
      const data = await chatService.getChats();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Failed to load chats:', error.message);
    } finally {
      setIsLoadingChats(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Load messages when activeChat changes
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        // Join socket room
        socketService.joinChat(activeChat.id);

        const data = await messageService.getMessages(activeChat.id);
        setMessages(data.messages || []);

        // Mark as read
        await messageService.markAsRead(activeChat.id);
        socketService.markAsRead(activeChat.id);

        // Update local unread badge on chat item
        setChats((prev) =>
          prev.map((c) => (c.id === activeChat.id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (error) {
        console.error('Failed to load messages:', error.message);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();

    return () => {
      if (activeChat) {
        socketService.leaveChat(activeChat.id);
      }
    };
  }, [activeChat?.id]);

  // Socket event listeners for real-time messages & indicators
  useEffect(() => {
    if (!socket) return;

    // New incoming message
    const handleNewMessage = (newMessage) => {
      const currentActive = activeChatRef.current;

      // Update chat list latestMessage and lastMessageAt
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.id === newMessage.chatId) {
            const isCurrentActive = currentActive && currentActive.id === newMessage.chatId;
            return {
              ...chat,
              lastMessageAt: newMessage.createdAt,
              latestMessage: newMessage,
              unreadCount: isCurrentActive ? 0 : (chat.unreadCount || 0) + 1,
            };
          }
          return chat;
        }).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });

      // If this message belongs to the current open chat, append to stream
      if (currentActive && currentActive.id === newMessage.chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        // Mark read immediately if we are looking at this chat
        if (newMessage.senderId !== user?.id) {
          socketService.markAsRead(newMessage.chatId, newMessage.id);
        }
      }
    };

    // Message deleted / expired
    const handleMessageDeleted = ({ messageId, chatId, isExpired }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              isDeleted: true,
              content: isExpired
                ? 'This message has expired and disappeared.'
                : 'This message was deleted.',
              fileUrl: '',
            };
          }
          return msg;
        })
      );
    };

    // Message read receipt
    const handleMessageRead = ({ chatId, userId: readUserId }) => {
      if (readUserId !== user?.id) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.chatId === chatId && msg.senderId === user?.id) {
              const currentReadBy = Array.isArray(msg.readBy) ? msg.readBy : [];
              return {
                ...msg,
                status: 'read',
                readBy: Array.from(new Set([...currentReadBy, readUserId])),
              };
            }
            return msg;
          })
        );
      }
    };

    // Typing start
    const handleTypingStart = ({ chatId, username, userId }) => {
      if (userId === user?.id) return;
      setTypingUsers((prev) => {
        const currentList = prev[chatId] || [];
        if (!currentList.includes(username)) {
          return { ...prev, [chatId]: [...currentList, username] };
        }
        return prev;
      });
    };

    // Typing stop
    const handleTypingStop = ({ chatId, username }) => {
      setTypingUsers((prev) => {
        const currentList = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: currentList.filter((u) => u !== username),
        };
      });
    };

    socketService.on('message:new', handleNewMessage);
    socketService.on('message:deleted', handleMessageDeleted);
    socketService.on('message:read', handleMessageRead);
    socketService.on('typing:start', handleTypingStart);
    socketService.on('typing:stop', handleTypingStop);

    return () => {
      socketService.off('message:new', handleNewMessage);
      socketService.off('message:deleted', handleMessageDeleted);
      socketService.off('message:read', handleMessageRead);
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);
    };
  }, [socket, user?.id]);

  // Send message action
  const sendMessage = async ({ content, messageType = 'text', fileUrl = '', fileName = '', fileSize = 0, disappearingDuration = 0 }) => {
    if (!activeChat) return;

    const payload = {
      chatId: activeChat.id,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      disappearingDuration: disappearingDuration || activeChat.disappearingTimer || 0,
    };

    try {
      const response = await messageService.sendMessage(payload);
      const newMsg = response.message;

      // Optimistically append message if not already present
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Update chats list
      setChats((prev) =>
        prev.map((c) => (c.id === activeChat.id ? { ...c, latestMessage: newMsg, lastMessageAt: newMsg.createdAt } : c))
      );

      return newMsg;
    } catch (error) {
      console.error('Failed to send message:', error.message);
      throw error;
    }
  };

  // Delete message action
  const deleteMessage = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted.', fileUrl: '' } : m))
      );
    } catch (error) {
      console.error('Failed to delete message:', error.message);
      throw error;
    }
  };

  // Start new direct chat or select existing
  const startDirectChat = async (recipientId) => {
    try {
      const data = await chatService.createDirectChat(recipientId);
      const newChat = data.chat;
      await loadChats();
      setActiveChat(newChat);
      return newChat;
    } catch (error) {
      console.error('Failed to create direct chat:', error.message);
      throw error;
    }
  };

  // Create group conversation
  const createGroupChat = async (name, memberIds, avatar = '', description = '', isPrivate = false) => {
    try {
      const data = await chatService.createGroupChat(name, memberIds, avatar, description, isPrivate);
      await loadChats();
      setActiveChat(data.chat);
      return data.chat;
    } catch (error) {
      console.error('Failed to create group:', error.message);
      throw error;
    }
  };

  // Update chat settings
  const updateChatSettings = async (chatId, updates) => {
    try {
      const data = await chatService.updateChat(chatId, updates);
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, ...updates } : c))
      );
      if (activeChat && activeChat.id === chatId) {
        setActiveChat((prev) => ({ ...prev, ...updates }));
      }
      return data.chat;
    } catch (error) {
      console.error('Failed to update chat settings:', error.message);
      throw error;
    }
  };

  const value = {
    chats,
    activeChat,
    setActiveChat,
    messages,
    isLoadingChats,
    isLoadingMessages,
    typingUsers,
    activeTab,
    setActiveTab,
    isVaultUnlocked,
    setIsVaultUnlocked,
    searchQuery,
    setSearchQuery,
    loadChats,
    sendMessage,
    deleteMessage,
    startDirectChat,
    createGroupChat,
    updateChatSettings,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
