// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Event management routes for admin panel

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { requireAdmin } from './middleware.js';

const logger = getModuleLogger('admin-events');
const prisma = getPrismaClient();

export async function eventRoutes(server: FastifyInstance): Promise<void> {
  // Search events
  server.get<{
    Querystring: { 
      q?: string; 
      status?: string; 
      guildId?: string;
      limit?: number;
      offset?: number;
    };
  }>('/events/search', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { q, status, guildId, limit = 50, offset = 0 } = request.query;

      const where: any = {};
      
      if (q) {
        where.title = { contains: q, mode: 'insensitive' };
      }
      
      if (status) {
        where.status = status;
      }
      
      if (guildId) {
        where.guildId = guildId;
      }

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          skip: Number(offset),
          include: {
            guild: {
              select: { name: true }
            },
            _count: {
              select: { participants: true }
            }
          }
        }),
        prisma.event.count({ where })
      ]);

      return { events, total, limit, offset };
    } catch (error) {
      logger.error({ error }, 'Failed to search events');
      return reply.code(500).send({ error: 'Failed to search events' });
    }
  });

  // Bulk delete events
  server.post<{
    Body: { eventIds: string[] };
  }>('/events/bulk-delete', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { eventIds } = request.body;

      if (!eventIds || eventIds.length === 0) {
        return reply.code(400).send({ error: 'No event IDs provided' });
      }

      const result = await prisma.event.deleteMany({
        where: {
          id: { in: eventIds }
        }
      });

      logger.info({ count: result.count, eventIds }, 'Bulk deleted events');
      return { deleted: result.count };
    } catch (error) {
      logger.error({ error }, 'Failed to bulk delete events');
      return reply.code(500).send({ error: 'Failed to delete events' });
    }
  });
}
