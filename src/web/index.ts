// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/index.ts
// Optional web dashboard using Fastify

import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { getModuleLogger } from '../utils/logger.js';
import { connectDatabase, disconnectDatabase } from '../database/db.js';
import { registerRoutes } from './routes/index.js';

const logger = getModuleLogger('web');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server: any = null;

/**
 * Start the web server
 */
export async function startWebServer(): Promise<void> {
  if (!config.WEB_ENABLED) {
    logger.info('Web server disabled');
    return;
  }

  try {
    logger.info('Starting web server...');

    // Connect to database
    await connectDatabase();

    // Initialize Redis publisher for event notifications
    try {
      const { initializePublisher } = await import('../services/eventPublisher.js');
      await initializePublisher();
      logger.info('Event publisher initialized');
    } catch (error) {
      logger.warn({ error }, 'Failed to initialize event publisher - redis package may not be installed. Events created via web will not be sent to Discord automatically.');
    }

    // Create Fastify instance
    server = Fastify({
      logger: {
        level: config.LOG_LEVEL,
      },
      trustProxy: true, // Trust X-Forwarded-* headers from reverse proxy (nginx)
    });

    // Register CORS
    logger.info('Registering CORS plugin...');
    await server.register(cors, {
      origin: true,
      credentials: true, // Allow credentials (cookies)
    });
    logger.info('CORS registered');

    // Register cookie support
    logger.info('Registering cookie plugin...');
    await server.register(cookie, {
      secret: config.WEB_SESSION_SECRET,
    });
    logger.info('Cookie registered');

    // Register session support
    logger.info('Registering session plugin...');
    await server.register(session, {
      secret: config.WEB_SESSION_SECRET,
      cookie: {
        // Only require HTTPS in production AND when not on localhost
        // This allows testing production builds locally
        secure: config.NODE_ENV === 'production' && !config.WEB_BASE_URL?.includes('localhost'),
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
        path: '/',
      },
      saveUninitialized: false,
      rolling: true, // Refresh session on each request
    });
    logger.info('Session registered');

    // Register static files for React frontend
    // In production: dist/web/frontend (built by Vite)
    // In development: served by Vite dev server on port 5173
    const frontendRoot = config.NODE_ENV === 'production' 
      ? path.join(__dirname, '..', '..', 'dist', 'web', 'frontend')
      : path.join(__dirname, '..', '..', 'dist', 'web', 'frontend'); // fallback to dist even in dev
    
    // Serve React static files (no prefix, files are accessed directly like /assets/...)
    logger.info(`Registering static files plugin from: ${frontendRoot}`);
    await server.register(fastifyStatic, {
      root: frontendRoot,
      decorateReply: true, // Enable reply.sendFile()
    });
    logger.info('Static files registered');

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Config endpoint for frontend
    server.get('/api/config', async () => {
      return {
        apiBaseUrl: config.WEB_BASE_URL || `http://localhost:${config.WEB_PORT}`,
        discordClientId: config.DISCORD_CLIENT_ID,
      };
    });

    // Register API routes
    logger.info('Registering API routes...');
    await registerRoutes(server);
    logger.info('API routes registered');

    // Serve React frontend for all non-API routes
    // This catches all routes and serves index.html for client-side routing
    server.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
      // If it's an API route, return 404 JSON
      if (request.url.startsWith('/api/') || request.url.startsWith('/auth/')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      // Otherwise serve React app index.html (including /a route)
      reply.type('text/html');
      
      // Read index.html and inject environment variables
      const fs = await import('fs/promises');
      const indexPath = path.join(frontendRoot, 'index.html');
      let html = await fs.readFile(indexPath, 'utf-8');
      
      // Replace placeholders with actual values
      html = html.replace('%DISCORD_CLIENT_ID%', config.DISCORD_CLIENT_ID);
      
      return reply.send(html);
    });

    // Start server
    await server.listen({
      port: config.WEB_PORT,
      host: '0.0.0.0',
    });

    logger.info(`Web server listening on port ${config.WEB_PORT}`);
  } catch (error) {
    logger.error({ error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error }, 'Failed to start web server');
    throw error;
  }
}

/**
 * Stop the web server
 */
export async function stopWebServer(): Promise<void> {
  if (server) {
    logger.info('Stopping web server...');
    try {
      const { closePublisher } = await import('../services/eventPublisher.js');
      await closePublisher();
    } catch (error) {
      // Redis not available, skip
    }
    await server.close();
    server = null;
    await disconnectDatabase();
    logger.info('Web server stopped');
  }
}

// Entry point for standalone web server
if (import.meta.url === `file://${process.argv[1]}`) {
  startWebServer().catch((error) => {
    logger.fatal({ error }, 'Fatal error during web server startup');
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await stopWebServer();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await stopWebServer();
    process.exit(0);
  });
}
