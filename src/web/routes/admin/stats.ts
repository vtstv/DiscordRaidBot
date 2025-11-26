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

      // Note: Bot stats not available in multi-container setup
      // Web container cannot access bot container's Discord client
      const botStats = null;

      return {
        database: {
          totalGuilds,
          totalEvents,
          totalTemplates,
          totalParticipants,
          activeEvents,
          scheduledEvents,
          completedEvents
        },
        bot: botStats
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
}
