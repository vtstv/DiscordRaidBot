# Build stage
FROM node:18-alpine AS build

# Install OpenSSL for Prisma and dumb-init for signal handling
RUN apk add --no-cache openssl dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Copy startup script and healthcheck to build stage too
COPY docker/start.sh /start.sh
COPY docker/healthcheck.sh /healthcheck.sh
RUN chmod +x /start.sh /healthcheck.sh

# Runtime stage
FROM node:18-alpine AS runtime

# Install OpenSSL and dumb-init for proper signal handling
RUN apk add --no-cache openssl dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema and generated client
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application
COPY --from=build /app/dist ./dist

# Copy public directory for web interface
COPY public ./public

# Copy healthcheck script
COPY docker/healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

# Copy startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app && \
    chown nodejs:nodejs /start.sh

USER nodejs

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/healthcheck.sh"]

# Run with dumb-init and startup script
ENTRYPOINT ["dumb-init", "--"]
CMD ["/start.sh"]
