const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB, isPostgres } = require('./config/database');
const { initializeChatSocket } = require('./sockets/chat');
const MessageService = require('./services/messageService');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const accountRoutes = require('./routes/accountRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const memoriesRoutes = require('./routes/memoriesRoutes');

const app = express();
const server = http.createServer(app);

// Client CORS origin
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Security & General Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', apiLimiter);

// Serve static uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Root & Health Check endpoint
app.get(['/', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'VR Backend',
    database: isPostgres() ? 'PostgreSQL (Connected)' : 'Local Persistent Storage (Active)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by Socket CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
});

// Initialize real-time sockets
initializeChatSocket(io);

// Make io accessible in req if needed
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/memories', memoriesRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect Database & Start Server
connectDB().then(() => {
  MessageService.startCleanupJob(io, 5000);

  server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  🚀 VR Connect Backend Server Running`);
    console.log(`  📡 Port: ${PORT}`);
    console.log(`  🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
});

module.exports = { app, server, io };
