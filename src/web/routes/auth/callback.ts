// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/callback.ts
// OAuth callback route handler

import { FastifyRequest, FastifyReply } from 'fastify';
import {
  exchangeCode,
  getDiscordUser,
  getUserGuilds,
} from '../../auth/discord-oauth.js';
import { config } from '../../../config/env.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { consumeState } from './oauth-state.js';
import { getAdminGuildsForUser } from './guild-permissions.js';
import { storeUserSession, isBotAdmin, getRedirectUrl } from './session-helpers.js';

const logger = getModuleLogger('auth-callback');

/**
 * GET /auth/callback
 * Handle OAuth callback
 */
export async function callbackHandler(
  request: FastifyRequest<{
    Querystring: { code?: string; state?: string; error?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
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
  const stateData = consumeState(state);
  if (!stateData) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'Invalid state parameter',
    });
  }

  try {
    // Exchange code for tokens
    const tokenData = await exchangeCode(code, config.DISCORD_OAUTH_REDIRECT_URI);
    
    // Get user info
    const user = await getDiscordUser(tokenData.access_token);

    // Get user's guilds to check permissions
    const guilds = await getUserGuilds(tokenData.access_token);
    
    // Get admin guilds (includes ADMINISTRATOR + dashboardRoles)
    const adminGuilds = await getAdminGuildsForUser(user.id, guilds);

    // Store session
    storeUserSession(
      request,
      user.id,
      user.username,
      user.avatar,
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.expires_in,
      adminGuilds
    );

    // Clear user cache to ensure fresh data on first request
    const { clearUserCache } = await import('../../auth/middleware.js');
    clearUserCache(user.id);

    logger.info({ 
      userId: user.id, 
      username: user.username,
      adminGuildsCount: adminGuilds.length,
      isBotAdmin: isBotAdmin(user.id),
    }, 'User logged in via Discord');

    // Determine redirect URL
    const returnTo = stateData.returnTo || '/';
    const redirectUrl = getRedirectUrl(
      isBotAdmin(user.id),
      adminGuilds.length > 0,
      returnTo
    );
    
    logger.info({ 
      userId: user.id, 
      isBotAdmin: isBotAdmin(user.id), 
      hasGuildAdmin: adminGuilds.length > 0,
      redirectUrl 
    }, 'Redirecting after OAuth');
    
    reply.redirect(redirectUrl);
  } catch (error) {
    logger.error({ error }, 'Failed to complete OAuth flow');
    
    // Check if it's a rate limit error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('rate limited')) {
      return reply.code(429).send({
        error: 'Rate Limited',
        message: 'Discord API rate limit exceeded. Please wait a few minutes and try again.',
      });
    }
    
    reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Failed to complete authentication',
    });
  }
}
