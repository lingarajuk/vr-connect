import { io } from 'socket.io-client';

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

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(socketUrl, {
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

  // Join a specific chat room
  joinChat(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join:chat', { chatId });
    }
  }

  // Leave a specific chat room
  leaveChat(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave:chat', { chatId });
    }
  }

  // Send message over socket
  sendMessage(payload, callback) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message:send', payload, callback);
    }
  }

  // Mark message as read
  markAsRead(chatId, messageId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message:read', { chatId, messageId });
    }
  }

  // Emit typing start
  startTyping(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing:start', { chatId });
    }
  }

  // Emit typing stop
  stopTyping(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing:stop', { chatId });
    }
  }

  // Add event listener
  on(event, handler) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  // Remove event listener
  off(event, handler) {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
