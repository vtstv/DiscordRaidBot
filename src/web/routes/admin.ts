// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/admin.ts
// Admin panel routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { getClient } from '../../bot/index.js';
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
      // Create session
      (request as any).session = {
        user: {
          id: 'admin',
          username: 'Administrator',
          avatar: null
        }
      };

      logger.info({ username }, 'Admin logged in with password');

      return { 
        success: true,
        user: {
          id: 'admin',
          username: 'Administrator',
          avatar: null
        }
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

      const client = getClient();
      const botStats = client ? {
        guilds: client.guilds.cache.size,
        users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        uptime: process.uptime(),
        ping: client.ws.ping
      } : null;

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

      const client = getClient();
      const enrichedGuilds = guilds.map(guild => {
        const discordGuild = client?.guilds.cache.get(guild.id);
        return {
          ...guild,
          memberCount: discordGuild?.memberCount || 0,
          online: !!discordGuild
        };
      });

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
}
