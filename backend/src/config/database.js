const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let pgPool = null;
let usePostgres = false;

const DB_FILE = path.resolve(__dirname, '../../database.json');

// In-Memory fallback store with auto-persistence
let memoryStore = {
  users: [],
  sessions: [],
  chats: [],
  conversations: [],
  chatMembers: [],
  conversationMembers: [],
  messages: [],
  linkedAccounts: [],
  memories: [],
};

const loadLocalDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const chatList = parsed.chats || parsed.conversations || [];
      const memberList = parsed.chatMembers || parsed.conversationMembers || [];
      const memoryList = parsed.memories || parsed.savedMemories || [];

      memoryStore = {
        users: parsed.users || [],
        sessions: parsed.sessions || [],
        chats: chatList,
        conversations: chatList,
        chatMembers: memberList,
        conversationMembers: memberList,
        messages: parsed.messages || [],
        linkedAccounts: parsed.linkedAccounts || [],
        memories: memoryList,
      };
      console.log('✅ [DB] Local Persistent Database Loaded successfully (database.json).');
    } else {
      saveLocalDB();
      console.log('✅ [DB] Initialized fresh Local Persistent Database (database.json).');
    }
  } catch (err) {
    console.error('❌ [DB] Error loading local database:', err.message);
  }
};

const saveLocalDB = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ [DB] Error saving local database:', err.message);
  }
};

const connectDB = async () => {
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require('pg');
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });

      const client = await pgPool.connect();
      console.log('✅ [DB] Connected to PostgreSQL successfully.');
      client.release();
      usePostgres = true;
      await initPgTables();
      return;
    } catch (err) {
      console.warn('⚠️ [DB] PostgreSQL connection failed, falling back to Local Persistent DB.');
      console.warn('Reason:', err.message);
    }
  }

  loadLocalDB();
};

const initPgTables = async () => {
  if (!pgPool) return;
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        avatar_url TEXT,
        status_message TEXT,
        pin_code VARCHAR(255),
        is_online BOOLEAN DEFAULT false,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        settings JSONB DEFAULT '{"soundEnabled":true,"desktopNotifications":true,"theme":"dark","message_delete_after_viewing":"off"}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        device VARCHAR(255),
        ip VARCHAR(64),
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        login_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_current BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(20) DEFAULT 'direct',
        avatar_url TEXT,
        is_private BOOLEAN DEFAULT false,
        disappearing_timer INTEGER DEFAULT 0,
        admin_id VARCHAR(64),
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversation_members (
        id VARCHAR(64) PRIMARY KEY,
        conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        unread_count INTEGER DEFAULT 0,
        last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_muted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(conversation_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        content TEXT,
        message_type VARCHAR(20) DEFAULT 'text',
        file_url TEXT,
        file_name VARCHAR(255),
        file_size INTEGER DEFAULT 0,
        is_disappearing BOOLEAN DEFAULT false,
        disappearing_duration INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        is_deleted BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'sent',
        read_by JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS linked_accounts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        provider_account_id VARCHAR(255) NOT NULL,
        provider_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider, provider_account_id)
      );

      CREATE TABLE IF NOT EXISTS memories (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        message_id VARCHAR(64),
        content TEXT,
        media_url TEXT,
        media_type VARCHAR(20) DEFAULT 'text',
        sender_name VARCHAR(100),
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ [DB] All PostgreSQL Production Tables initialized successfully.');
  } catch (err) {
    console.error('❌ [DB] Error initializing PostgreSQL tables:', err.message);
  }
};

const getLocalStore = () => memoryStore;
const getPgPool = () => pgPool;
const isPostgres = () => usePostgres;

module.exports = {
  connectDB,
  getLocalStore,
  saveLocalDB,
  getPgPool,
  isPostgres,
};
