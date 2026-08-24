const { v4: uuidv4 } = require('uuid');
const { getLocalStore, saveLocalDB, getPgPool, isPostgres } = require('../config/database');

class LinkedAccount {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.userId = data.userId || data.user_id;
    this.provider = data.provider || 'google';
    this.providerAccountId = data.providerAccountId || data.provider_account_id;
    this.providerEmail = data.providerEmail || data.provider_email || '';
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  static async findOne({ where = {} } = {}) {
    if (isPostgres()) {
      const pool = getPgPool();
      let query = 'SELECT * FROM linked_accounts WHERE ';
      const params = [];
      const clauses = [];

      if (where.userId) {
        params.push(where.userId);
        clauses.push(`user_id = $${params.length}`);
      }
      if (where.provider) {
        params.push(where.provider);
        clauses.push(`provider = $${params.length}`);
      }
      if (where.providerAccountId) {
        params.push(where.providerAccountId);
        clauses.push(`provider_account_id = $${params.length}`);
      }
      if (where.providerEmail) {
        params.push(where.providerEmail.toLowerCase().trim());
        clauses.push(`LOWER(provider_email) = $${params.length}`);
      }

      if (clauses.length === 0) return null;
      query += clauses.join(' AND ');

      const res = await pool.query(query, params);
      return res.rows.length > 0 ? new LinkedAccount(res.rows[0]) : null;
    } else {
      const store = getLocalStore();
      if (!store.linkedAccounts) store.linkedAccounts = [];
      const found = store.linkedAccounts.find((acc) => {
        if (where.userId && acc.userId !== where.userId) return false;
        if (where.provider && acc.provider !== where.provider) return false;
        if (where.providerAccountId && acc.providerAccountId !== where.providerAccountId) return false;
        if (where.providerEmail && acc.providerEmail?.toLowerCase() !== where.providerEmail.toLowerCase()) return false;
        return true;
      });
      return found ? new LinkedAccount(found) : null;
    }
  }

  static async findAll({ where = {} } = {}) {
    if (isPostgres()) {
      const pool = getPgPool();
      let query = 'SELECT * FROM linked_accounts';
      const params = [];
      if (where.userId) {
        params.push(where.userId);
        query += ` WHERE user_id = $1`;
      }
      const res = await pool.query(query, params);
      return res.rows.map((r) => new LinkedAccount(r));
    } else {
      const store = getLocalStore();
      if (!store.linkedAccounts) store.linkedAccounts = [];
      let list = [...store.linkedAccounts];
      if (where.userId) {
        list = list.filter((a) => a.userId === where.userId);
      }
      if (where.provider) {
        list = list.filter((a) => a.provider === where.provider);
      }
      return list.map((a) => new LinkedAccount(a));
    }
  }

  static async create(data) {
    const acc = new LinkedAccount(data);
    if (isPostgres()) {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO linked_accounts (id, user_id, provider, provider_account_id, provider_email, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [acc.id, acc.userId, acc.provider, acc.providerAccountId, acc.providerEmail, acc.createdAt, acc.updatedAt]
      );
    } else {
      const store = getLocalStore();
      if (!store.linkedAccounts) store.linkedAccounts = [];
      store.linkedAccounts.push({ ...acc });
      saveLocalDB();
    }
    return acc;
  }

  static async deleteOne({ where = {} } = {}) {
    if (isPostgres()) {
      const pool = getPgPool();
      let query = 'DELETE FROM linked_accounts WHERE ';
      const params = [];
      const clauses = [];
      if (where.userId) {
        params.push(where.userId);
        clauses.push(`user_id = $${params.length}`);
      }
      if (where.provider) {
        params.push(where.provider);
        clauses.push(`provider = $${params.length}`);
      }
      query += clauses.join(' AND ');
      await pool.query(query, params);
    } else {
      const store = getLocalStore();
      if (!store.linkedAccounts) store.linkedAccounts = [];
      store.linkedAccounts = store.linkedAccounts.filter((a) => {
        if (where.userId && a.userId === where.userId && (!where.provider || a.provider === where.provider)) {
          return false;
        }
        return true;
      });
      saveLocalDB();
    }
  }
}

module.exports = LinkedAccount;
