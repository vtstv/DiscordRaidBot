// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/events.ts
// Events API routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { requireGuildManager } from '../auth/middleware.js';
import { enrichParticipantData, getDiscordUserInfo } from '../../utils/discord-enrichment.js';

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

  // Get event details by ID only
  server.get<{
    Params: { id: string };
    Querystring: { enrich?: string };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { enrich } = request.query;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: { joinedAt: 'asc' },
        },
        template: true,
        guild: true,
      },
    });

    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }

    // Return HTML view for browser, JSON for API
    if (request.headers.accept?.includes('text/html')) {
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${event.title} - Event Details</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #5865f2; }
            .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .participants { margin-top: 20px; }
            .participant { padding: 10px; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>${event.title}</h1>
          <div class="info">
            <p><strong>Server:</strong> ${event.guild?.name || 'Unknown'}</p>
            <p><strong>Start Time:</strong> ${new Date(event.startTime).toLocaleString()}</p>
            <p><strong>Status:</strong> ${event.status}</p>
            <p><strong>Participants:</strong> ${event.participants.length} / ${event.maxParticipants || '∞'}</p>
            ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
          </div>
          <div class="participants">
            <h2>Participants</h2>
            ${event.participants.map(p => `
              <div class="participant">
                <strong>${p.username}</strong> - ${p.role || 'No role'}
                ${p.spec ? `(${p.spec})` : ''}
                <span style="float: right; color: ${p.status === 'confirmed' ? 'green' : 'orange'}">
                  ${p.status}
                </span>
              </div>
            `).join('')}
          </div>
        </body>
        </html>
      `);
    }

    // Enrich participants with Discord data if requested
    if (enrich === 'true') {
      const enrichedParticipants = event.participants.length > 0
        ? await enrichParticipantData(event.participants, event.guildId)
        : [];
      
      // Enrich createdBy user info
      const creatorInfo = await getDiscordUserInfo(event.createdBy, event.guildId);
      
      return {
        ...event,
        participants: enrichedParticipants,
        createdByUser: creatorInfo,
      };
    }

    return event;
  });

  // Get event participants
  server.get<{
    Params: { id: string };
    Querystring: { enrich?: string };
  }>('/:id/participants', async (request, reply) => {
    const { id } = request.params;
    const { enrich } = request.query;

    const event = await prisma.event.findUnique({
      where: { id },
      select: { guildId: true },
    });

    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }

    const participants = await prisma.participant.findMany({
      where: { eventId: id },
      orderBy: { joinedAt: 'asc' },
    });

    // Enrich with Discord data if requested
    if (enrich === 'true') {
      const enriched = await enrichParticipantData(participants, event.guildId);
      return enriched;
    }

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
      createThread?: boolean;
      deleteThread?: boolean;
      allowedRoles?: string[];
      benchOverflow?: boolean;
      deadline?: number;
    };
  }>(
    '/',
    { preHandler: requireGuildManager },
    async (request, reply) => {
      const { guildId, guildName, ...eventData } = request.body;
      const userId = (request as any).session?.user?.id || 'unknown';

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
        createdBy: userId,
        status: eventData.status || 'scheduled',
        templateId: eventData.templateId,
        createThread: eventData.createThread,
        deleteThread: eventData.deleteThread,
        allowedRoles: eventData.allowedRoles,
        benchOverflow: eventData.benchOverflow,
        deadline: eventData.deadline,
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
      createThread?: boolean;
      deleteThread?: boolean;
      allowedRoles?: string[];
      benchOverflow?: boolean;
      deadline?: number;
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
      const updateData: any = {};

    if (request.body.title !== undefined) updateData.title = request.body.title;
    if (request.body.description !== undefined) updateData.description = request.body.description;
    if (request.body.startTime !== undefined) updateData.startTime = new Date(request.body.startTime);
    if (request.body.duration !== undefined) updateData.duration = request.body.duration;
    if (request.body.timezone !== undefined) updateData.timezone = request.body.timezone;
    if (request.body.maxParticipants !== undefined) updateData.maxParticipants = request.body.maxParticipants;
    if (request.body.roleConfig !== undefined) updateData.roleConfig = request.body.roleConfig;
    if (request.body.status !== undefined) updateData.status = request.body.status;
    if (request.body.createThread !== undefined) updateData.createThread = request.body.createThread;
    if (request.body.deleteThread !== undefined) updateData.deleteThread = request.body.deleteThread;
    if (request.body.allowedRoles !== undefined) updateData.allowedRoles = request.body.allowedRoles;
    if (request.body.benchOverflow !== undefined) updateData.benchOverflow = request.body.benchOverflow;
    if (request.body.deadline !== undefined) updateData.deadline = request.body.deadline;

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
