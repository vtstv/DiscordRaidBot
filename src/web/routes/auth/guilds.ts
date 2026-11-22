// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/guilds.ts
// User's admin guilds route handler

import { FastifyRequest, FastifyReply } from 'fastify';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { getBotGuildIds } from '../../../services/botGuildSync.js';
import { getUserFromSession, getAdminGuildsFromSession } from './session-helpers.js';

const logger = getModuleLogger('auth-guilds');
const prisma = getPrismaClient();

/**
 * GET /auth/guilds
 * Get user's admin guilds - show guilds where:
 * 1. (Bot present AND user is member) OR (Data in DB AND user is member)
 * 2. Mark each guild with hasBot: true/false
 * Note: User membership is already verified via Discord OAuth (/users/@me/guilds).
 */
export async function guildsHandler(
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
  
  // Get guilds where bot is actually present (from Redis synced by bot container)
  const botGuildIdsArray = await getBotGuildIds();
  const botGuildIds = new Set(botGuildIdsArray);
  
  // Get guilds that have data in database
  const guildIds = adminGuilds.map(g => g.id);
  const dbGuilds = await prisma.guild.findMany({
    where: { id: { in: guildIds } },
    select: { id: true },
  });
  const dbGuildIds = new Set(dbGuilds.map(g => g.id));
  
  logger.debug({ 
    botGuildCount: botGuildIds.size,
    dbGuildCount: dbGuildIds.size,
    adminGuildCount: adminGuilds.length 
  }, 'Checking guild presence');
  
  // Show guilds where: (bot present OR data in DB) AND user is member
  // No external Discord API calls needed: instantaneous Redis + DB filter
  const filteredGuilds = adminGuilds
    .filter(g => botGuildIds.has(g.id) || dbGuildIds.has(g.id))
    .map(g => ({
      ...g,
      hasBot: botGuildIds.has(g.id),
    }));
  
  logger.debug({ resultCount: filteredGuilds.length }, 'Filtered guilds result');
  
  return reply.send({ guilds: filteredGuilds });
}
