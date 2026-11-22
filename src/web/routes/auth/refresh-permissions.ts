// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/refresh-permissions.ts
// Refresh permissions route handler

import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserGuilds, refreshAccessToken } from '../../auth/discord-oauth.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { getAdminGuildsForUser } from './guild-permissions.js';
import { 
  getUserFromSession, 
  getAccessTokenFromSession, 
  getRefreshTokenFromSession,
  getSessionExpiresAt 
} from './session-helpers.js';

const logger = getModuleLogger('auth-refresh-permissions');

/**
 * POST /auth/refresh-permissions
 * Clear cache and re-fetch user's guild permissions
 * Use this when user's roles change and they need immediate access
 */
export async function refreshPermissionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = getUserFromSession(request);
  
  if (!user) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Not authenticated',
    });
  }

  logger.info({ userId: user.id }, 'Refreshing user permissions');

  // Clear user's cache
  const { clearUserCache } = await import('../../auth/middleware.js');
  clearUserCache(user.id);

  let accessToken = getAccessTokenFromSession(request);
  const refreshToken = getRefreshTokenFromSession(request);
  const expiresAt = getSessionExpiresAt(request);

  // If token is expired or expiring soon (within 60s), or missing, refresh it
  if (refreshToken && (!accessToken || Date.now() >= expiresAt - 60000)) {
    try {
      logger.info({ userId: user.id }, 'Access token expired or expiring soon, refreshing...');
      const tokenData = await refreshAccessToken(refreshToken);
      accessToken = tokenData.access_token;
      
      const session = (request as any).session;
      session.accessToken = tokenData.access_token;
      session.refreshToken = tokenData.refresh_token;
      session.expiresAt = Date.now() + tokenData.expires_in * 1000;
    } catch (refreshErr) {
      logger.warn({ error: refreshErr, userId: user.id }, 'Failed to refresh expired access token');
      if (!accessToken) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Session expired. Please log in again.',
        });
      }
    }
  }

  if (!accessToken) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'No access token in session. Please log out and log in again.',
    });
  }

  try {
    // Get fresh guilds from Discord
    let guilds;
    try {
      guilds = await getUserGuilds(accessToken);
    } catch (guildErr: any) {
      // If 401 Unauthorized from Discord and we have a refreshToken, try refresh once
      if (refreshToken && guildErr.message?.includes('401')) {
        logger.info({ userId: user.id }, 'getUserGuilds returned 401, refreshing token and retrying...');
        const tokenData = await refreshAccessToken(refreshToken);
        accessToken = tokenData.access_token;

        const session = (request as any).session;
        session.accessToken = tokenData.access_token;
        session.refreshToken = tokenData.refresh_token;
        session.expiresAt = Date.now() + tokenData.expires_in * 1000;

        guilds = await getUserGuilds(accessToken);
      } else {
        throw guildErr;
      }
    }
    
    // Get admin guilds (includes ADMINISTRATOR + dashboardRoles)
    const adminGuilds = await getAdminGuildsForUser(user.id, guilds);

    // Update session with fresh data
    (request as any).session.adminGuilds = adminGuilds;

    logger.info({ 
      userId: user.id, 
      adminGuildsCount: adminGuilds.length 
    }, 'Permissions refreshed successfully');

    return reply.send({ 
      success: true,
      message: 'Permissions refreshed',
      adminGuilds,
    });
  } catch (error: any) {
    logger.error({ error, userId: user.id }, 'Failed to refresh permissions');
    const isRateLimit = error?.message?.includes('rate limit');
    const isUnauthorized = error?.message?.includes('401');
    const status = isUnauthorized ? 401 : isRateLimit ? 429 : 500;
    return reply.code(status).send({
      error: isUnauthorized ? 'Unauthorized' : isRateLimit ? 'Rate Limited' : 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to refresh permissions',
    });
  }
}
