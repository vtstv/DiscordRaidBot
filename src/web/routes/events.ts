// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/events.ts
// Events API routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { requireGuildManager } from '../auth/middleware.js';
import { requireModulePermission } from '../auth/permissions.js';
import { enrichParticipantData, getDiscordUserInfo } from '../../utils/discord-enrichment.js';
import { getModuleLogger } from '../../utils/logger.js';

const prisma = getPrismaClient();
const logger = getModuleLogger('events-routes');

export async function eventsRoutes(server: FastifyInstance): Promise<void> {
  // List events for a guild
  server.get<{
    Querystring: { guildId: string; status?: string };
  }>('/', async (request, reply) => {
    const { guildId, status } = request.query;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    // Check permission
    (request as any).params = { guildId };
    await requireModulePermission('events')(request, reply);
    if (reply.sent) return;

    const where: any = { guildId };
    if (status) {
      where.status = status;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },  // Newest events first
        { startTime: 'asc' },   // Then by start time
      ],
      take: 50,
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    return events;
  });

  // Public event view (no authentication required) - MUST be before /:id route
  server.get<{
    Params: { id: string };
  }>('/:id/public', async (request, reply) => {
    const { id } = request.params;

    try {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          participants: {
            orderBy: { joinedAt: 'asc' },
            select: {
              id: true,
              userId: true,
              role: true,
              status: true,
              note: true,
              username: true,
              joinedAt: true,
            },
          },
          _count: {
            select: { participants: true },
          },
        },
      });

      if (!event) {
        return reply.code(404).send({ error: 'Event not found' });
      }

      // Enrich participant data with Discord info
      const enrichedParticipants = await enrichParticipantData(event.participants, event.guildId);

      return {
        ...event,
        participants: enrichedParticipants,
      };
    } catch (error) {
      logger.error({ error, eventId: id }, 'Failed to fetch public event');
      return reply.code(500).send({ error: 'Internal server error' });
    }
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
        _count: {
          select: { participants: true },
        },
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
      createVoiceChannel?: boolean;
      voiceChannelName?: string;
      voiceChannelRestricted?: boolean;
      voiceChannelCreateBefore?: number;
    };
  }>(
    '/',
    async (request, reply) => {
      const { guildId, guildName, ...eventData } = request.body;

      // Check permission
      (request as any).params = { guildId };
      await requireModulePermission('events')(request, reply);
      if (reply.sent) return;

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
        createVoiceChannel: eventData.createVoiceChannel,
        voiceChannelName: eventData.voiceChannelName,
        voiceChannelRestricted: eventData.voiceChannelRestricted,
        voiceChannelCreateBefore: eventData.voiceChannelCreateBefore,
      },
    });

    // Publish event creation notification via Redis
    try {
      const { publishEventCreated } = await import('../../services/eventPublisher.js');
      await publishEventCreated(event.id);
      logger.info({ eventId: event.id }, 'Event creation notification published');
    } catch (publishError) {
      logger.warn({ error: publishError, eventId: event.id }, 'Failed to publish event creation notification - redis may not be available');
      // Still return success as event was created in DB
    }

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
      createVoiceChannel?: boolean;
      voiceChannelName?: string;
      voiceChannelRestricted?: boolean;
      voiceChannelCreateBefore?: number;
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

        // Add guildId to request params for permission check
        (request as any).params = { ...request.params, guildId: event.guildId };

        // Check permission
        await requireModulePermission('events')(request, reply);
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
    if (request.body.createVoiceChannel !== undefined) updateData.createVoiceChannel = request.body.createVoiceChannel;
    if (request.body.voiceChannelName !== undefined) updateData.voiceChannelName = request.body.voiceChannelName;
    if (request.body.voiceChannelRestricted !== undefined) updateData.voiceChannelRestricted = request.body.voiceChannelRestricted;
    if (request.body.voiceChannelCreateBefore !== undefined) updateData.voiceChannelCreateBefore = request.body.voiceChannelCreateBefore;

    try {
      const event = await prisma.event.update({
        where: { id },
        data: updateData,
      });

      // Publish event update notification via Redis
      try {
        const { publishEventUpdated } = await import('../../services/eventPublisher.js');
        await publishEventUpdated(id);
        logger.info({ eventId: id }, 'Event update notification published');
      } catch (publishError) {
        logger.warn({ error: publishError, eventId: id }, 'Failed to publish event update notification - redis may not be available');
      }

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

        // Add guildId to request params for permission check
        (request as any).params = { ...request.params, guildId: event.guildId };

        // Check permission
        await requireModulePermission('events')(request, reply);
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
