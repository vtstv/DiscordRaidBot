// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/logout.ts
// Logout route handlers

import { FastifyRequest, FastifyReply } from 'fastify';
import { getModuleLogger } from '../../../utils/logger.js';

const logger = getModuleLogger('auth-logout');

/**
 * GET /auth/logout
 * Clear session and redirect
 */
export async function logoutGetHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return new Promise<void>((resolve) => {
    request.session.destroy((err) => {
      if (err) {
        logger.error({ err }, 'Error destroying session');
      }
      logger.info('User logged out');
      reply.redirect('/');
      resolve();
    });
  });
}

/**
 * POST /auth/logout
 * Clear session (API endpoint)
 */
export async function logoutPostHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return new Promise<void>((resolve) => {
    request.session.destroy((err) => {
      if (err) {
        logger.error({ err }, 'Error destroying session');
        reply.code(500).send({ error: 'Failed to logout' });
      } else {
        logger.info('User logged out via API');
        reply.send({ success: true });
      }
      resolve();
    });
  });
}
