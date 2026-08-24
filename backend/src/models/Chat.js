const { v4: uuidv4 } = require('uuid');
const { getLocalStore, saveLocalDB, getPgPool, isPostgres } = require('../config/database');

class Chat {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name || 'Direct Chat';
    this.type = data.type || 'direct';
    this.avatar = data.avatar || data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(this.name || 'chat')}`;
    this.isPrivate = Boolean(data.isPrivate ?? data.is_private ?? false);
    this.disappearingTimer = Number(data.disappearingTimer ?? data.disappearing_timer ?? 0);
    this.adminId = data.adminId || data.admin_id || null;
    this.lastMessageAt = data.lastMessageAt || data.last_message_at || new Date();
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async update(fields) {
    Object.assign(this, fields);
    this.updatedAt = new Date();

    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query(
        `UPDATE conversations SET name = $1, avatar_url = $2, is_private = $3, disappearing_timer = $4, last_message_at = $5, updated_at = $6 WHERE id = $7`,
        [this.name, this.avatar, this.isPrivate, this.disappearingTimer, this.lastMessageAt, this.updatedAt, this.id]
      );
    } else {
      const store = getLocalStore();
      const list = store.chats || store.conversations || [];
      const idx = list.findIndex((c) => c.id === this.id);
      if (idx !== -1) {
        list[idx] = { ...this };
        saveLocalDB();
      }
    }
    return this;
  }

  static async findByPk(id) {
    if (!id) return null;
    if (isPostgres()) {
      const pool = getPgPool();
      const res = await pool.query('SELECT * FROM conversations WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      return new Chat(res.rows[0]);
    } else {
      const store = getLocalStore();
      const list = store.chats || store.conversations || [];
      const found = list.find((c) => c.id === id);
      return found ? new Chat(found) : null;
    }
  }

  static async create(data) {
    const chat = new Chat(data);
    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO conversations (id, name, type, avatar_url, is_private, disappearing_timer, admin_id, last_message_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [chat.id, chat.name, chat.type, chat.avatar, chat.isPrivate, chat.disappearingTimer, chat.adminId, chat.lastMessageAt, chat.createdAt, chat.updatedAt]
      );
    } else {
      const store = getLocalStore();
      if (!store.chats) store.chats = [];
      if (!store.conversations) store.conversations = store.chats;
      store.chats.push({ ...chat });
      saveLocalDB();
    }
    return chat;
  }

  static async deleteChat(id) {
    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query('DELETE FROM conversations WHERE id = $1', [id]);
    } else {
      const store = getLocalStore();
      if (store.chats) store.chats = store.chats.filter((c) => c.id !== id);
      if (store.conversations) store.conversations = store.conversations.filter((c) => c.id !== id);
      if (store.chatMembers) store.chatMembers = store.chatMembers.filter((m) => m.chatId !== id);
      if (store.conversationMembers) store.conversationMembers = store.conversationMembers.filter((m) => m.chatId !== id);
      if (store.messages) store.messages = store.messages.filter((m) => m.chatId !== id);
      saveLocalDB();
    }
  }
}

module.exports = Chat;
