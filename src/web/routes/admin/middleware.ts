// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Admin authentication middleware and helpers

import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../../config/env.js';

// Admin user IDs from environment
const ADMIN_IDS = (config.ADMIN_USER_IDS || '').split(',').filter(id => id.trim());

/**
 * Check if user is admin
 */
export function isAdmin(userId: string): boolean {
  return ADMIN_IDS.includes(userId);
}

/**
 * Admin authentication middleware
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).session?.user;
  
  if (!user) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }
  
  // Allow password-authenticated admin or Discord OAuth with whitelisted ID
  if (user.id !== 'admin' && !isAdmin(user.id)) {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}
