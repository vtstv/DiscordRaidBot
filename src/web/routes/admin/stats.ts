// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Statistics routes for admin panel

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { requireAdmin } from './middleware.js';

const logger = getModuleLogger('admin-stats');
const prisma = getPrismaClient();

export async function statsRoutes(server: FastifyInstance): Promise<void> {
  // Get statistics
  server.get('/stats', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      const [
        totalGuilds,
        totalEvents,
        totalTemplates,
        totalParticipants,
        activeEvents,
        scheduledEvents,
        completedEvents
      ] = await Promise.all([
        prisma.guild.count(),
        prisma.event.count(),
        prisma.template.count(),
        prisma.participant.count(),
        prisma.event.count({ where: { status: 'active' } }),
        prisma.event.count({ where: { status: 'scheduled' } }),
        prisma.event.count({ where: { status: 'completed' } })
      ]);

      // Return flat structure for BotAdminPanel
      return {
        totalGuilds,
        totalEvents,
        totalTemplates,
        totalParticipants,
        activeEvents,
        scheduledEvents,
        completedEvents
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get admin stats');
      return reply.code(500).send({ error: 'Failed to get statistics' });
    }
  });

  // Get analytics
  server.get('/analytics', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        recentEvents,
        eventsByStatus,
        topGuilds,
        participationStats
      ] = await Promise.all([
        prisma.event.count({
          where: { createdAt: { gte: thirtyDaysAgo } }
        }),
        prisma.event.groupBy({
          by: ['status'],
          _count: true
        }),
        prisma.guild.findMany({
          take: 10,
          orderBy: {
            events: { _count: 'desc' }
          },
          include: {
            _count: {
              select: { events: true, templates: true }
            }
          }
        }),
        prisma.participant.groupBy({
          by: ['status'],
          _count: true
        })
      ]);

      // Calculate daily event creation trend
      const dailyStats = await prisma.$queryRaw<any[]>`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as count
        FROM events
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;

      return {
        overview: {
          recentEvents,
          eventsByStatus: Object.fromEntries(
            eventsByStatus.map(item => [item.status, item._count])
          ),
          participationByStatus: Object.fromEntries(
            participationStats.map(item => [item.status, item._count])
          )
        },
        topGuilds: topGuilds.map(guild => ({
          id: guild.id,
          name: guild.name,
          eventCount: guild._count.events,
          templateCount: guild._count.templates
        })),
        dailyTrend: dailyStats.map(stat => ({
          date: stat.date,
          count: Number(stat.count)
        }))
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get analytics');
      return reply.code(500).send({ error: 'Failed to get analytics' });
    }
  });

  // Get command usage analytics
  server.get('/analytics/commands', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get command usage stats from log entries
      const commandLogs = await prisma.logEntry.findMany({
        where: {
          action: 'COMMAND_EXECUTED',
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          details: true,
          createdAt: true,
          guildId: true,
        }
      });

      // Parse and aggregate command usage
      const commandStats: Record<string, number> = {};
      const dailyUsage: Record<string, number> = {};

      for (const log of commandLogs) {
        const details = log.details as any;
        if (details?.command) {
          commandStats[details.command] = (commandStats[details.command] || 0) + 1;
          
          const date = log.createdAt.toISOString().split('T')[0];
          dailyUsage[date] = (dailyUsage[date] || 0) + 1;
        }
      }

      return {
        totalCommands: commandLogs.length,
        commandsByName: Object.entries(commandStats)
          .sort(([, a], [, b]) => b - a)
          .map(([command, count]) => ({ command, count })),
        dailyUsage: Object.entries(dailyUsage)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count }))
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get command analytics');
      return reply.code(500).send({ error: 'Failed to get command analytics' });
    }
  });
}
