// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/index.ts
// Optional web dashboard using Fastify

import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from '../config/env.js';
import { getModuleLogger } from '../utils/logger.js';
import { connectDatabase, disconnectDatabase } from '../database/db.js';
import { registerRoutes } from './routes/index.js';
import { dashboardHTML } from './dashboard-template.js';

const logger = getModuleLogger('web');

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

    // Create Fastify instance
    server = Fastify({
      logger: {
        level: config.LOG_LEVEL,
      },
    });

    // Register CORS
    await server.register(cors, {
      origin: true, // Configure properly in production
    });

    // Register cookie support
    await server.register(cookie, {
      secret: config.WEB_SESSION_SECRET,
    });

    // Serve dashboard HTML FIRST
    server.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
      reply.type('text/html');
      return dashboardHTML;
    });

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register API routes
    await registerRoutes(server);

    // Start server
    await server.listen({
      port: config.WEB_PORT,
      host: '0.0.0.0',
    });

    logger.info(`Web server listening on port ${config.WEB_PORT}`);
  } catch (error) {
    logger.error({ error }, 'Failed to start web server');
    throw error;
  }
}

/**
 * Stop the web server
 */
export async function stopWebServer(): Promise<void> {
  if (server) {
    logger.info('Stopping web server...');
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
