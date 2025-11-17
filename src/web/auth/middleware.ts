// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/auth/middleware.ts
// Authentication and authorization middleware

import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthSession, getGuildMember, getUserGuilds, hasAdminPermissions } from './discord-oauth.js';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';

const prisma = getPrismaClient();
const logger = getModuleLogger('auth-middleware');

/**
 * Get auth session from cookie
 */
function getAuthSession(request: FastifyRequest): AuthSession | null {
  const authCookie = request.cookies.auth;
  if (!authCookie) return null;

  try {
    const session = JSON.parse(authCookie) as AuthSession;
    
    // Check if expired
    if (Date.now() >= session.expiresAt) {
      return null;
    }

    return session;
  } catch (error) {
    logger.error({ error }, 'Failed to parse auth cookie');
    return null;
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const session = getAuthSession(request);

  if (!session) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required. Please log in at /auth/login',
    });
    return;
  }

  // Attach session to request for later use
  (request as any).authSession = session;
}

/**
 * Require guild access middleware
 * Checks if user is member of the guild
 */
export async function requireGuildAccess(
  request: FastifyRequest<{
    Querystring: { guildId?: string };
    Params: { guildId?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;

  const session = (request as any).authSession as AuthSession;
  const guildId = request.query.guildId || request.params.guildId;

  if (!guildId) {
    reply.code(400).send({
      error: 'Bad Request',
      message: 'Guild ID is required',
    });
    return;
  }

  // Get user's guilds
  const guilds = await getUserGuilds(session.accessToken);
  const guild = guilds.find(g => g.id === guildId);

  if (!guild) {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'You are not a member of this guild',
    });
    return;
  }

  // Attach guild info to request
  (request as any).guild = guild;
}

/**
 * Require guild admin permissions
 * User must be guild owner or have ADMINISTRATOR/MANAGE_GUILD permissions
 */
export async function requireGuildAdmin(
  request: FastifyRequest<{
    Querystring: { guildId?: string };
    Params: { guildId?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  await requireGuildAccess(request, reply);
  if (reply.sent) return;

  const guild = (request as any).guild;

  // Check if user has admin permissions
  if (!guild.owner && !hasAdminPermissions(guild.permissions)) {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Administrator permissions required',
    });
    return;
  }
}

/**
 * Require guild manager role
 * User must have configured manager role or be admin
 */
export async function requireGuildManager(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // First check auth
  await requireAuth(request, reply);
  if (reply.sent) return;

  const session = (request as any).authSession as AuthSession;
  const guildId = 
    (request as any).query?.guildId || 
    (request as any).params?.guildId || 
    (request as any).body?.guildId;

  if (!guildId) {
    reply.code(400).send({
      error: 'Bad Request',
      message: 'Guild ID is required in query, params, or body',
    });
    return;
  }

  // Get user's guilds
  const guilds = await getUserGuilds(session.accessToken);
  const guild = guilds.find(g => g.id === guildId);

  if (!guild) {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'You are not a member of this guild',
    });
    return;
  }

  // Store guild info for route handler
  (request as any).guild = guild;

  // Owner and admins always have access
  if (guild.owner || hasAdminPermissions(guild.permissions)) {
    return;
  }

  // Get guild settings
  const guildSettings = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { managerRoleId: true },
  });

  if (!guildSettings?.managerRoleId) {
    // No manager role configured, require admin
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Manager role not configured. Administrator permissions required.',
    });
    return;
  }

  // Check if user has manager role
  const member = await getGuildMember(guildId, session.user.id);
  if (!member) {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Unable to verify guild membership',
    });
    return;
  }

  if (!member.roles.includes(guildSettings.managerRoleId)) {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Manager role required',
    });
    return;
  }
}

/**
 * Optional auth middleware
 * Sets user info if authenticated, but doesn't require auth
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const session = getAuthSession(request);

  if (session) {
    (request as any).authSession = session;
    (request as any).user = session.user;
  }
}
