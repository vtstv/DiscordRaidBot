// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/raidplans.ts
// RaidPlan API routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { requireGuildManager } from '../auth/middleware.js';
import { requireModulePermission } from '../auth/permissions.js';
import { getModuleLogger } from '../../utils/logger.js';

const prisma = getPrismaClient();
const logger = getModuleLogger('raidplans-routes');

export async function raidPlansRoutes(server: FastifyInstance): Promise<void> {
  // Get all events with raid plans for a guild
  server.get<{
    Querystring: { guildId: string };
  }>('/guild/:guildId/events-with-plans', async (request, reply) => {
    const { guildId } = request.params as any;

    // Check permission
    (request as any).params = { guildId };
    await requireModulePermission('compositions')(request, reply);
    if (reply.sent) return;

    try {
      // Get all raid plans for the guild with their events
      const raidPlans = await prisma.raidPlan.findMany({
        where: { guildId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              startTime: true,
              status: true,
              maxParticipants: true,
              channelId: true,
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
        orderBy: {
          event: {
            startTime: 'asc',
          },
        },
      });

      // Transform to events with raidPlan property
      const eventsWithPlans = raidPlans
        .filter(rp => rp.event) // Only events that exist
        .filter(rp => {
          // Filter for upcoming events only
          const startTime = new Date(rp.event.startTime);
          return (
            (rp.event.status === 'scheduled' || rp.event.status === 'active') &&
            startTime > new Date()
          );
        })
        .map(rp => ({
          ...rp.event,
          raidPlan: {
            id: rp.id,
            eventId: rp.eventId,
            title: rp.title,
            groups: rp.groups,
          },
        }));

      return eventsWithPlans;
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to fetch events with raid plans');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

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
    Querystring: { guildId?: string };
  }>('/event/:eventId', async (request, reply) => {
    const { eventId } = request.params;
    const { guildId } = request.query;

    try {
      const raidPlan = await prisma.raidPlan.findUnique({
        where: { eventId },
        select: { id: true, eventId: true, guildId: true, title: true, groups: true, createdAt: true, updatedAt: true,
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

      // Check permission
      (request as any).params = { guildId: raidPlan.guildId };
      await requireModulePermission('compositions')(request, reply);
      if (reply.sent) return;

      // Check if user has access to this guild (only if guildId provided)
      if (guildId && raidPlan.guildId !== guildId) {
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
    };
  }>('/', async (request, reply) => {
    const { eventId, guildId, title, groups } = request.body;

    // Check permission
    (request as any).params = { guildId };
    await requireModulePermission('compositions')(request, reply);
    if (reply.sent) return;
    const authSession = (request as any).authSession;
    const createdBy = authSession?.user?.id;

    if (!eventId || !guildId) {
      return reply.code(400).send({ error: 'eventId and guildId are required' });
    }

    if (!createdBy) {
      return reply.code(401).send({ error: 'Unauthorized' });
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
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { guildId, title, groups } = request.body;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    // Check permission
    (request as any).params = { guildId };
    await requireModulePermission('compositions')(request, reply);
    if (reply.sent) return;

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
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { guildId } = request.query;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    // Check permission
    (request as any).params = { guildId };
    await requireModulePermission('compositions')(request, reply);
    if (reply.sent) return;

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
