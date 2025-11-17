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

// Temporary in-memory store for OAuth states (in production, use Redis)
const stateStore = new Map<string, { created: number }>();

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
  fastify.get('/auth/login', async (_request: FastifyRequest, reply: FastifyReply) => {
    const state = crypto.randomBytes(16).toString('hex');
    stateStore.set(state, { created: Date.now() });

    const authUrl = getAuthorizationUrl(config.DISCORD_OAUTH_REDIRECT_URI, state);
    
    logger.info({ state }, 'Redirecting to Discord OAuth');
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

    stateStore.delete(state);

    try {
      // Exchange code for tokens
      const tokenData = await exchangeCode(code, config.DISCORD_OAUTH_REDIRECT_URI);
      
      // Get user info
      const user = await getDiscordUser(tokenData.access_token);

      // Create session data
      const sessionData = {
        user,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
      };

      // Store in cookie (simplified version - in production use encrypted cookies or JWT)
      reply.setCookie('auth', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: tokenData.expires_in,
      });

      logger.info({ userId: user.id, username: user.username }, 'User logged in');

      // Redirect to dashboard
      reply.redirect('/');
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
  fastify.get('/auth/logout', async (_request, reply) => {
    reply.clearCookie('auth', { path: '/' });
    logger.info('User logged out');
    reply.redirect('/');
  });

  /**
   * GET /auth/me
   * Get current user info
   */
  fastify.get('/auth/me', async (request, reply) => {
    const authCookie = request.cookies.auth;
    
    if (!authCookie) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    try {
      const sessionData = JSON.parse(authCookie);
      
      if (Date.now() >= sessionData.expiresAt) {
        reply.clearCookie('auth', { path: '/' });
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Session expired',
        });
      }

      reply.send({
        user: sessionData.user,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to parse auth cookie');
      reply.clearCookie('auth', { path: '/' });
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid session',
      });
    }
  });
}
