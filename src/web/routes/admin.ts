// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/admin.ts
// Admin panel routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { config } from '../../config/env.js';

const logger = getModuleLogger('admin');
const prisma = getPrismaClient();

// Admin user IDs from environment
const ADMIN_IDS = (config.ADMIN_USER_IDS || '').split(',').filter(id => id.trim());

/**
 * Check if user is admin
 */
function isAdmin(userId: string): boolean {
  return ADMIN_IDS.includes(userId);
}

/**
 * Admin authentication middleware
 */
async function requireAdmin(request: any, reply: any) {
  const user = request.session?.user;
  
  if (!user) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }
  
  // Allow password-authenticated admin or Discord OAuth with whitelisted ID
  if (user.id !== 'admin' && !isAdmin(user.id)) {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}

export async function adminRoutes(server: FastifyInstance): Promise<void> {
  // Get config
  server.get('/config', async () => {
    return {
      apiBaseUrl: config.ADMIN_BASE_URL,
      oauthEnabled: !!config.DISCORD_CLIENT_SECRET,
      passwordAuthEnabled: !!(config.ADMIN_USERNAME && config.ADMIN_PASSWORD)
    };
  });

  // Password authentication
  server.post<{
    Body: { username: string; password: string };
  }>('/auth/password', async (request, reply) => {
    const { username, password } = request.body;

    if (!config.ADMIN_USERNAME || !config.ADMIN_PASSWORD) {
      return reply.code(401).send({ error: 'Password authentication disabled' });
    }

    if (username === config.ADMIN_USERNAME && password === config.ADMIN_PASSWORD) {
      // Create session data
      const sessionData = {
        user: {
          id: 'admin',
          username: 'Administrator',
          avatar: null
        }
      };

      // Set session using direct assignment
      (request as any).session.user = sessionData.user;

      logger.info({ username }, 'Admin logged in with password');

      return { 
        success: true,
        user: sessionData.user
      };
    }

    return reply.code(401).send({ error: 'Invalid credentials' });
  });

  // Get admin status
  server.get('/status', async (request) => {
    const user = (request as any).session?.user;
    
    if (!user) {
      return { isAdmin: false, authenticated: false };
    }
    
    // Check if user is admin (either password login or Discord OAuth with whitelisted ID)
    const isAdminUser = user.id === 'admin' || isAdmin(user.id);
    
    return { 
      isAdmin: isAdminUser,
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar
      }
    };
  });

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

  // Get all guilds
  server.get('/guilds', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      const guilds = await prisma.guild.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              events: true,
              templates: true
            }
          }
        }
      });

      // Note: In multi-container setup, web cannot access bot's Discord client
      // We rely on database information only
      const enrichedGuilds = guilds.map(guild => ({
        id: guild.id,
        name: guild.name || 'Unknown',
        memberCount: 0, // Not available in multi-container setup
        online: true, // Assume online if in database
        _count: guild._count
      }));

      return enrichedGuilds;
    } catch (error) {
      logger.error({ error }, 'Failed to get guilds');
      return reply.code(500).send({ error: 'Failed to get guilds' });
    }
  });

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

  // Restart bot (graceful)
  server.post('/bot/restart', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      logger.warn('Bot restart requested by admin');
      
      // Send response before restarting
      reply.send({ message: 'Bot restart initiated' });
      
      // Graceful shutdown after 1 second
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } catch (error) {
      logger.error({ error }, 'Failed to restart bot');
      return reply.code(500).send({ error: 'Failed to restart bot' });
    }
  });

  // Get analytics data
  server.get('/analytics', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      const [
        totalGuilds,
        totalEvents,
        totalTemplates,
        totalParticipants,
        activeEvents,
        scheduledEvents,
        completedEvents,
      ] = await Promise.all([
        prisma.guild.count(),
        prisma.event.count(),
        prisma.template.count(),
        prisma.participant.count(),
        prisma.event.count({ where: { status: 'active' } }),
        prisma.event.count({ where: { status: 'scheduled' } }),
        prisma.event.count({ where: { status: 'completed' } }),
      ]);

      // Top guilds by event count
      const topGuilds = await prisma.guild.findMany({
        select: {
          name: true,
          _count: {
            select: { events: true },
          },
        },
        orderBy: {
          events: {
            _count: 'desc',
          },
        },
        take: 10,
      });

      // Calculate participation rate
      const eventsWithSlots = await prisma.event.findMany({
        select: {
          maxParticipants: true,
          _count: {
            select: { participants: true },
          },
        },
        where: {
          maxParticipants: { not: null },
        },
      });

      let participationRate = 0;
      if (eventsWithSlots.length > 0) {
        const rates = eventsWithSlots.map(e => 
          e.maxParticipants ? (e._count.participants / e.maxParticipants) * 100 : 0
        );
        participationRate = rates.reduce((a, b) => a + b, 0) / rates.length;
      }

      return {
        totalGuilds,
        totalEvents,
        totalTemplates,
        totalParticipants,
        activeEvents,
        scheduledEvents,
        completedEvents,
        topGuilds: topGuilds.map(g => ({
          name: g.name,
          eventCount: g._count.events,
        })),
        participationRate: Math.round(participationRate * 10) / 10,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch analytics');
      return reply.code(500).send({ error: 'Failed to fetch analytics' });
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
        where.timestamp = {};
        if (dateFrom) where.timestamp.gte = dateFrom;
        if (dateTo) where.timestamp.lte = dateTo;
      }

      const [logs, total] = await Promise.all([
        prisma.logEntry.findMany({
          where,
          orderBy: { timestamp: 'desc' },
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
          userName: log.userId,
          guildId: log.guildId,
          guildName: log.guild.name,
          details: log.details || '',
          timestamp: log.timestamp,
        })),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch audit logs');
      return reply.code(500).send({ error: 'Failed to fetch audit logs' });
    }
  });

  // Delete guild data
  server.delete('/guilds/:guildId/data', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { guildId } = request.params as { guildId: string };

      await prisma.$transaction([
        prisma.participant.deleteMany({ where: { event: { guildId } } }),
        prisma.event.deleteMany({ where: { guildId } }),
        prisma.template.deleteMany({ where: { guildId } }),
        prisma.logEntry.deleteMany({ where: { guildId } }),
      ]);

      logger.info({ guildId }, 'Deleted all data for guild');

      return { success: true };
    } catch (error) {
      logger.error({ error }, 'Failed to delete guild data');
      return reply.code(500).send({ error: 'Failed to delete guild data' });
    }
  });

  // Get/update system settings
  server.get('/settings', { preHandler: requireAdmin }, async (_request, reply) => {
    return {
      settings: {
        maintenanceMode: false,
        allowNewGuilds: true,
        maxEventsPerGuild: 100,
        maxTemplatesPerGuild: 50,
        defaultLanguage: 'en',
        logLevel: 'info',
        enableAnalytics: true,
        webhookUrl: '',
      },
    };
  });

  server.put('/settings', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { settings } = request.body as any;
      logger.info({ settings }, 'System settings updated');
      return { success: true };
    } catch (error) {
      logger.error({ error }, 'Failed to update settings');
      return reply.code(500).send({ error: 'Failed to update settings' });
    }
  });

  // Bulk operations
  server.post('/bulk-operations', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { operation, params } = request.body as any;
      let affectedCount = 0;

      switch (operation) {
        case 'delete_old_events':
          const daysOld = params.daysOld || 90;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysOld);

          const result = await prisma.event.deleteMany({
            where: {
              status: 'completed',
              endTime: { lt: cutoffDate },
            },
          });
          affectedCount = result.count;
          break;

        case 'archive_completed':
          const archiveResult = await prisma.event.updateMany({
            where: { status: 'completed' },
            data: { status: 'archived' },
          });
          affectedCount = archiveResult.count;
          break;

        case 'cleanup_orphaned':
          const orphanedParticipants = await prisma.participant.deleteMany({
            where: {
              event: null,
            },
          });
          affectedCount = orphanedParticipants.count;
          break;

        case 'reset_guild_settings':
          const guilds = await prisma.guild.findMany();
          await prisma.guild.updateMany({
            data: {
              timezone: 'UTC',
              language: 'en',
            },
          });
          affectedCount = guilds.length;
          break;

        default:
          return reply.code(400).send({ error: 'Unknown operation' });
      }

      logger.info({ operation, affectedCount }, 'Bulk operation completed');

      return { success: true, affectedCount };
    } catch (error) {
      logger.error({ error }, 'Bulk operation failed');
      return reply.code(500).send({ error: 'Bulk operation failed' });
    }
  });
}
