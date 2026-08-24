import api from './api';

export const chatService = {
  // Get all user conversations
  async getChats() {
    const response = await api.get('/api/chats');
    return response.data;
  },

  // Create direct conversation
  async createDirectChat(recipientId) {
    const response = await api.post('/api/chats', {
      type: 'direct',
      recipientId,
    });
    return response.data;
  },

  // Create group chat
  async createGroupChat(name, memberIds, avatar = '', description = '', isPrivate = false) {
    const response = await api.post('/api/chats', {
      type: 'group',
      name,
      memberIds,
      avatar,
      description,
      isPrivate,
    });
    return response.data;
  },

  // Get chat details by ID
  async getChatById(chatId) {
    const response = await api.get(`/api/chats/${chatId}`);
    return response.data;
  },

  // Update chat settings (disappearing timer, private state, etc.)
  async updateChat(chatId, updates) {
    const response = await api.put(`/api/chats/${chatId}`, updates);
    return response.data;
  },
};

export default chatService;
