// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/session-helpers.ts
// Session helper functions

import { FastifyRequest } from 'fastify';
import { config } from '../../../config/env.js';
import { AdminGuild } from './guild-permissions.js';

// Admin user IDs from environment
const ADMIN_IDS = (config.ADMIN_USER_IDS || '').split(',').filter(id => id.trim());

export interface SessionUser {
  id: string;
  username: string;
  avatar: string | null;
}

/**
 * Get avatar URL from Discord user data
 */
export function getAvatarUrl(userId: string, avatarHash: string | null): string | null {
  if (!avatarHash) return null;
  const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=128`;
}

/**
 * Store user session data
 */
export function storeUserSession(
  request: FastifyRequest,
  userId: string,
  username: string,
  avatarHash: string | null,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  adminGuilds: AdminGuild[]
): void {
  const session = (request as any).session;

  session.user = {
    id: userId,
    username: username,
    avatar: getAvatarUrl(userId, avatarHash),
  };

  session.accessToken = accessToken;
  session.refreshToken = refreshToken;
  session.expiresAt = Date.now() + expiresIn * 1000;
  session.adminGuilds = adminGuilds;
  session.isBotAdmin = ADMIN_IDS.includes(userId);
}

/**
 * Check if user is bot admin
 */
export function isBotAdmin(userId: string): boolean {
  return ADMIN_IDS.includes(userId);
}

/**
 * Get user from session
 */
export function getUserFromSession(request: FastifyRequest): SessionUser | null {
  return (request as any).session?.user || null;
}

/**
 * Get admin guilds from session
 */
export function getAdminGuildsFromSession(request: FastifyRequest): AdminGuild[] {
  return (request as any).session?.adminGuilds || [];
}

/**
 * Get access token from session
 */
export function getAccessTokenFromSession(request: FastifyRequest): string | null {
  return (request as any).session?.accessToken || null;
}

/**
 * Determine redirect URL after login
 */
export function getRedirectUrl(
  isBotAdmin: boolean,
  hasGuildAdmin: boolean,
  defaultReturnTo: string
): string {
  // 1. Bot admins go to /select-panel (choose between bot admin and guild admin)
  if (isBotAdmin) {
    return '/select-panel';
  }
  
  // 2. Guild admins go to /servers (server selection)
  if (hasGuildAdmin) {
    return '/servers';
  }
  
  // 3. Regular users go to returnTo
  return defaultReturnTo;
}
