// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/refresh-permissions.ts
// Refresh permissions route handler

import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserGuilds } from '../../auth/discord-oauth.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { getAdminGuildsForUser } from './guild-permissions.js';
import { getUserFromSession, getAccessTokenFromSession } from './session-helpers.js';

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

  // Re-fetch user's guilds and permissions
  const accessToken = getAccessTokenFromSession(request);
  if (!accessToken) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'No access token in session. Please log out and log in again.',
    });
  }

  try {
    // Get fresh guilds from Discord
    const guilds = await getUserGuilds(accessToken);
    
    // Get admin guilds (includes ADMINISTRATOR + dashboardRoles)
    const adminGuilds = await getAdminGuildsForUser(user.id, guilds);

    // Update session with fresh data
    (request as any).session.adminGuilds = adminGuilds;

    logger.info({ 
      userId: user.id, 
      adminGuildsCount: adminGuilds.length 
    }, 'Permissions refreshed successfully');

    reply.send({ 
      success: true,
      message: 'Permissions refreshed',
      adminGuilds,
    });
  } catch (error) {
    logger.error({ error, userId: user.id }, 'Failed to refresh permissions');
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Failed to refresh permissions',
    });
  }
}
