# Stage 1: Build & Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies cleanly
RUN npm ci --only=production

# Stage 2: Final Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Create uploads directory and set permissions for non-root node user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Copy node_modules from dependencies stage
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

# Use non-root node user for container security
USER node

# Expose backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the production server
CMD ["node", "src/server.js"]
