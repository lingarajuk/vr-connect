# 🌐 VR Connect - Production Architecture & Docker Setup

**VR Connect** is a cyberpunk-themed real-time chat web application built with a decoupled architecture:
* **Frontend**: React (Vite) Single Page Application served via high-performance Nginx.
* **Backend**: Node.js (Express) REST API & real-time Socket.IO server.
* **Database**: PostgreSQL with persistent volumes & dual local database fallback.

---

## 🏛️ System Architecture

### 1. Local Docker Architecture
```text
                       Docker Network (vr_network)
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
         ┌────▼─────┐                              ┌────▼─────┐
         │ Frontend │                              │ Backend  │
         │  (Nginx) │─────────────────────────────▶│ (Node.js)│
         │  :3000   │                              │  :5000   │
         └────┬─────┘                              └────┬─────┘
              │                                         │
    Host: http://localhost:3000                         │
                                                   ┌────▼─────┐
                                                   │PostgreSQL│
                                                   │  :5432   │
                                                   └────┬─────┘
                                                        │
                                              Volume: postgres_data
```

### 2. Production Cloud Architecture
```text
┌─────────────────┐       HTTPS / WSS        ┌─────────────────┐
│     Vercel      │─────────────────────────▶│     Render      │
│  (VR Frontend)  │                          │  (VR Backend)   │
└─────────────────┘                          └────────┬────────┘
                                                      │
                                                      │ PostgreSQL Connection Pool
                                                      ▼
                                             ┌─────────────────┐
                                             │Managed Postgres │
                                             └─────────────────┘
```

---

## 🐳 Docker Deployment Guide

### Prerequisites
* [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/) installed.

### 1. Quick Start with Docker Compose
```bash
# 1. Clone the repository
git clone https://github.com/lingarajuk/vr-connect.git
cd vr-connect

# 2. Build Docker images
docker compose build

# 3. Start services in background
docker compose up -d

# 4. View running container status
docker compose ps
```

### 2. Access Running Containers
* **Frontend Application**: [http://localhost:3000](http://localhost:3000)
* **Backend API & WebSockets**: [http://localhost:5000](http://localhost:5000)
* **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
* **PostgreSQL Database**: `localhost:5432` (`user: vr_user`, `db: vr_connect`)

### 3. View Live Logs
```bash
# View all container logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View frontend logs only
docker compose logs -f frontend

# View PostgreSQL logs only
docker compose logs -f postgres
```

### 4. Stop Services Safely
```bash
# Stop containers while preserving database volume
docker compose down
```
> [!IMPORTANT]
> Do NOT use `docker compose down -v` unless you intentionally wish to delete all stored database data.

---

## 💻 Local Non-Docker Development Guide

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```
Backend runs on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

### 3. Run Automated Backend Test Suite
```bash
cd backend
npm test
```

---

## 🔑 Environment Variables Reference

### Root & Backend (`backend/.env.example`)
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://vr_user:your_password@postgres:5432/vr_connect
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth 2.0 (Optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### Frontend (`frontend/.env.example`)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🔒 Security Best Practices Implemented
1. **Multi-Stage Builds**: Strips development dependencies and build tooling from final production images.
2. **Non-Root Execution**: Backend runs under unprivileged `node` user (`USER node`).
3. **No Embedded Secrets**: `.env` files and credentials are never baked into Docker images.
4. **Isolated Network**: Services communicate through an internal Docker bridge network (`vr_network`).
5. **Data Persistence**: Database storage is isolated inside named Docker volume `postgres_data`.
