// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/auth/middleware.ts
// Authentication and authorization middleware

import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthSession, getGuildMember, getUserGuilds, hasAdminPermissions } from './discord-oauth.js';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';

const prisma = getPrismaClient();
const logger = getModuleLogger('auth-middleware');

// Cache for guild member checks to avoid rate limiting
// Key: `userId:guildId`, Value: { member: GuildMemberInfo, expiresAt: number }
const guildMemberCache = new Map<string, { member: any; expiresAt: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Clean up expired cache entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of guildMemberCache.entries()) {
    if (value.expiresAt <= now) {
      guildMemberCache.delete(key);
    }
  }
}, 60 * 1000);

/**
 * Clear guild member cache for specific guild
 * Call this when permissions or roles change to force fresh data
 */
export function clearGuildMemberCache(guildId: string): void {
  let cleared = 0;
  for (const key of guildMemberCache.keys()) {
    if (key.endsWith(`:${guildId}`)) {
      guildMemberCache.delete(key);
      cleared++;
    }
  }
  logger.info({ guildId, cleared }, 'Cleared guild member cache');
}

/**
 * Clear all cache for specific user
 * Call this after login to ensure fresh data
 */
export function clearUserCache(userId: string): void {
  let cleared = 0;
  for (const key of guildMemberCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      guildMemberCache.delete(key);
      cleared++;
    }
  }
  logger.info({ userId, cleared }, 'Cleared user cache');
}

/**
 * Get auth session from request.session (Fastify session)
 */
function getAuthSession(request: FastifyRequest): AuthSession | null {
  const session = (request as any).session;
  const user = session?.user;
  if (!user) return null;

  try {
    // Build AuthSession from Fastify session
    return {
      user,
      accessToken: session.accessToken || '',
      refreshToken: session.refreshToken || '',
      expiresAt: session.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days default
    };
  } catch (error) {
    logger.error({ error }, 'Failed to get auth session');
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

  try {
    // Check if guild exists in database (guilds table is synced by bot on startup)
    // If guild is in DB, bot is present in it
    const guildInDb = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { id: true, name: true, managerRoleId: true },
    });

    // If guild not in database, bot is not present
    if (!guildInDb) {
      // Get guild name from OAuth for better error message
      try {
        const userGuilds = await getUserGuilds(session.accessToken);
        const userGuild = userGuilds.find(g => g.id === guildId);
        
        logger.warn({ userId: session.user.id, guildId }, 'Bot not present - guild not in database');
        reply.code(404).send({
          error: 'Bot Not In Guild',
          message: 'The bot is not present in this guild. Please invite the bot to use the dashboard.',
          guildName: userGuild?.name || 'Unknown Guild',
        });
        return;
      } catch (error) {
        // If OAuth fails, still return error but without guild name
        logger.warn({ userId: session.user.id, guildId, error }, 'Bot not present, OAuth failed');
        reply.code(404).send({
          error: 'Bot Not In Guild',
          message: 'The bot is not present in this guild. Please invite the bot to use the dashboard.',
          guildName: 'Unknown Guild',
        });
        return;
      }
    }

    // Bot is present - check user permissions via cache or OAuth
    const guildsCacheKey = `${session.user.id}:guilds`;
    const cachedGuilds = guildMemberCache.get(guildsCacheKey);
    
    let userGuilds: any[];
    let userGuild: any;
    
    if (cachedGuilds && cachedGuilds.expiresAt > Date.now()) {
      userGuilds = cachedGuilds.member;
      userGuild = userGuilds.find(g => g.id === guildId);
      logger.debug({ userId: session.user.id, guildId }, 'Using cached user guilds');
    } else {
      try {
        userGuilds = await getUserGuilds(session.accessToken);
        userGuild = userGuilds.find(g => g.id === guildId);
        
        // Cache the guilds list (shorter TTL to avoid stale data)
        guildMemberCache.set(guildsCacheKey, {
          member: userGuilds,
          expiresAt: Date.now() + (60 * 1000), // 1 minute only for guilds list
        });
        logger.debug({ userId: session.user.id, guildId }, 'Cached user guilds');
      } catch (error) {
        // If OAuth fails but bot is in guild, continue with DB check only
        logger.warn({ userId: session.user.id, guildId, error }, 'Failed to get user guilds via OAuth, falling back to DB check');
        userGuild = null;
      }
    }

    if (!userGuild) {
      logger.warn({ userId: session.user.id, guildId }, 'User not found in guild via OAuth');
      reply.code(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this guild',
      });
      return;
    }

    // Check if user has admin permissions via OAuth
    const isOwner = userGuild.owner;
    const hasAdminPerms = hasAdminPermissions(userGuild.permissions);

    if (isOwner || hasAdminPerms) {
      logger.debug({ userId: session.user.id, guildId, isOwner, hasAdminPerms }, 'User has admin permissions via OAuth');
      (request as any).guildMember = { roles: [] }; // Placeholder
      return;
    }

    // If not owner/admin, check manager role via bot API
    // Check cache first to avoid rate limiting
    const cacheKey = `${session.user.id}:${guildId}`;
    const cached = guildMemberCache.get(cacheKey);
    
    let member: any;
    if (cached && cached.expiresAt > Date.now()) {
      member = cached.member;
      logger.debug({ userId: session.user.id, guildId }, 'Using cached guild member data');
    } else {
      logger.info({ userId: session.user.id, guildId }, 'Fetching guild member from Discord API');
      member = await getGuildMember(guildId, session.user.id);
      if (member) {
        guildMemberCache.set(cacheKey, {
          member,
          expiresAt: Date.now() + CACHE_DURATION_MS,
        });
        logger.debug({ userId: session.user.id, guildId }, 'Cached guild member data');
      }
    }

    // Check manager role if set
    if (guildInDb.managerRoleId && member?.roles.includes(guildInDb.managerRoleId)) {
      (request as any).guildMember = member;
      return;
    }

    // No admin permissions and no manager role
    logger.warn({ userId: session.user.id, guildId, hasManagerRole: !!guildInDb.managerRoleId }, 'User lacks required permissions');
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Administrator or manager role required',
    });
    return;

  } catch (error) {
    logger.error({ error, guildId }, 'Failed to verify guild admin');
    reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Failed to verify permissions',
    });
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
