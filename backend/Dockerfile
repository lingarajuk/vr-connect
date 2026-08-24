# Production Dockerfile for VR Connect Backend
FROM node:20-alpine AS base

# Install build dependencies for native modules (sqlite3, bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose server port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5000

# Start command
CMD ["node", "src/server.js"]
