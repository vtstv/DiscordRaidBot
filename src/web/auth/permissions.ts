// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/auth/permissions.ts
// Permission checking utilities for dashboard access

import { FastifyRequest, FastifyReply } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { getGuildMember } from './discord-oauth.js';

const logger = getModuleLogger('permissions');
const prisma = getPrismaClient();

export type DashboardModule = 'events' | 'compositions' | 'templates' | 'settings';

/**
 * Check if user has permission to access a specific module
 */
export async function hasModulePermission(
  guildId: string,
  userId: string,
  module: DashboardModule,
  accessToken?: string
): Promise<boolean> {
  try {
    // Get guild settings
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: {
        managerRoleId: true,
        dashboardRoles: true,
      },
    });

    if (!guild) {
      return false;
    }

    // Get user's member info to check their roles
    const memberInfo = await getGuildMember(guildId, userId);
    
    if (!memberInfo) {
      return false;
    }

    const userRoles = memberInfo.roles;

    // Check if user has manager role (full access to everything)
    if (guild.managerRoleId && userRoles.includes(guild.managerRoleId)) {
      return true;
    }

    // Check if user has any dashboard role
    const userDashboardRoles = userRoles.filter(roleId => 
      guild.dashboardRoles.includes(roleId)
    );

    if (userDashboardRoles.length === 0) {
      return false;
    }

    // Get permissions for user's roles
    const permissions = await prisma.dashboardRolePermission.findMany({
      where: {
        guildId,
        roleId: { in: userDashboardRoles },
      },
    });

    // If no permissions configured, grant access to non-sensitive modules (backward compatibility)
    // But deny access to 'settings' by default
    if (permissions.length === 0) {
      return module !== 'settings';
    }

    // Check if any of user's roles has permission for this module
    const permissionField = `canAccess${module.charAt(0).toUpperCase() + module.slice(1)}` as 
      'canAccessEvents' | 'canAccessCompositions' | 'canAccessTemplates' | 'canAccessSettings';

    return permissions.some(perm => perm[permissionField]);
  } catch (error) {
    logger.error({ error, guildId, userId, module }, 'Error checking module permission');
    return false;
  }
}

/**
 * Middleware to require permission for a specific module
 */
export function requireModulePermission(module: DashboardModule) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).session?.user;
    const adminGuilds = (request as any).session?.adminGuilds || [];
    const isBotAdmin = (request as any).session?.isBotAdmin || false;
    const guildId = (request.params as any)?.guildId || (request.query as any)?.guildId;

    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    if (!guildId) {
      return reply.code(400).send({ error: 'Guild ID required' });
    }

    // Bot admins have access to all modules in all guilds
    if (isBotAdmin) {
      return;
    }

    // Check if user is admin of this guild (has ADMINISTRATOR permission)
    const isGuildAdmin = adminGuilds.some((g: any) => g.id === guildId);
    if (isGuildAdmin) {
      // Guild admins have access to all modules
      return;
    }

    const accessToken = (request as any).session?.accessToken;
    const hasPermission = await hasModulePermission(guildId, user.id, module, accessToken);

    if (!hasPermission) {
      logger.warn({ userId: user.id, guildId, module }, 'User denied access to module');
      return reply.code(403).send({ 
        error: 'Forbidden',
        message: `You do not have permission to access ${module}` 
      });
    }
  };
}

/**
 * Get user's permissions for a guild
 */
export async function getUserPermissions(
  guildId: string,
  userId: string,
  isAdmin: boolean = false,
  isBotAdmin: boolean = false
): Promise<{
  events: boolean;
  compositions: boolean;
  templates: boolean;
  settings: boolean;
  isManager: boolean;
}> {
  logger.info({ guildId, userId, isAdmin, isBotAdmin }, 'getUserPermissions called');
  
  // Bot admins (global admins from ADMIN_USER_IDS) have full access to all guilds
  if (isBotAdmin) {
    logger.info({ guildId, userId }, 'User is bot admin - granting full access');
    return {
      events: true,
      compositions: true,
      templates: true,
      settings: true,
      isManager: true,
    };
  }
  
  // Guild admins (users with ADMINISTRATOR permission) have full access
  if (isAdmin) {
    logger.info({ guildId, userId }, 'User is guild admin - granting full access');
    return {
      events: true,
      compositions: true,
      templates: true,
      settings: true,
      isManager: true,
    };
  }
  try {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: {
        managerRoleId: true,
        dashboardRoles: true,
      },
    });

    if (!guild) {
      return {
        events: false,
        compositions: false,
        templates: false,
        settings: false,
        isManager: false,
      };
    }

    const memberInfo = await getGuildMember(guildId, userId);
    
    if (!memberInfo) {
      return {
        events: false,
        compositions: false,
        templates: false,
        settings: false,
        isManager: false,
      };
    }

    const userRoles = memberInfo.roles;
    const isManager = !!(guild.managerRoleId && userRoles.includes(guild.managerRoleId));

    // Managers have full access
    if (isManager) {
      return {
        events: true,
        compositions: true,
        templates: true,
        settings: true,
        isManager: true,
      };
    }

    // Check dashboard roles
    const userDashboardRoles = userRoles.filter(roleId => 
      guild.dashboardRoles.includes(roleId)
    );

    if (userDashboardRoles.length === 0) {
      return {
        events: false,
        compositions: false,
        templates: false,
        settings: false,
        isManager: false,
      };
    }

    // Get permissions
    const permissions = await prisma.dashboardRolePermission.findMany({
      where: {
        guildId,
        roleId: { in: userDashboardRoles },
      },
    });

    // If no permissions configured, grant access to basic modules but not settings
    if (permissions.length === 0) {
      return {
        events: true,
        compositions: true,
        templates: true,
        settings: false, // Settings always restricted unless explicitly granted
        isManager: false,
      };
    }

    // Combine permissions from all roles (OR logic - if any role grants access, user has access)
    return {
      events: permissions.some(p => p.canAccessEvents),
      compositions: permissions.some(p => p.canAccessCompositions),
      templates: permissions.some(p => p.canAccessTemplates),
      settings: permissions.some(p => p.canAccessSettings),
      isManager: false,
    };
  } catch (error) {
    logger.error({ error, guildId, userId }, 'Error getting user permissions');
    return {
      events: false,
      compositions: false,
      templates: false,
      settings: false,
      isManager: false,
    };
  }
}
