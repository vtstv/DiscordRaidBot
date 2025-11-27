// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/raidplans.ts
// RaidPlan API routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { requireGuildManager } from '../auth/middleware.js';
import { getModuleLogger } from '../../utils/logger.js';

const prisma = getPrismaClient();
const logger = getModuleLogger('raidplans-routes');

export async function raidPlansRoutes(server: FastifyInstance): Promise<void> {
  // Get raid plan for an event (public endpoint)
  server.get<{
    Params: { id: string };
  }>('/:id/public', async (request, reply) => {
    const { id } = request.params;

    try {
      const raidPlan = await prisma.raidPlan.findUnique({
        where: { id },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              guildId: true,
              participants: {
                where: { status: 'confirmed' },
                select: {
                  id: true,
                  userId: true,
                  username: true,
                  role: true,
                  spec: true,
                },
              },
            },
          },
        },
      });

      if (!raidPlan) {
        return reply.code(404).send({ error: 'Raid plan not found' });
      }

      return raidPlan;
    } catch (error) {
      logger.error({ error, raidPlanId: id }, 'Failed to fetch public raid plan');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get raid plan by event ID (public endpoint)
  server.get<{
    Params: { eventId: string };
  }>('/event/:eventId/public', async (request, reply) => {
    const { eventId } = request.params;

    try {
      const raidPlan = await prisma.raidPlan.findFirst({
        where: { eventId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              guildId: true,
              participants: {
                where: { status: 'confirmed' },
                select: {
                  id: true,
                  userId: true,
                  username: true,
                  role: true,
                  spec: true,
                },
              },
            },
          },
        },
      });

      if (!raidPlan) {
        return reply.code(404).send({ error: 'Raid plan not found' });
      }

      return raidPlan;
    } catch (error) {
      logger.error({ error, eventId }, 'Failed to fetch public raid plan by event');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get raid plan for an event (authenticated)
  server.get<{
    Params: { eventId: string };
    Querystring: { guildId: string };
  }>('/event/:eventId', async (request, reply) => {
    const { eventId } = request.params;
    const { guildId } = request.query;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    try {
      const raidPlan = await prisma.raidPlan.findUnique({
        where: { eventId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              guildId: true,
              participants: {
                where: { status: 'confirmed' },
                select: {
                  id: true,
                  userId: true,
                  username: true,
                  role: true,
                  spec: true,
                },
              },
            },
          },
        },
      });

      if (!raidPlan) {
        return reply.code(404).send({ error: 'Raid plan not found' });
      }

      // Check if user has access to this guild
      if (raidPlan.guildId !== guildId) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      return raidPlan;
    } catch (error) {
      logger.error({ error, eventId }, 'Failed to fetch raid plan');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create raid plan for an event
  server.post<{
    Body: {
      eventId: string;
      guildId: string;
      title?: string;
      groups?: any[];
      createdBy: string;
    };
  }>('/', { preHandler: requireGuildManager }, async (request, reply) => {
    const { eventId, guildId, title, groups, createdBy } = request.body;

    if (!eventId || !guildId || !createdBy) {
      return reply.code(400).send({ error: 'eventId, guildId, and createdBy are required' });
    }

    try {
      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return reply.code(404).send({ error: 'Event not found' });
      }

      if (event.guildId !== guildId) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      // Check if raid plan already exists
      const existing = await prisma.raidPlan.findUnique({
        where: { eventId },
      });

      if (existing) {
        return reply.code(409).send({ error: 'Raid plan already exists for this event' });
      }

      // Create default groups structure if not provided
      const defaultGroups = groups || [
        { id: 'group-1', name: 'Group 1', positions: [] },
        { id: 'group-2', name: 'Group 2', positions: [] },
        { id: 'group-3', name: 'Group 3', positions: [] },
        { id: 'group-4', name: 'Group 4', positions: [] },
        { id: 'group-5', name: 'Group 5', positions: [] },
      ];

      const raidPlan = await prisma.raidPlan.create({
        data: {
          eventId,
          guildId,
          title: title || 'Raid Composition',
          groups: defaultGroups,
          createdBy,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              participants: {
                where: { status: 'confirmed' },
                select: {
                  id: true,
                  userId: true,
                  username: true,
                  role: true,
                  spec: true,
                },
              },
            },
          },
        },
      });

      return reply.code(201).send(raidPlan);
    } catch (error) {
      logger.error({ error, eventId }, 'Failed to create raid plan');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update raid plan
  server.put<{
    Params: { id: string };
    Body: {
      guildId: string;
      title?: string;
      groups?: any[];
    };
  }>('/:id', { preHandler: requireGuildManager }, async (request, reply) => {
    const { id } = request.params;
    const { guildId, title, groups } = request.body;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    try {
      const existing = await prisma.raidPlan.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.code(404).send({ error: 'Raid plan not found' });
      }

      if (existing.guildId !== guildId) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (groups !== undefined) updateData.groups = groups;

      const raidPlan = await prisma.raidPlan.update({
        where: { id },
        data: updateData,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              participants: {
                where: { status: 'confirmed' },
                select: {
                  id: true,
                  userId: true,
                  username: true,
                  role: true,
                  spec: true,
                },
              },
            },
          },
        },
      });

      return raidPlan;
    } catch (error) {
      logger.error({ error, raidPlanId: id }, 'Failed to update raid plan');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete raid plan
  server.delete<{
    Params: { id: string };
    Querystring: { guildId: string };
  }>('/:id', { preHandler: requireGuildManager }, async (request, reply) => {
    const { id } = request.params;
    const { guildId } = request.query;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    try {
      const existing = await prisma.raidPlan.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.code(404).send({ error: 'Raid plan not found' });
      }

      if (existing.guildId !== guildId) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      await prisma.raidPlan.delete({
        where: { id },
      });

      return reply.code(204).send();
    } catch (error) {
      logger.error({ error, raidPlanId: id }, 'Failed to delete raid plan');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
