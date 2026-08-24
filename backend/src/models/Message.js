const { v4: uuidv4 } = require('uuid');
const { getLocalStore, saveLocalDB, getPgPool, isPostgres } = require('../config/database');

class Message {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.chatId = data.chatId || data.chat_id;
    this.senderId = data.senderId || data.sender_id;
    this.content = data.content || '';
    this.messageType = data.messageType || data.message_type || 'text';
    this.fileUrl = data.fileUrl || data.file_url || '';
    this.fileName = data.fileName || data.file_name || '';
    this.fileSize = Number(data.fileSize ?? data.file_size ?? 0);
    this.isDisappearing = Boolean(data.isDisappearing ?? data.is_disappearing ?? false);
    this.disappearingDuration = Number(data.disappearingDuration ?? data.disappearing_duration ?? 0);
    this.expiresAt = data.expiresAt || data.expires_at || null;
    this.isDeleted = Boolean(data.isDeleted ?? data.is_deleted ?? false);
    this.status = data.status || 'sent';
    this.readBy = data.readBy || data.read_by || [];
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async update(fields) {
    Object.assign(this, fields);
    this.updatedAt = new Date();

    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query(
        `UPDATE messages SET content = $1, file_url = $2, is_deleted = $3, status = $4, read_by = $5, updated_at = $6 WHERE id = $7`,
        [this.content, this.fileUrl, this.isDeleted, this.status, JSON.stringify(this.readBy), this.updatedAt, this.id]
      );
    } else {
      const store = getLocalStore();
      const idx = store.messages.findIndex((m) => m.id === this.id);
      if (idx !== -1) {
        store.messages[idx] = { ...this };
        saveLocalDB();
      }
    }
    return this;
  }

  static async update(fields, { where } = {}) {
    if (where && where.id) {
      const msg = await Message.findByPk(where.id);
      if (msg) {
        if (where.status && msg.status !== where.status) {
          return msg;
        }
        return msg.update(fields);
      }
    }
  }

  static async findByPk(id) {
    if (!id) return null;
    if (isPostgres()) {
      const pool = getPgPool();
      const res = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      return new Message(res.rows[0]);
    } else {
      const store = getLocalStore();
      const found = store.messages.find((m) => m.id === id);
      return found ? new Message(found) : null;
    }
  }

  static async findAll({ where = {}, limit = 100 } = {}) {
    if (isPostgres()) {
      const pool = getPgPool();
      let query = 'SELECT * FROM messages WHERE chat_id = $1';
      const params = [where.chatId];

      if (where.isDisappearingExpired) {
        query = 'SELECT * FROM messages WHERE is_disappearing = true AND expires_at <= CURRENT_TIMESTAMP AND is_deleted = false';
        const res = await pool.query(query);
        return res.rows.map((r) => new Message(r));
      }

      query += ` ORDER BY created_at ASC LIMIT ${limit}`;
      const res = await pool.query(query, params);
      return res.rows.map((r) => new Message(r));
    } else {
      const store = getLocalStore();
      let list = [...store.messages];

      if (where.isDisappearingExpired) {
        const now = new Date();
        return list
          .filter((m) => m.isDisappearing && m.expiresAt && new Date(m.expiresAt) <= now && !m.isDeleted)
          .map((m) => new Message(m));
      }

      if (where.chatId) {
        list = list.filter((m) => m.chatId === where.chatId);
      }

      return list.slice(-limit).map((m) => new Message(m));
    }
  }

  static async create(data) {
    const msg = new Message(data);
    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO messages (id, chat_id, sender_id, content, message_type, file_url, file_name, file_size, is_disappearing, disappearing_duration, expires_at, is_deleted, status, read_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [msg.id, msg.chatId, msg.senderId, msg.content, msg.messageType, msg.fileUrl, msg.fileName, msg.fileSize, msg.isDisappearing, msg.disappearingDuration, msg.expiresAt, msg.isDeleted, msg.status, JSON.stringify(msg.readBy), msg.createdAt, msg.updatedAt]
      );
    } else {
      const store = getLocalStore();
      store.messages.push({ ...msg });
      saveLocalDB();
    }
    return msg;
  }
}

module.exports = Message;
