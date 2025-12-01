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

    // Check if user is admin of this guild
    const userGuild = adminGuilds.find((g: any) => g.id === guildId);
    const isGuildAdmin = !!userGuild;
    const isRoleBased = userGuild?.isRoleBased || false;
    
    // Guild admins have access to all modules ONLY if not role-based
    if (isGuildAdmin && !isRoleBased) {
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
  isBotAdmin: boolean = false,
  isRoleBased: boolean = false
): Promise<{
  events: boolean;
  compositions: boolean;
  templates: boolean;
  settings: boolean;
  isManager: boolean;
}> {
  logger.info({ guildId, userId, isAdmin, isBotAdmin, isRoleBased }, 'getUserPermissions called');
  
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
  // BUT NOT if they only have access via role-based permissions
  if (isAdmin && !isRoleBased) {
    logger.info({ guildId, userId }, 'User is guild admin (ADMINISTRATOR permission) - granting full access, bypassing role permissions');
    return {
      events: true,
      compositions: true,
      templates: true,
      settings: true,
      isManager: true,
    };
  }
  
  // If isRoleBased is true, user only has access via dashboard roles, not ADMINISTRATOR
  if (isRoleBased) {
    logger.info({ guildId, userId }, 'User has role-based access - checking DashboardRolePermission');
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

/**
 * Middleware to require any access to a guild (for stats, public data, etc.)
 * This is a basic check that user has some relationship with the guild
 */
export function requireGuildAccess() {
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

    // Bot admins have access to all guilds
    if (isBotAdmin) {
      return;
    }

    // Check if user is admin or member of this guild
    const userGuild = adminGuilds.find((g: any) => g.id === guildId);
    
    if (userGuild) {
      // User is admin or has dashboard role access
      return;
    }

    // Check if user has ANY dashboard role in this guild
    try {
      const guild = await prisma.guild.findUnique({
        where: { id: guildId },
        select: {
          dashboardRoles: true,
          managerRoleId: true,
        },
      });

      if (!guild) {
        return reply.code(404).send({ error: 'Guild not found' });
      }

      const memberInfo = await getGuildMember(guildId, user.id);
      
      if (!memberInfo) {
        logger.warn({ userId: user.id, guildId }, 'User is not a member of this guild');
        return reply.code(403).send({ 
          error: 'Forbidden',
          message: 'You are not a member of this guild' 
        });
      }

      const userRoles = memberInfo.roles;

      // Check if user has manager role or any dashboard role
      const hasManagerRole = guild.managerRoleId && userRoles.includes(guild.managerRoleId);
      const hasDashboardRole = userRoles.some(roleId => guild.dashboardRoles.includes(roleId));

      if (hasManagerRole || hasDashboardRole) {
        return;
      }

      logger.warn({ userId: user.id, guildId }, 'User has no roles granting access to guild');
      return reply.code(403).send({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this guild' 
      });
    } catch (error) {
      logger.error({ error, guildId, userId: user.id }, 'Error checking guild access');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  };
}
