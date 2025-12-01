// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/guilds.ts
// Guild management routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { requireGuildAdmin, clearGuildMemberCache } from '../auth/middleware.js';
import { requireModulePermission, requireGuildAccess } from '../auth/permissions.js';
import { getUserGuilds, getGuildRoles, getGuildChannels, getGuildCategories } from '../auth/discord-oauth.js';
import { getModuleLogger } from '../../utils/logger.js';

const logger = getModuleLogger('guilds-routes');
const prisma = getPrismaClient();

export async function guildsRoutes(server: FastifyInstance): Promise<void> {
  // Get list of guilds for authenticated user
  server.get('/', async (request, reply) => {
    const user = (request as any).session?.user;
    
    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    try {
      const accessToken = (request as any).session?.accessToken;
      
      if (!accessToken) {
        return reply.code(401).send({ error: 'No access token' });
      }

      // Get guilds from Discord
      const discordGuilds = await getUserGuilds(accessToken);
      
      // Get guild data from database
      const dbGuilds = await prisma.guild.findMany({
        select: {
          id: true,
          name: true,
        },
      });
      
      // Mark guilds where bot is present
      const guildsWithBotStatus = discordGuilds.map(guild => ({
        ...guild,
        hasBot: dbGuilds.some(dbGuild => dbGuild.id === guild.id),
      }));

      return guildsWithBotStatus;
    } catch (error) {
      logger.error({ error }, 'Failed to get user guilds');
      return reply.code(500).send({ error: 'Failed to get guilds' });
    }
  });

  // Get guild settings
  server.get<{
    Params: { guildId: string };
  }>('/:guildId/settings', {
    preHandler: requireModulePermission('settings')
  }, async (request, reply) => {

    const { guildId } = request.params;

    try {
      const guild = await prisma.guild.findUnique({
        where: { id: guildId },
      });

      if (!guild) {
        return reply.code(404).send({ error: 'Guild not found' });
      }

      return guild;
    } catch (error) {
      logger.error({ error }, 'Failed to get guild settings');
      return reply.code(500).send({ error: 'Failed to get settings' });
    }
  });

  // Update guild settings
  server.put<{
    Params: { guildId: string };
    Body: {
      timezone?: string;
      locale?: string;
      logChannelId?: string;
      archiveChannelId?: string;
      managerRoleId?: string;
      dashboardRoles?: string[];
      commandPrefix?: string;
      approvalChannels?: string[];
      reminderIntervals?: string[];
      autoDeleteHours?: number;
      logRetentionDays?: number;
      threadChannels?: string[];
      noteChannels?: string[];
      allowParticipantNotes?: boolean;
      participantNoteMaxLength?: number;
      showViewOnlineButton?: boolean;
      dmRemindersEnabled?: boolean;
      createNativeEvent?: boolean;
      statsEnabled?: boolean;
      statsChannelId?: string;
      statsUpdateInterval?: string;
      statsAutoRoleEnabled?: boolean;
      statsTop10RoleId?: string;
      statsMinEvents?: number;
      voiceChannelCategoryId?: string;
      voiceChannelDuration?: number;
      voiceChannelCreateBefore?: number;
    };
  }>('/:guildId/settings', {
    preHandler: requireModulePermission('settings')
  }, async (request, reply) => {
    const { guildId } = request.params;
    const updateData: any = {};

    if (request.body.timezone !== undefined) updateData.timezone = request.body.timezone;
    if (request.body.locale !== undefined) updateData.locale = request.body.locale;
    if (request.body.logChannelId !== undefined) updateData.logChannelId = request.body.logChannelId;
    if (request.body.archiveChannelId !== undefined) updateData.archiveChannelId = request.body.archiveChannelId;
    if (request.body.managerRoleId !== undefined) updateData.managerRoleId = request.body.managerRoleId;
    if (request.body.dashboardRoles !== undefined) updateData.dashboardRoles = request.body.dashboardRoles;
    if (request.body.commandPrefix !== undefined) updateData.commandPrefix = request.body.commandPrefix;
    if (request.body.approvalChannels !== undefined) updateData.approvalChannels = request.body.approvalChannels;
    if (request.body.reminderIntervals !== undefined) updateData.reminderIntervals = request.body.reminderIntervals;
    if (request.body.autoDeleteHours !== undefined) updateData.autoDeleteHours = request.body.autoDeleteHours;
    if (request.body.logRetentionDays !== undefined) updateData.logRetentionDays = request.body.logRetentionDays;
    if (request.body.threadChannels !== undefined) updateData.threadChannels = request.body.threadChannels;
    if (request.body.noteChannels !== undefined) updateData.noteChannels = request.body.noteChannels;
    if (request.body.allowParticipantNotes !== undefined) updateData.allowParticipantNotes = request.body.allowParticipantNotes;
    if (request.body.participantNoteMaxLength !== undefined) updateData.participantNoteMaxLength = request.body.participantNoteMaxLength;
    if (request.body.showViewOnlineButton !== undefined) updateData.showViewOnlineButton = request.body.showViewOnlineButton;
    if (request.body.dmRemindersEnabled !== undefined) updateData.dmRemindersEnabled = request.body.dmRemindersEnabled;
    if (request.body.createNativeEvent !== undefined) updateData.createNativeEvent = request.body.createNativeEvent;
    if (request.body.statsEnabled !== undefined) updateData.statsEnabled = request.body.statsEnabled;
    if (request.body.statsChannelId !== undefined) updateData.statsChannelId = request.body.statsChannelId;
    if (request.body.statsUpdateInterval !== undefined) updateData.statsUpdateInterval = request.body.statsUpdateInterval;
    if (request.body.statsAutoRoleEnabled !== undefined) updateData.statsAutoRoleEnabled = request.body.statsAutoRoleEnabled;
    if (request.body.statsTop10RoleId !== undefined) updateData.statsTop10RoleId = request.body.statsTop10RoleId;
    if (request.body.statsMinEvents !== undefined) updateData.statsMinEvents = request.body.statsMinEvents;
    if (request.body.voiceChannelCategoryId !== undefined) updateData.voiceChannelCategoryId = request.body.voiceChannelCategoryId;
    if (request.body.voiceChannelDuration !== undefined) updateData.voiceChannelDuration = request.body.voiceChannelDuration;
    if (request.body.voiceChannelCreateBefore !== undefined) updateData.voiceChannelCreateBefore = request.body.voiceChannelCreateBefore;

    try {
      const guild = await prisma.guild.update({
        where: { id: guildId },
        data: updateData,
      });

      logger.info({ guildId, updates: Object.keys(updateData) }, 'Guild settings updated');
      return guild;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Guild not found' });
      }
      logger.error({ error }, 'Failed to update guild settings');
      return reply.code(500).send({ error: 'Failed to update settings' });
    }
  });

  // Get guild statistics
  server.get<{
    Params: { guildId: string };
  }>('/:guildId/stats', {
    preHandler: requireGuildAccess()
  }, async (request, reply) => {
    const { guildId } = request.params;

    try {
      const [totalEvents, activeEvents, scheduledEvents, totalTemplates, totalParticipants] = await Promise.all([
        prisma.event.count({ where: { guildId } }),
        prisma.event.count({ where: { guildId, status: 'active' } }),
        prisma.event.count({ where: { guildId, status: 'scheduled' } }),
        prisma.template.count({ where: { guildId } }),
        prisma.participant.count({
          where: {
            event: {
              guildId,
            },
          },
        }),
      ]);

      return {
        totalEvents,
        activeEvents,
        scheduledEvents,
        totalTemplates,
        totalParticipants,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get guild stats');
      return reply.code(500).send({ error: 'Failed to get statistics' });
    }
  });

  // Get guild roles
  server.get<{
    Params: { guildId: string };
  }>('/:guildId/roles', {
    preHandler: requireModulePermission('settings')
  }, async (request, reply) => {
    const { guildId } = request.params;

    try {
      const roles = await getGuildRoles(guildId);
      return roles;
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to get guild roles');
      return reply.code(500).send({ error: 'Failed to get roles' });
    }
  });

  // Get guild channels
  server.get<{
    Params: { guildId: string };
  }>('/:guildId/channels', {
    preHandler: requireModulePermission('settings')
  }, async (request, reply) => {
    const { guildId } = request.params;

    try {
      const channels = await getGuildChannels(guildId);
      return channels;
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to get guild channels');
      return reply.code(500).send({ error: 'Failed to get channels' });
    }
  });

  // Get guild categories (for voice channel settings)
  server.get<{
    Params: { guildId: string };
  }>('/:guildId/categories', {
    preHandler: requireModulePermission('settings')
  }, async (request, reply) => {
    const { guildId } = request.params;

    try {
      const categories = await getGuildCategories(guildId);
      return categories;
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to get guild categories');
      return reply.code(500).send({ error: 'Failed to get categories' });
    }
  });

  // Get dashboard role permissions
  server.get<{
    Params: { guildId: string };
  }>('/:guildId/role-permissions', {
    preHandler: requireModulePermission('settings')
  }, async (request, reply) => {
    const { guildId } = request.params;

    try {
      const permissions = await prisma.dashboardRolePermission.findMany({
        where: { guildId },
        orderBy: { createdAt: 'asc' },
      });
      return permissions;
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to get role permissions');
      return reply.code(500).send({ error: 'Failed to get permissions' });
    }
  });

  // Update dashboard role permissions
  server.put<{
    Params: { guildId: string };
    Body: {
      roleId: string;
      canAccessEvents?: boolean;
      canAccessCompositions?: boolean;
      canAccessTemplates?: boolean;
      canAccessSettings?: boolean;
    };
  }>('/:guildId/role-permissions', {
    preHandler: requireModulePermission('settings')
  }, async (request, reply) => {
    const { guildId } = request.params;
    const { roleId, canAccessEvents, canAccessCompositions, canAccessTemplates, canAccessSettings } = request.body;

    try {
      const permission = await prisma.dashboardRolePermission.upsert({
        where: {
          guildId_roleId: {
            guildId,
            roleId,
          },
        },
        create: {
          guildId,
          roleId,
          canAccessEvents: canAccessEvents ?? true,
          canAccessCompositions: canAccessCompositions ?? true,
          canAccessTemplates: canAccessTemplates ?? true,
          canAccessSettings: canAccessSettings ?? false,
        },
        update: {
          ...(canAccessEvents !== undefined && { canAccessEvents }),
          ...(canAccessCompositions !== undefined && { canAccessCompositions }),
          ...(canAccessTemplates !== undefined && { canAccessTemplates }),
          ...(canAccessSettings !== undefined && { canAccessSettings }),
        },
      });

      logger.info({ guildId, roleId, permission }, 'Role permissions updated');
      
      // Clear cache to force fresh permission checks
      clearGuildMemberCache(guildId);
      
      return permission;
    } catch (error) {
      logger.error({ error, guildId, roleId }, 'Failed to update role permissions');
      return reply.code(500).send({ error: 'Failed to update permissions' });
    }
  });

  // Delete dashboard role permissions
  server.delete<{
    Params: { guildId: string; roleId: string };
  }>('/:guildId/role-permissions/:roleId', {
    preHandler: requireModulePermission('settings')
  }, async (request, reply) => {
    const { guildId, roleId } = request.params;

    try {
      await prisma.dashboardRolePermission.delete({
        where: {
          guildId_roleId: {
            guildId,
            roleId,
          },
        },
      });

      logger.info({ guildId, roleId }, 'Role permissions deleted');
      
      // Clear cache to force fresh permission checks
      clearGuildMemberCache(guildId);
      
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Permissions not found' });
      }
      logger.error({ error, guildId, roleId }, 'Failed to delete role permissions');
      return reply.code(500).send({ error: 'Failed to delete permissions' });
    }
  });

  // Get user's permissions for current guild
  server.get<{
    Params: { guildId: string };
  }>('/:guildId/my-permissions', async (request, reply) => {
    const user = (request as any).session?.user;
    const adminGuilds = (request as any).session?.adminGuilds || [];
    const isBotAdmin = (request as any).session?.isBotAdmin || false;
    
    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    const { guildId } = request.params;

    try {
      // Check if user is admin of this guild
      // But exclude guilds that are only accessible via dashboardRoles (isRoleBased flag)
      const guildAccess = adminGuilds.find((g: any) => g.id === guildId);
      const isAdmin = guildAccess && !guildAccess.isRoleBased;
      const isRoleBased = guildAccess?.isRoleBased || false;
      
      logger.info({ 
        userId: user.id, 
        guildId, 
        isAdmin,
        isRoleBased,
        isBotAdmin,
        adminGuildsCount: adminGuilds.length,
        adminGuildIds: adminGuilds.map((g: any) => ({ id: g.id, isRoleBased: g.isRoleBased || false }))
      }, 'Checking my-permissions');
      
      const { getUserPermissions } = await import('../auth/permissions.js');
      const permissions = await getUserPermissions(guildId, user.id, isAdmin, isBotAdmin, isRoleBased);
      return permissions;
    } catch (error) {
      logger.error({ error, guildId, userId: user.id }, 'Failed to get user permissions');
      return reply.code(500).send({ error: 'Failed to get permissions' });
    }
  });
}
