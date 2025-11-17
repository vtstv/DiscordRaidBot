// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/events.ts
// Events API routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { requireGuildManager } from '../auth/middleware.js';

const prisma = getPrismaClient();

export async function eventsRoutes(server: FastifyInstance): Promise<void> {
  // List events for a guild
  server.get<{
    Querystring: { guildId: string; status?: string };
  }>('/', async (request, reply) => {
    const { guildId, status } = request.query;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    const where: any = { guildId };
    if (status) {
      where.status = status;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startTime: 'asc' },
      take: 50,
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    return events;
  });

  // Get event details
  server.get<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: { joinedAt: 'asc' },
        },
        template: true,
      },
    });

    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }

    return event;
  });

  // Get event participants
  server.get<{
    Params: { id: string };
  }>('/:id/participants', async (request, _reply) => {
    const { id } = request.params;

    const participants = await prisma.participant.findMany({
      where: { eventId: id },
      orderBy: { joinedAt: 'asc' },
    });

    return participants;
  });

  // Create event
  server.post<{
    Body: {
      guildId: string;
      guildName: string;
      channelId: string;
      title: string;
      description?: string;
      startTime: string;
      duration?: number;
      timezone?: string;
      maxParticipants?: number;
      roleConfig?: any;
      createdBy: string;
      status?: string;
      templateId?: string;
    };
  }>(
    '/',
    { preHandler: requireGuildManager },
    async (request, reply) => {
      const { guildId, guildName, ...eventData } = request.body;

    // Ensure guild exists
    await prisma.guild.upsert({
      where: { id: guildId },
      create: { id: guildId, name: guildName || 'Unknown' },
      update: { name: guildName || 'Unknown' },
    });

    const event = await prisma.event.create({
      data: {
        guildId,
        channelId: eventData.channelId,
        title: eventData.title,
        description: eventData.description,
        startTime: new Date(eventData.startTime),
        duration: eventData.duration,
        timezone: eventData.timezone || 'UTC',
        maxParticipants: eventData.maxParticipants,
        roleConfig: eventData.roleConfig,
        createdBy: eventData.createdBy,
        status: eventData.status || 'scheduled',
        templateId: eventData.templateId,
      },
    });

    return reply.code(201).send(event);
  });

  // Update event
  server.put<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string;
      startTime?: string;
      duration?: number;
      timezone?: string;
      maxParticipants?: number;
      roleConfig?: any;
      status?: string;
    };
  }>(
    '/:id',
    {
      preHandler: async (request, reply) => {
        const { id } = request.params as { id: string };
        
        // Fetch event to get guildId
        const event = await prisma.event.findUnique({
          where: { id },
          select: { guildId: true },
        });

        if (!event) {
          return reply.code(404).send({ error: 'Event not found' });
        }

        // Add guildId to request for middleware
        (request as any).body = { ...(request.body || {}), guildId: event.guildId };

        // Run auth check
        await requireGuildManager(request, reply);
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const updateData: any = {};    if (request.body.title !== undefined) updateData.title = request.body.title;
    if (request.body.description !== undefined) updateData.description = request.body.description;
    if (request.body.startTime !== undefined) updateData.startTime = new Date(request.body.startTime);
    if (request.body.duration !== undefined) updateData.duration = request.body.duration;
    if (request.body.timezone !== undefined) updateData.timezone = request.body.timezone;
    if (request.body.maxParticipants !== undefined) updateData.maxParticipants = request.body.maxParticipants;
    if (request.body.roleConfig !== undefined) updateData.roleConfig = request.body.roleConfig;
    if (request.body.status !== undefined) updateData.status = request.body.status;

    try {
      const event = await prisma.event.update({
        where: { id },
        data: updateData,
      });

      return event;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Event not found' });
      }
      throw error;
    }
  });

  // Delete event
  server.delete<{
    Params: { id: string };
  }>(
    '/:id',
    {
      preHandler: async (request, reply) => {
        const { id } = request.params as { id: string };
        
        // Fetch event to get guildId
        const event = await prisma.event.findUnique({
          where: { id },
          select: { guildId: true },
        });

        if (!event) {
          return reply.code(404).send({ error: 'Event not found' });
        }

        // Add guildId to request for middleware
        (request as any).body = { guildId: event.guildId };

        // Run auth check
        await requireGuildManager(request, reply);
      },
    },
    async (request, reply) => {
      const { id } = request.params;

    try {
      await prisma.event.delete({
        where: { id },
      });

      return reply.code(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Event not found' });
      }
      throw error;
    }
  });
}
