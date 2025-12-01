// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/guilds.ts
// User's admin guilds route handler

import { FastifyRequest, FastifyReply } from 'fastify';
import { getGuildMember } from '../../auth/discord-oauth.js';
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
  const filteredGuilds: any[] = [];
  
  for (const g of adminGuilds) {
    const hasBot = botGuildIds.has(g.id);
    const inDB = dbGuildIds.has(g.id);
    
    // Skip if neither bot present nor data in DB
    if (!hasBot && !inDB) {
      logger.debug({ guildId: g.id, guildName: g.name }, 'Skipping guild - no bot and no data');
      continue;
    }
    
    // If bot is present, verify user is actually a member via Discord API
    // If bot is NOT present, we can't verify membership (bot can't access guild info)
    // so trust the OAuth data (guild is in adminGuilds = user has access)
    if (hasBot) {
      const memberInfo = await getGuildMember(g.id, user.id);
      if (!memberInfo) {
        logger.debug({ guildId: g.id, guildName: g.name, userId: user.id }, 'Skipping guild - user not a member');
        continue;
      }
    }
    
    filteredGuilds.push({
      ...g,
      hasBot, // true if bot present, false if only data in DB
    });
    
    logger.debug({
      guildId: g.id,
      guildName: g.name,
      hasBot,
      inDB
    }, 'Guild included in list');
  }
  
  logger.debug({ resultCount: filteredGuilds.length }, 'Filtered guilds result');
  
  reply.send({ guilds: filteredGuilds });
}
