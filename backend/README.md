# VR Connect - Backend Server API & Real-Time Engine

Production-ready REST API and Socket.IO real-time server for the VR Connect chat application.

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-Time Communication**: Socket.IO
- **Database & ORM**: Sequelize ORM
  - **Local Development**: SQLite (zero-config, instant local execution)
  - **Production / Render**: PostgreSQL (`DATABASE_URL`)
- **Authentication**: JWT (JSON Web Tokens) + Bcrypt password & PIN hashing
- **File & Media Storage**: Multer with file type verification
- **Security**: Helmet, CORS, Express Rate Limiting

---

## 📁 Directory Structure

```text
backend/
├── src/
│   ├── config/
│   │   └── database.js         # SQLite / PostgreSQL auto-switching connection
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, Me, PIN setup & verification
│   │   ├── userController.js   # User directory search & profile update
│   │   ├── chatController.js   # Direct & Group chat creation and settings
│   │   ├── messageController.js# Send, fetch, delete & read receipts
│   │   └── uploadController.js # Media file upload handler
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT token protection
│   │   ├── uploadMiddleware.js # Multer file upload & security filter
│   │   └── errorMiddleware.js  # Global error handling
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Chat.js             # Conversation model
│   │   ├── ChatMember.js       # Membership & unread counter model
│   │   ├── Message.js          # Message & disappearing metadata model
│   │   └── index.js            # Sequelize associations
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth/*
│   │   ├── userRoutes.js       # /api/users/*
│   │   ├── chatRoutes.js       # /api/chats/*
│   │   ├── messageRoutes.js    # /api/messages/*
│   │   └── uploadRoutes.js     # /api/upload
│   ├── services/
│   │   └── messageService.js   # Message business logic & disappearing cleanup
│   ├── sockets/
│   │   └── chatSocket.js       # Real-time events, typing, presence, signaling
│   ├── utils/
│   │   ├── jwt.js              # Token signing & decoding
│   │   └── validation.js       # Input validators
│   └── server.js               # Application entrypoint
├── uploads/                    # Media upload directory
├── Dockerfile                  # Production container definition
├── package.json
├── .env.example
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Port (Render sets this automatically)
PORT=5000

# Environment Mode
NODE_ENV=development

# Database URL (leave blank for local SQLite or provide PostgreSQL URI)
DATABASE_URL=

# JWT Secret Key
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Allowed Frontend Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

---

## 🚀 Running Locally

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Start development server with auto-reload
npm run dev

# Or start in production mode
npm start
```

Server will run at `http://localhost:5000`.

---

## 🐳 Docker Deployment

Build and run using Docker:

```bash
# Build the Docker image
docker build -t vr-connect-backend .

# Run the container
docker run -p 5000:5000 \
  -e JWT_SECRET=your_production_secret \
  -e CLIENT_URL=https://your-frontend.vercel.app \
  vr-connect-backend
```

---

## 🌐 Deploying to Render

1. Create a **Web Service** on [Render](https://render.com).
2. Set the Root Directory to `backend`.
3. Set Build Command: `npm install`.
4. Set Start Command: `npm start`.
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `<your-secure-random-secret>`
   - `CLIENT_URL` = `https://<your-frontend-subdomain>.vercel.app`
   - (Optional) `DATABASE_URL` = Attach a **Render PostgreSQL** database internal connection string.
