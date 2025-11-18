// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/guilds.ts
// Guild management routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { requireGuildAdmin } from '../auth/middleware.js';
import { getUserGuilds } from '../auth/discord-oauth.js';
import { getModuleLogger } from '../../utils/logger.js';

const logger = getModuleLogger('guilds-routes');
const prisma = getPrismaClient();

export async function guildsRoutes(server: FastifyInstance): Promise<void> {
  // Get list of guilds for authenticated user
  server.get('/', async (request, reply) => {
    const user = (request as any).session?.user;
    
    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    try {
      const accessToken = (request as any).session?.accessToken;
      
      if (!accessToken) {
        return reply.code(401).send({ error: 'No access token' });
      }

      // Get guilds from Discord
      const discordGuilds = await getUserGuilds(accessToken);
      
      // Get guild data from database
      const dbGuilds = await prisma.guild.findMany({
        select: {
          id: true,
          name: true,
        },
      });
      
      // Mark guilds where bot is present
      const guildsWithBotStatus = discordGuilds.map(guild => ({
        ...guild,
        hasBot: dbGuilds.some(dbGuild => dbGuild.id === guild.id),
      }));

      return guildsWithBotStatus;
    } catch (error) {
      logger.error({ error }, 'Failed to get user guilds');
      return reply.code(500).send({ error: 'Failed to get guilds' });
    }
  });

  // Get guild settings
  server.get<{
    Params: { guildId: string };
  }>('/:guildId/settings', async (request, reply) => {
    // Add guildId to request for middleware
    (request as any).params = { guildId: request.params.guildId };
    await requireGuildAdmin(request as any, reply);
    if (reply.sent) return;

    const { guildId } = request.params;

    try {
      const guild = await prisma.guild.findUnique({
        where: { id: guildId },
      });

      if (!guild) {
        return reply.code(404).send({ error: 'Guild not found' });
      }

      return guild;
    } catch (error) {
      logger.error({ error }, 'Failed to get guild settings');
      return reply.code(500).send({ error: 'Failed to get settings' });
    }
  });

  // Update guild settings
  server.put<{
    Params: { guildId: string };
    Body: {
      timezone?: string;
      locale?: string;
      logChannelId?: string;
      archiveChannelId?: string;
      managerRoleId?: string;
      commandPrefix?: string;
    };
  }>('/:guildId/settings', async (request, reply) => {
    // Add guildId to request for middleware
    (request as any).params = { guildId: request.params.guildId };
    await requireGuildAdmin(request as any, reply);
    if (reply.sent) return;

    const { guildId } = request.params;
    const updateData: any = {};

    if (request.body.timezone !== undefined) updateData.timezone = request.body.timezone;
    if (request.body.locale !== undefined) updateData.locale = request.body.locale;
    if (request.body.logChannelId !== undefined) updateData.logChannelId = request.body.logChannelId;
    if (request.body.archiveChannelId !== undefined) updateData.archiveChannelId = request.body.archiveChannelId;
    if (request.body.managerRoleId !== undefined) updateData.managerRoleId = request.body.managerRoleId;
    if (request.body.commandPrefix !== undefined) updateData.commandPrefix = request.body.commandPrefix;

    try {
      const guild = await prisma.guild.update({
        where: { id: guildId },
        data: updateData,
      });

      logger.info({ guildId, updates: Object.keys(updateData) }, 'Guild settings updated');
      return guild;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Guild not found' });
      }
      logger.error({ error }, 'Failed to update guild settings');
      return reply.code(500).send({ error: 'Failed to update settings' });
    }
  });

  // Get guild statistics
  server.get<{
    Params: { guildId: string };
  }>('/:guildId/stats', async (request, reply) => {
    const { guildId } = request.params;

    try {
      const [totalEvents, activeEvents, scheduledEvents, totalTemplates, totalParticipants] = await Promise.all([
        prisma.event.count({ where: { guildId } }),
        prisma.event.count({ where: { guildId, status: 'active' } }),
        prisma.event.count({ where: { guildId, status: 'scheduled' } }),
        prisma.template.count({ where: { guildId } }),
        prisma.participant.count({
          where: {
            event: {
              guildId,
            },
          },
        }),
      ]);

      return {
        totalEvents,
        activeEvents,
        scheduledEvents,
        totalTemplates,
        totalParticipants,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get guild stats');
      return reply.code(500).send({ error: 'Failed to get statistics' });
    }
  });
}
