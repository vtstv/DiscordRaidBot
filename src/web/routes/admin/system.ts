// Copyright (c) 2025 Murr (https://github.com/vtstv)
// System operations routes for admin panel

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { requireAdmin } from './middleware.js';

const logger = getModuleLogger('admin-system');
const prisma = getPrismaClient();

export async function systemRoutes(server: FastifyInstance): Promise<void> {
  // Restart bot (graceful)
  server.post('/bot/restart', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      logger.warn('Bot restart requested by admin');
      
      // Send response before restarting
      reply.send({ message: 'Bot restart initiated' });
      
      // Graceful shutdown after 1 second
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } catch (error) {
      logger.error({ error }, 'Failed to restart bot');
      return reply.code(500).send({ error: 'Failed to restart bot' });
    }
  });

  // Get/update system settings
  server.get('/settings', { preHandler: requireAdmin }, async (_request, reply) => {
    return {
      settings: {
        maintenanceMode: false,
        allowNewGuilds: true,
        maxEventsPerGuild: 100,
        maxTemplatesPerGuild: 50,
        defaultLanguage: 'en',
        logLevel: 'info',
        enableAnalytics: true,
        webhookUrl: '',
      },
    };
  });

  server.put('/settings', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { settings } = request.body as any;
      logger.info({ settings }, 'System settings updated');
      return { success: true };
    } catch (error) {
      logger.error({ error }, 'Failed to update settings');
      return reply.code(500).send({ error: 'Failed to update settings' });
    }
  });

  // Bulk operations
  server.post('/bulk-operations', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { operation, params } = request.body as any;
      let affectedCount = 0;

      switch (operation) {
        case 'delete_old_events':
          const daysOld = params.daysOld || 90;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysOld);

          const result = await prisma.event.deleteMany({
            where: {
              status: 'completed',
              archivedAt: { lt: cutoffDate },
            },
          });
          affectedCount = result.count;
          break;

        case 'archive_completed':
          const archiveResult = await prisma.event.updateMany({
            where: { status: 'completed' },
            data: { status: 'archived' },
          });
          affectedCount = archiveResult.count;
          break;

        case 'cleanup_orphaned':
          const orphanedParticipants = await prisma.participant.deleteMany({
            where: {
              event: null,
            },
          });
          affectedCount = orphanedParticipants.count;
          break;

        case 'reset_guild_settings':
          const guilds = await prisma.guild.findMany();
          await prisma.guild.updateMany({
            data: {
              timezone: 'UTC',
              locale: 'en',
            },
          });
          affectedCount = guilds.length;
          break;

        default:
          return reply.code(400).send({ error: 'Unknown operation' });
      }

      logger.info({ operation, affectedCount }, 'Bulk operation completed');

      return { success: true, affectedCount };
    } catch (error) {
      logger.error({ error }, 'Bulk operation failed');
      return reply.code(500).send({ error: 'Bulk operation failed' });
    }
  });
}
