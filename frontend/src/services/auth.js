import api from './api';

export const authService = {
  // Register new account
  async register(username, email, password) {
    const response = await api.post('/api/auth/register', { username, email, password });
    if (response.data.token) {
      localStorage.setItem('vr_token', response.data.token);
      localStorage.setItem('vr_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login with credentials
  async login(emailOrUsername, password) {
    const response = await api.post('/api/auth/login', { emailOrUsername, password });
    if (response.data.token) {
      localStorage.setItem('vr_token', response.data.token);
      localStorage.setItem('vr_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout
  async logout() {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.warn('Logout API error:', e.message);
    } finally {
      localStorage.removeItem('vr_token');
      localStorage.removeItem('vr_user');
      sessionStorage.removeItem('vr_unlocked');
    }
  },

  // Get current user profile
  async getMe() {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  // Update username
  async updateUsername(username) {
    const response = await api.patch('/api/users/me/username', { username });
    if (response.data.user) {
      localStorage.setItem('vr_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Update email
  async updateEmail(email) {
    const response = await api.patch('/api/users/me/email', { email });
    if (response.data.user) {
      localStorage.setItem('vr_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Change password
  async updatePassword(currentPassword, newPassword, confirmPassword) {
    const response = await api.patch('/api/users/me/password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Get active sessions
  async getSessions() {
    const response = await api.get('/api/auth/sessions');
    return response.data;
  },

  // Logout other devices
  async logoutAll() {
    const response = await api.post('/api/auth/logout-all');
    return response.data;
  },

  // Get linked accounts
  async getLinkedAccounts() {
    const response = await api.get('/api/accounts/linked');
    return response.data;
  },

  // Get Google OAuth initiation URL
  async getGoogleAuthUrl() {
    const token = localStorage.getItem('vr_token');
    const response = await api.get(`/api/auth/google?format=json&token=${encodeURIComponent(token)}`);
    return response.data;
  },

  // Unlink Google account
  async unlinkGoogle() {
    const response = await api.delete('/api/accounts/google');
    return response.data;
  },

  // Direct test link Google
  async directLinkGoogle(googleSub, googleEmail) {
    const response = await api.post('/api/accounts/google/link', { googleSub, googleEmail });
    return response.data;
  },

  // Get user settings
  async getSettings() {
    const response = await api.get('/api/users/settings');
    return response.data;
  },

  // Update user settings
  async updateSettings(settings) {
    const response = await api.patch('/api/users/settings', settings);
    return response.data;
  },

  // Get saved memories
  async getMemories() {
    const response = await api.get('/api/users/memories');
    return response.data;
  },

  // Save memory
  async saveMemory(memoryData) {
    const response = await api.post('/api/users/memories', memoryData);
    return response.data;
  },

  // Delete memory
  async deleteMemory(memoryId) {
    const response = await api.delete(`/api/users/memories/${memoryId}`);
    return response.data;
  },

  // Export my data
  async exportData() {
    const response = await api.get('/api/users/data/export');
    return response.data;
  },

  // Delete my account & data
  async deleteAccount(confirmation) {
    const response = await api.delete('/api/users/me', { data: { confirmation } });
    localStorage.removeItem('vr_token');
    localStorage.removeItem('vr_user');
    sessionStorage.removeItem('vr_unlocked');
    return response.data;
  },

  // Setup security PIN for App Lock
  async setupPin(pin) {
    const response = await api.post('/api/auth/pin', { pin });
    return response.data;
  },

  // Verify PIN for unlocking app or private chat
  async verifyPin(pin) {
    const response = await api.post('/api/auth/verify-pin', { pin });
    return response.data;
  },

  // Search users
  async getUsers(search = '') {
    const response = await api.get(`/api/users?search=${encodeURIComponent(search)}`);
    return response.data;
  },

  // Update profile
  async updateProfile(data) {
    const response = await api.put('/api/users/profile', data);
    if (response.data.user) {
      localStorage.setItem('vr_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
};

export default authService;
