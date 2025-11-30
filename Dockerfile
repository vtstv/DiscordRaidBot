# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Build-time environment variable for Prisma generation
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL

# Install dependencies for Prisma and build tools
RUN apk update && apk add --no-cache \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Copy PostCSS and Tailwind config
COPY postcss.config.js ./
COPY tailwind.config.js ./

# Install all dependencies and generate Prisma Client
RUN npm ci
RUN npx prisma generate

# Copy source code
COPY src ./src

# Copy React frontend files
COPY src/web/frontend ./src/web/frontend
COPY vite.frontend.config.ts ./

# Build React frontend - will use latest code
RUN npm run build:frontend

# Note: TypeScript backend will be run via tsx, not pre-compiled
# This avoids Prisma generation issues during build time

# Copy startup script and healthcheck to build stage too
COPY docker/start.sh /start.sh
COPY docker/healthcheck.sh /healthcheck.sh
RUN chmod +x /start.sh /healthcheck.sh

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Install runtime dependencies including PostgreSQL client for pg_dump/psql
RUN apk update && apk add --no-cache \
    dumb-init \
    openssl \
    postgresql-client

# Set production environment
ENV NODE_ENV=production

# Copy package files and install production dependencies
COPY package*.json ./
COPY prisma.config.ts ./
COPY --from=build /app/package-lock.json ./
RUN npm ci --omit=dev

# Copy Prisma schema
COPY --from=build /app/prisma ./prisma

# Copy generated Prisma Client from build stage
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Copy React frontend build
COPY --from=build /app/dist/web/frontend ./dist/web/frontend

# Copy TypeScript source (will be run via tsx)
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/vite.frontend.config.ts ./vite.frontend.config.ts

# Install tsx for running TypeScript
RUN npm install -g tsx

# Copy healthcheck script
COPY docker/healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

# Copy startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Create non-root user
RUN addgroup -S nodejs && adduser -S -G nodejs nodejs

# Change ownership
RUN chown -R nodejs:nodejs /app && \
    chown nodejs:nodejs /start.sh

USER nodejs

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/healthcheck.sh"]

# Run with dumb-init and startup script
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/start.sh"]
