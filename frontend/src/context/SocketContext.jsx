import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketService.disconnect();
      setOnlineUsers(new Set());
      return;
    }

    // Connect socket with token
    const socket = socketService.connect(token);

    // Online status listener
    const handleUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    };

    // Offline status listener
    const handleUserOffline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    // Incoming call listener
    const handleIncomingCall = (callData) => {
      setIncomingCall(callData);
    };

    const handleCallEnded = () => {
      setIncomingCall(null);
    };

    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);
    socketService.on('call:incoming', handleIncomingCall);
    socketService.on('call:ended', handleCallEnded);

    return () => {
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
      socketService.off('call:incoming', handleIncomingCall);
      socketService.off('call:ended', handleCallEnded);
    };
  }, [isAuthenticated, token]);

  const value = {
    socket: socketService.socket,
    socketService,
    onlineUsers,
    isUserOnline: (userId) => onlineUsers.has(userId),
    incomingCall,
    dismissCall: () => setIncomingCall(null),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
