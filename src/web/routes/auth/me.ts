// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/me.ts
// Current user info route handler

import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserFromSession, getAdminGuildsFromSession, isBotAdmin } from './session-helpers.js';

/**
 * GET /auth/me
 * Get current user info
 */
export async function meHandler(
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

  const adminGuilds = getAdminGuildsFromSession(request);
  // Check if user is admin: either password auth (id='admin') or Discord OAuth with whitelisted ID
  const isAdmin = user.id === 'admin' || isBotAdmin(user.id);

  reply.send({ 
    user,
    adminGuilds,
    isBotAdmin: isAdmin,
  });
}
