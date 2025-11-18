// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth.ts
// OAuth authentication routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import {
  getAuthorizationUrl,
  exchangeCode,
  getDiscordUser,
} from '../auth/discord-oauth.js';
import { config } from '../../config/env.js';
import { getModuleLogger } from '../../utils/logger.js';

const logger = getModuleLogger('auth-routes');

// Admin user IDs from environment
const ADMIN_IDS = (config.ADMIN_USER_IDS || '').split(',').filter(id => id.trim());

// Temporary in-memory store for OAuth states (in production, use Redis)
const stateStore = new Map<string, { created: number; returnTo?: string }>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.created > 10 * 60 * 1000) { // 10 minutes
      stateStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

export async function registerAuthRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /auth/login
   * Redirect to Discord OAuth
   */
  fastify.get('/auth/login', async (request: FastifyRequest<{
    Querystring: { returnTo?: string };
  }>, reply: FastifyReply) => {
    const state = crypto.randomBytes(16).toString('hex');
    const returnTo = request.query.returnTo || '/';
    stateStore.set(state, { created: Date.now(), returnTo });

    const authUrl = getAuthorizationUrl(config.DISCORD_OAUTH_REDIRECT_URI, state);
    
    logger.info({ state, returnTo }, 'Redirecting to Discord OAuth');
    reply.redirect(authUrl);
  });

  /**
   * GET /auth/callback
   * Handle OAuth callback
   */
  fastify.get<{
    Querystring: { code?: string; state?: string; error?: string };
  }>('/auth/callback', async (request, reply) => {
    const { code, state, error } = request.query;

    if (error) {
      logger.error({ error }, 'OAuth error');
      return reply.code(400).send({
        error: 'OAuth Error',
        message: error,
      });
    }

    if (!code || !state) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Missing code or state parameter',
      });
    }

    // Verify state
    if (!stateStore.has(state)) {
      logger.warn({ state }, 'Invalid OAuth state');
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid state parameter',
      });
    }

    // Get state data BEFORE deleting
    const stateData = stateStore.get(state)!;
    stateStore.delete(state);

    try {
      // Exchange code for tokens
      const tokenData = await exchangeCode(code, config.DISCORD_OAUTH_REDIRECT_URI);
      
      // Get user info
      const user = await getDiscordUser(tokenData.access_token);

      // Store user in session (same format as password auth)
      (request as any).session.user = {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      };

      // Also store tokens for API calls
      (request as any).session.accessToken = tokenData.access_token;
      (request as any).session.refreshToken = tokenData.refresh_token;
      (request as any).session.expiresAt = Date.now() + tokenData.expires_in * 1000;

      logger.info({ userId: user.id, username: user.username }, 'User logged in via Discord');

      // Get the stored returnTo or default redirect
      const returnTo = stateData.returnTo || '/';
      
      // Check if user is admin
      const isAdmin = ADMIN_IDS.includes(user.id);
      const redirectUrl = isAdmin ? '/a' : returnTo;
      
      logger.info({ userId: user.id, isAdmin, redirectUrl }, 'Redirecting after OAuth');
      reply.redirect(redirectUrl);
    } catch (error) {
      logger.error({ error }, 'Failed to complete OAuth flow');
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to complete authentication',
      });
    }
  });

  /**
   * GET /auth/logout
   * Clear session
   */
  fastify.get('/auth/logout', async (request, reply) => {
    (request as any).session.destroy();
    logger.info('User logged out');
    reply.redirect('/');
  });

  /**
   * POST /auth/logout
   * Clear session (API endpoint)
   */
  fastify.post('/auth/logout', async (request, reply) => {
    (request as any).session.destroy();
    logger.info('User logged out via API');
    reply.send({ success: true });
  });

  /**
   * GET /auth/me
   * Get current user info
   */
  fastify.get('/auth/me', async (request, reply) => {
    const user = (request as any).session?.user;
    
    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    reply.send({ user });
  });
}
