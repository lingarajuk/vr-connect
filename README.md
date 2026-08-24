# VR Connect - Real-Time Chat & Media Platform

VR Connect is a complete, production-ready, decoupled real-time chat application with separate **Frontend** and **Backend** architectures.

```text
vr-connect/
├── backend/                  # Node.js + Express + Socket.IO + SQLite / PostgreSQL ORM
│   ├── src/
│   │   ├── config/           # Database configuration (SQLite / PostgreSQL auto-switching)
│   │   ├── controllers/      # Auth, Users, Chats, Messages, Media Uploads
│   │   ├── middleware/       # JWT Auth, Multer Media Filter, Error Handling
│   │   ├── models/           # User, Chat, ChatMember, Message (Sequelize)
│   │   ├── routes/           # REST API Route declarations
│   │   ├── services/         # Business logic & Disappearing messages cleaner
│   │   ├── sockets/          # Socket.IO handlers (presence, typing, receipts, signaling)
│   │   ├── utils/            # JWT & Validation helpers
│   │   └── server.js         # Entrypoint
│   ├── uploads/              # Stored media assets
│   ├── Dockerfile            # Production Docker image
│   └── package.json
│
├── frontend/                 # React + Vite + Lucide Icons + Cyber Glassmorphic UI
│   ├── src/
│   │   ├── components/       # ChatArea, ChatInput, MessageBubble, AppLock, Vault, etc.
│   │   ├── context/          # AuthContext, ChatContext, SocketContext
│   │   ├── pages/            # AuthPage, ChatPage
│   │   ├── services/         # Modular Service Layer (Ready for React Native reuse)
│   │   ├── App.jsx
│   │   └── index.css         # Modern Design System
│   ├── vercel.json           # Vercel SPA routing
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### 1. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend will run on `http://localhost:5000` (automatically uses SQLite for instant local zero-config testing).

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`.

---

## 🔒 Key Features

1. **Authentication & Security**:
   - Secure password hashing with bcrypt.
   - JWT authentication tokens & middleware.
   - 4-Digit Security PIN for **App Lock** on startup and **Private Vault** encryption.
2. **Real-Time Communication**:
   - WebSockets via Socket.IO.
   - Live message streams, online/offline presence tracking, and typing indicators.
   - Delivered and Read receipts (double blue check ✓✓).
3. **Disappearing Messages**:
   - Configurable per-chat and per-message timers (30s, 5m, 1h, 24h).
   - Automated server-side scheduled cleanup and real-time client removal.
4. **Media Sharing**:
   - Images, videos, voice notes, and document file attachments.
   - Lightbox image/video previews and inline audio players.
5. **Private Vault**:
   - Hidden conversations protected by a secondary 4-digit PIN.
6. **Mobile / React Native Ready**:
   - Decoupled `services/` layer (`api.js`, `auth.js`, `chat.js`, `messages.js`, `socket.js`) allows effortless drop-in into React Native.

---

## 🚢 Deployment Guides

### Backend Deployment (Render)
- **Service Type**: Web Service
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PORT`: `5000` (or Render default)
  - `NODE_ENV`: `production`
  - `JWT_SECRET`: `<secure-random-secret>`
  - `CLIENT_URL`: `https://<your-frontend-app>.vercel.app`
  - `DATABASE_URL`: (Optional) Attach **Render PostgreSQL** database connection URL.

### Frontend Deployment (Vercel)
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://<your-backend-app>.onrender.com`
  - `VITE_SOCKET_URL`: `https://<your-backend-app>.onrender.com`

### Docker Deployment
```bash
cd backend
docker build -t vr-connect-backend .
docker run -p 5000:5000 \
  -e JWT_SECRET=your_jwt_secret \
  -e CLIENT_URL=https://your-frontend.vercel.app \
  vr-connect-backend
```
