// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Guild management routes for admin panel

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { requireAdmin } from './middleware.js';

const logger = getModuleLogger('admin-guilds');
const prisma = getPrismaClient();

export async function guildRoutes(server: FastifyInstance): Promise<void> {
  // Get all guilds
  server.get('/guilds', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      const guilds = await prisma.guild.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              events: true,
              templates: true
            }
          }
        }
      });

      // Note: In multi-container setup, web cannot access bot's Discord client
      // We rely on database information only
      const enrichedGuilds = guilds.map(guild => ({
        id: guild.id,
        name: guild.name || 'Unknown',
        memberCount: 0, // Not available in multi-container setup
        online: true, // Assume online if in database
        _count: guild._count
      }));

      return enrichedGuilds;
    } catch (error) {
      logger.error({ error }, 'Failed to get guilds');
      return reply.code(500).send({ error: 'Failed to get guilds' });
    }
  });

  // Get guild details
  server.get<{
    Params: { guildId: string };
  }>('/guilds/:guildId', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const guild = await prisma.guild.findUnique({
        where: { id: request.params.guildId },
        include: {
          _count: {
            select: {
              events: true,
              templates: true
            }
          }
        }
      });

      if (!guild) {
        return reply.code(404).send({ error: 'Guild not found' });
      }

      return guild;
    } catch (error) {
      logger.error({ error, guildId: request.params.guildId }, 'Failed to get guild details');
      return reply.code(500).send({ error: 'Failed to get guild details' });
    }
  });

  // Delete guild data
  server.delete<{
    Params: { guildId: string };
  }>('/guilds/:guildId/data', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { guildId } = request.params;

      await prisma.$transaction([
        prisma.participant.deleteMany({ where: { event: { guildId } } }),
        prisma.event.deleteMany({ where: { guildId } }),
        prisma.template.deleteMany({ where: { guildId } }),
        prisma.logEntry.deleteMany({ where: { guildId } }),
        prisma.guild.delete({ where: { id: guildId } })
      ]);

      logger.info({ guildId }, 'Guild data deleted');

      return { success: true, message: 'Guild data deleted successfully' };
    } catch (error) {
      logger.error({ error, guildId: (request.params as any).guildId }, 'Failed to delete guild data');
      return reply.code(500).send({ error: 'Failed to delete guild data' });
    }
  });
}
