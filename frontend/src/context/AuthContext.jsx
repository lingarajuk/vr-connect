import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vr_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppLocked, setIsAppLocked] = useState(false);

  // Initialize and verify authentication
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vr_token');
      if (storedToken) {
        try {
          const data = await authService.getMe();
          setUser(data.user);

          // Check if App Lock is enabled in user settings
          if (data.user?.settings?.appLockEnabled && data.user?.hasPin) {
            const isSessionUnlocked = sessionStorage.getItem('vr_unlocked') === 'true';
            setIsAppLocked(!isSessionUnlocked);
          }
        } catch (error) {
          console.error('Session expired or invalid token:', error.message);
          localStorage.removeItem('vr_token');
          localStorage.removeItem('vr_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login handler
  const login = async (emailOrUsername, password) => {
    const data = await authService.login(emailOrUsername, password);
    setUser(data.user);
    setToken(data.token);

    if (data.user?.settings?.appLockEnabled && data.user?.hasPin) {
      setIsAppLocked(true);
      sessionStorage.removeItem('vr_unlocked');
    } else {
      setIsAppLocked(false);
    }
    return data;
  };

  // Register handler
  const register = async (username, email, password) => {
    const data = await authService.register(username, email, password);
    setUser(data.user);
    setToken(data.token);
    setIsAppLocked(false);
    return data;
  };

  // Logout handler
  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    setIsAppLocked(false);
  };

  // Verify PIN to unlock application or vault
  const verifyAppPin = async (pin) => {
    await authService.verifyPin(pin);
    setIsAppLocked(false);
    sessionStorage.setItem('vr_unlocked', 'true');
    return true;
  };

  // Setup security PIN
  const setupAppPin = async (pin) => {
    const data = await authService.setupPin(pin);
    setUser((prev) => ({
      ...prev,
      hasPin: true,
      settings: { ...prev?.settings, appLockEnabled: true },
    }));
    return data;
  };

  // Update profile
  const updateUserProfile = async (updates) => {
    const data = await authService.updateProfile(updates);
    setUser(data.user);
    return data;
  };

  const lockApp = () => {
    if (user?.hasPin) {
      sessionStorage.removeItem('vr_unlocked');
      setIsAppLocked(true);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    isAppLocked,
    login,
    register,
    logout,
    verifyAppPin,
    setupAppPin,
    updateUserProfile,
    lockApp,
    setIsAppLocked,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
