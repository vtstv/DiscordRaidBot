// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Template management routes for admin panel

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { requireAdmin } from './middleware.js';

const logger = getModuleLogger('admin-templates');
const prisma = getPrismaClient();

export async function templateRoutes(server: FastifyInstance): Promise<void> {
  // Get single template
  server.get<{
    Params: { id: string };
  }>('/templates/:id', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const template = await prisma.template.findUnique({
        where: { id: request.params.id },
        include: {
          guild: {
            select: { id: true, name: true }
          }
        }
      });

      if (!template) {
        return reply.code(404).send({ error: 'Template not found' });
      }

      return template;
    } catch (error) {
      logger.error({ error }, 'Failed to get template');
      return reply.code(500).send({ error: 'Failed to get template' });
    }
  });

  // Search templates
  server.get<{
    Querystring: { 
      q?: string; 
      guildId?: string;
      limit?: number;
      offset?: number;
    };
  }>('/templates/search', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { q, guildId, limit = 50, offset = 0 } = request.query;

      const where: any = {};
      
      if (q) {
        where.name = { contains: q, mode: 'insensitive' };
      }
      
      if (guildId) {
        where.guildId = guildId;
      }

      const [templates, total] = await Promise.all([
        prisma.template.findMany({
          where,
          orderBy: { name: 'asc' },
          take: Number(limit),
          skip: Number(offset),
          include: {
            guild: {
              select: { name: true }
            }
          }
        }),
        prisma.template.count({ where })
      ]);

      return { templates, total, limit, offset };
    } catch (error) {
      logger.error({ error }, 'Failed to search templates');
      return reply.code(500).send({ error: 'Failed to search templates' });
    }
  });

  // Bulk delete templates
  server.post<{
    Body: { templateIds: string[] };
  }>('/templates/bulk-delete', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { templateIds } = request.body;

      if (!templateIds || templateIds.length === 0) {
        return reply.code(400).send({ error: 'No template IDs provided' });
      }

      const result = await prisma.template.deleteMany({
        where: {
          id: { in: templateIds }
        }
      });

      logger.info({ count: result.count, templateIds }, 'Bulk deleted templates');
      return { deleted: result.count };
    } catch (error) {
      logger.error({ error }, 'Failed to bulk delete templates');
      return reply.code(500).send({ error: 'Failed to delete templates' });
    }
  });
}
