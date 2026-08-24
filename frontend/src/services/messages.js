import api from './api';

export const messageService = {
  // Fetch messages for a chat
  async getMessages(chatId, limit = 100, before = null) {
    let url = `/api/messages/${chatId}?limit=${limit}`;
    if (before) url += `&before=${encodeURIComponent(before)}`;
    const response = await api.get(url);
    return response.data;
  },

  // Send a message
  async sendMessage(payload) {
    const response = await api.post('/api/messages', payload);
    return response.data;
  },

  // Delete / recall a message
  async deleteMessage(messageId) {
    const response = await api.delete(`/api/messages/${messageId}`);
    return response.data;
  },

  // Mark chat messages as read
  async markAsRead(chatId) {
    const response = await api.post('/api/messages/read', { chatId });
    return response.data;
  },

  // Upload attachment file (image, video, audio, document)
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default messageService;
