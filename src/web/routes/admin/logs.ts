// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Logs and audit routes for admin panel

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { requireAdmin } from './middleware.js';

const logger = getModuleLogger('admin-logs');
const prisma = getPrismaClient();

export async function logRoutes(server: FastifyInstance): Promise<void> {
  // Get recent activity logs
  server.get<{
    Querystring: {
      limit?: number;
      offset?: number;
      guildId?: string;
    };
  }>('/logs', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { limit = 100, offset = 0, guildId } = request.query;

      const where: any = {};
      if (guildId) {
        where.guildId = guildId;
      }

      const [logs, total] = await Promise.all([
        prisma.logEntry.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          skip: Number(offset),
          include: {
            guild: {
              select: { name: true }
            }
          }
        }),
        prisma.logEntry.count({ where })
      ]);

      return { logs, total, limit, offset };
    } catch (error) {
      logger.error({ error }, 'Failed to get logs');
      return reply.code(500).send({ error: 'Failed to get logs' });
    }
  });

  // Get audit logs with filters
  server.get('/audit-logs', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const query = request.query as any;
      const page = parseInt(query.page || '1');
      const limit = Math.min(parseInt(query.limit || '50'), 100);
      const action = query.action !== 'all' ? query.action : undefined;
      const guildId = query.guildId || undefined;
      const userId = query.userId || undefined;
      const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
      const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

      const where: any = {};

      if (action) where.action = action;
      if (guildId) where.guildId = guildId;
      if (userId) where.userId = userId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const [logs, total] = await Promise.all([
        prisma.logEntry.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            guild: {
              select: { name: true },
            },
          },
        }),
        prisma.logEntry.count({ where }),
      ]);

      return {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          userId: log.userId,
          userName: log.username,
          guildId: log.guildId,
          guildName: log.guild.name,
          details: log.details || '',
          timestamp: log.createdAt,
        })),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch audit logs');
      return reply.code(500).send({ error: 'Failed to fetch audit logs' });
    }
  });
}
