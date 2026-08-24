# VR Connect - Frontend Client Application

Modern, high-performance, and responsive Web & Mobile-ready client for the VR Connect platform.

---

## ✨ Features

- **Decoupled Service Layer**: Modular services (`services/api.js`, `services/auth.js`, `services/chat.js`, `services/messages.js`, `services/socket.js`) enabling 100% code reuse for React Native mobile apps.
- **Glassmorphic VR Design System**: Sleek obsidian and neon accents (`#00f2fe`, `#7928ca`, `#ff007a`), dark-mode native interface.
- **Real-Time WebSockets**: Instant message dispatch, delivery status receipts, read indicators (blue double check), typing indicators, online/offline status.
- **Private Encrypted Vault**: Passcode/PIN-locked conversations hidden from general view.
- **App Lock**: Optional 4-digit PIN security lock on startup or idle.
- **Disappearing Messages**: Configurable timer (30s, 5m, 1h, 24h) with real-time countdown badge.
- **Media & File Sharing**: Image lightboxes, inline video player, voice notes, document downloads.
- **Group Chats & One-on-One**: Multi-participant groups with role and admin indicators.
- **Calling Interface**: WebRTC signaling ready for HD voice and video calls.

---

## ⚙️ Environment Variables

Create `.env` in the `frontend/` directory:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000

# Backend Socket.IO Server URL
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Running Locally

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The application will be running at `http://localhost:5173`.

---

## 🌐 Deploying to Vercel

1. Import the repository on [Vercel](https://vercel.com).
2. Set Root Directory: `frontend`.
3. Framework Preset: `Vite`.
4. Configure Environment Variables:
   - `VITE_API_URL` = `https://your-backend-render-service.onrender.com`
   - `VITE_SOCKET_URL` = `https://your-backend-render-service.onrender.com`
5. Click **Deploy**. SPA rewrites are already configured in `vercel.json`.
