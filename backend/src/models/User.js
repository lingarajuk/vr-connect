const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getLocalStore, saveLocalDB, getPgPool, isPostgres } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.username = data.username;
    this.email = data.email ? data.email.toLowerCase().trim() : '';
    this.password = data.password;
    this.avatar = data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(this.username || 'user')}`;
    this.statusMessage = data.statusMessage || data.status_message || 'Available on VR Connect';
    this.pinCode = data.pinCode || data.pin_code || null;
    this.isOnline = Boolean(data.isOnline ?? data.is_online ?? false);
    this.lastSeen = data.lastSeen || data.last_seen || new Date();
    this.settings = data.settings || {
      soundEnabled: true,
      desktopNotifications: true,
      theme: 'dark',
      privacyLastSeen: 'everyone',
      appLockEnabled: false,
      appLockTimeoutMinutes: 5,
      message_delete_after_viewing: 'off', // 'off' | 'view' | '10s' | '30s' | '1m' | '24h'
    };
    this.savedMemories = data.savedMemories || [];
    this.linkedAccounts = data.linkedAccounts || {
      google: false,
      apple: false,
      phone: false,
      phoneNumber: null,
    };
    this.sessions = data.sessions || [
      {
        id: 'sess_' + uuidv4().substring(0, 8),
        device: 'Current Web Browser (Windows 11)',
        ip: '127.0.0.1',
        lastActive: new Date(),
        loginDate: new Date(),
        isCurrent: true,
      },
    ];
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  async comparePin(candidatePin) {
    if (!this.pinCode) return false;
    return bcrypt.compare(candidatePin, this.pinCode);
  }

  toSafeObject() {
    const obj = { ...this };
    delete obj.password;
    delete obj.pinCode;
    return obj;
  }

  async update(fields) {
    Object.assign(this, fields);
    this.updatedAt = new Date();

    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query(
        `UPDATE users SET avatar = $1, status_message = $2, pin_code = $3, is_online = $4, last_seen = $5, settings = $6, updated_at = $7 WHERE id = $8`,
        [this.avatar, this.statusMessage, this.pinCode, this.isOnline, this.lastSeen, JSON.stringify(this.settings), this.updatedAt, this.id]
      );
    } else {
      const store = getLocalStore();
      const idx = store.users.findIndex((u) => u.id === this.id);
      if (idx !== -1) {
        store.users[idx] = { ...this };
        saveLocalDB();
      }
    }
    return this;
  }

  static async update(fields, { where } = {}) {
    if (where && where.id) {
      const user = await User.findByPk(where.id);
      if (user) {
        return user.update(fields);
      }
    }
  }

  static async findByPk(id) {
    if (!id) return null;
    if (isPostgres()) {
      const pool = getPgPool();
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      return new User(res.rows[0]);
    } else {
      const store = getLocalStore();
      const found = store.users.find((u) => u.id === id);
      return found ? new User(found) : null;
    }
  }

  static async findOne({ where }) {
    if (isPostgres()) {
      const pool = getPgPool();
      let query = 'SELECT * FROM users WHERE ';
      const params = [];
      const clauses = [];

      if (where.id) {
        params.push(where.id);
        clauses.push(`id = $${params.length}`);
      }
      if (where.email) {
        params.push(where.email.toLowerCase().trim());
        clauses.push(`LOWER(email) = $${params.length}`);
      }
      if (where.username) {
        params.push(where.username.trim());
        clauses.push(`username = $${params.length}`);
      }

      if (clauses.length === 0) return null;
      query += clauses.join(' OR ');

      const res = await pool.query(query, params);
      return res.rows.length > 0 ? new User(res.rows[0]) : null;
    } else {
      const store = getLocalStore();
      const found = store.users.find((u) => {
        if (where.id && u.id === where.id) return true;
        if (where.email && u.email && where.email.toLowerCase() === u.email.toLowerCase()) return true;
        if (where.username && u.username && where.username.toLowerCase() === u.username.toLowerCase()) return true;
        return false;
      });
      return found ? new User(found) : null;
    }
  }

  static async findAll({ where = {}, limit = 50 } = {}) {
    if (isPostgres()) {
      const pool = getPgPool();
      let query = 'SELECT * FROM users';
      const params = [];
      if (where.excludeId) {
        params.push(where.excludeId);
        query += ` WHERE id != $1`;
      }
      query += ` ORDER BY is_online DESC, username ASC LIMIT ${limit}`;
      const res = await pool.query(query, params);
      return res.rows.map((r) => new User(r));
    } else {
      const store = getLocalStore();
      let list = [...store.users];
      if (where.excludeId) {
        list = list.filter((u) => u.id !== where.excludeId);
      }
      if (where.search) {
        const q = where.search.toLowerCase();
        list = list.filter((u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return list.slice(0, limit).map((u) => new User(u));
    }
  }

  static async create(data) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = new User({
      ...data,
      password: hashedPassword,
    });

    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO users (id, username, email, password, avatar, status_message, pin_code, is_online, last_seen, settings, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [user.id, user.username, user.email, user.password, user.avatar, user.statusMessage, user.pinCode, user.isOnline, user.lastSeen, JSON.stringify(user.settings), user.createdAt, user.updatedAt]
      );
    } else {
      const store = getLocalStore();
      store.users.push({ ...user });
      saveLocalDB();
    }

    return user;
  }

  static async deleteUser(id) {
    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
    } else {
      const store = getLocalStore();
      store.users = store.users.filter((u) => u.id !== id);
      store.chatMembers = store.chatMembers.filter((m) => m.userId !== id);
      store.messages = store.messages.filter((m) => m.senderId !== id);
      saveLocalDB();
    }
  }
}

module.exports = User;
