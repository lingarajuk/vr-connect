import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // Connect socket with JWT auth
  connect(token) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket connected to VR Connect server:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a chat room
  joinChat(chatId) {
    if (this.socket && chatId) {
      this.socket.emit('join:chat', { chatId });
    }
  }

  // Leave a chat room
  leaveChat(chatId) {
    if (this.socket && chatId) {
      this.socket.emit('leave:chat', { chatId });
    }
  }

  // Send message over WebSocket
  sendMessage(payload, callback) {
    if (this.socket) {
      this.socket.emit('message:send', payload, callback);
    }
  }

  // Mark message delivered
  markDelivered(messageId, chatId) {
    if (this.socket) {
      this.socket.emit('message:delivered', { messageId, chatId });
    }
  }

  // Mark message read
  markRead(messageId, chatId) {
    if (this.socket) {
      this.socket.emit('message:read', { messageId, chatId });
    }
  }

  // Start typing indicator
  startTyping(chatId) {
    if (this.socket) {
      this.socket.emit('typing:start', { chatId });
    }
  }

  // Stop typing indicator
  stopTyping(chatId) {
    if (this.socket) {
      this.socket.emit('typing:stop', { chatId });
    }
  }

  // Subscribe to custom event
  on(event, handler) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  // Unsubscribe from custom event
  off(event, handler) {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
