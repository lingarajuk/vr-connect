const { v4: uuidv4 } = require('uuid');
const { getLocalStore, saveLocalDB, getPgPool, isPostgres } = require('../config/database');

class ChatMember {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.chatId = data.chatId || data.chat_id || data.conversationId || data.conversation_id;
    this.userId = data.userId || data.user_id;
    this.role = data.role || 'member';
    this.unreadCount = Number(data.unreadCount ?? data.unread_count ?? 0);
    this.lastReadAt = data.lastReadAt || data.last_read_at || new Date();
    this.isMuted = Boolean(data.isMuted ?? data.is_muted ?? false);
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async update(fields) {
    Object.assign(this, fields);
    this.updatedAt = new Date();

    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query(
        `UPDATE conversation_members SET role = $1, unread_count = $2, last_read_at = $3, is_muted = $4, updated_at = $5 WHERE id = $6`,
        [this.role, this.unreadCount, this.lastReadAt, this.isMuted, this.updatedAt, this.id]
      );
    } else {
      const store = getLocalStore();
      const list = store.chatMembers || store.conversationMembers || [];
      const idx = list.findIndex((m) => m.id === this.id);
      if (idx !== -1) {
        list[idx] = { ...this };
        saveLocalDB();
      }
    }
    return this;
  }

  async increment(field, { by = 1 } = {}) {
    if (field === 'unreadCount') {
      this.unreadCount += by;
      await this.update({ unreadCount: this.unreadCount });
    }
  }

  static async update(fields, { where } = {}) {
    if (where) {
      const members = await ChatMember.findAll({ where });
      for (const m of members) {
        await m.update(fields);
      }
    }
  }

  static async increment(field, { by = 1, where } = {}) {
    if (where) {
      const members = await ChatMember.findAll({ where });
      for (const m of members) {
        await m.increment(field, { by });
      }
    }
  }

  static async findOne({ where }) {
    if (isPostgres()) {
      const pool = getPgPool();
      const res = await pool.query('SELECT * FROM conversation_members WHERE conversation_id = $1 AND user_id = $2', [where.chatId || where.conversationId, where.userId]);
      if (res.rows.length === 0) return null;
      return new ChatMember(res.rows[0]);
    } else {
      const store = getLocalStore();
      const list = store.chatMembers || store.conversationMembers || [];
      const found = list.find((m) => (m.chatId === where.chatId || m.chatId === where.conversationId) && m.userId === where.userId);
      return found ? new ChatMember(found) : null;
    }
  }

  static async findAll({ where = {} } = {}) {
    if (isPostgres()) {
      const pool = getPgPool();
      let query = 'SELECT * FROM conversation_members';
      const params = [];
      if (where.userId) {
        params.push(where.userId);
        query += ` WHERE user_id = $${params.length}`;
      } else if (where.chatId || where.conversationId) {
        params.push(where.chatId || where.conversationId);
        query += ` WHERE conversation_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      return res.rows.map((r) => new ChatMember(r));
    } else {
      const store = getLocalStore();
      let list = [...(store.chatMembers || store.conversationMembers || [])];
      if (where.userId) list = list.filter((m) => m.userId === where.userId);
      if (where.chatId || where.conversationId) {
        const targetId = where.chatId || where.conversationId;
        list = list.filter((m) => m.chatId === targetId);
      }
      return list.map((m) => new ChatMember(m));
    }
  }

  static async create(data) {
    const member = new ChatMember(data);
    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO conversation_members (id, conversation_id, user_id, role, unread_count, last_read_at, is_muted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [member.id, member.chatId, member.userId, member.role, member.unreadCount, member.lastReadAt, member.isMuted, member.createdAt, member.updatedAt]
      );
    } else {
      const store = getLocalStore();
      if (!store.chatMembers) store.chatMembers = [];
      if (!store.conversationMembers) store.conversationMembers = store.chatMembers;
      store.chatMembers.push({ ...member });
      saveLocalDB();
    }
    return member;
  }
}

module.exports = ChatMember;
