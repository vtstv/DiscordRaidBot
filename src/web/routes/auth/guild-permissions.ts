// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/guild-permissions.ts
// Guild permissions logic

import { getGuildMember, hasAdminPermissions } from '../../auth/discord-oauth.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';

const logger = getModuleLogger('guild-permissions');
const prisma = getPrismaClient();

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface AdminGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  isRoleBased: boolean;
}

/**
 * Get admin guilds for user
 * Combines ADMINISTRATOR permission guilds with dashboardRoles guilds
 */
export async function getAdminGuildsForUser(
  userId: string,
  userGuilds: DiscordGuild[]
): Promise<AdminGuild[]> {
  // Find guilds where user has admin permissions
  let adminGuilds: (DiscordGuild & { isRoleBased?: boolean })[] = userGuilds.filter(guild => 
    guild.owner || hasAdminPermissions(guild.permissions)
  );

  // Also check guilds with dashboardRoles configured
  const dbGuildsWithDashboardRoles = await prisma.guild.findMany({
    where: {
      dashboardRoles: {
        isEmpty: false
      }
    },
    select: {
      id: true,
      name: true,
      dashboardRoles: true
    }
  });

  logger.debug({ 
    userId, 
    adminGuildsCount: adminGuilds.length,
    dashboardRoleGuildsCount: dbGuildsWithDashboardRoles.length 
  }, 'Checking guild permissions');

  // For each guild with dashboardRoles, check if user has any of those roles
  for (const dbGuild of dbGuildsWithDashboardRoles) {
    // Get user's member info in this guild
    const memberInfo = await getGuildMember(dbGuild.id, userId);
    
    if (memberInfo) {
      // Check if user has any role in dashboardRoles
      const hasRequiredRole = memberInfo.roles.some(roleId => 
        dbGuild.dashboardRoles.includes(roleId)
      );

      if (hasRequiredRole) {
        // Check if user already in adminGuilds (has ADMINISTRATOR permission)
        const existingIndex = adminGuilds.findIndex(g => g.id === dbGuild.id);
        
        if (existingIndex !== -1) {
          // User has ADMINISTRATOR but also has dashboard role
          // Mark as role-based to enforce permission restrictions
          adminGuilds[existingIndex] = {
            ...adminGuilds[existingIndex],
            isRoleBased: true
          };
        } else {
          // User doesn't have ADMINISTRATOR, only dashboard role
          // Find the guild in user's guilds list
          const guildInfo = userGuilds.find(g => g.id === dbGuild.id);
          if (guildInfo) {
            // Mark this guild as role-based access (not admin)
            adminGuilds.push({
              ...guildInfo,
              isRoleBased: true // Flag to indicate this is role-based, not admin
            });
          } else {
            // User is in the guild but it didn't come from Discord API
            // This shouldn't happen, but add it anyway with minimal info
            adminGuilds.push({
              id: dbGuild.id,
              name: dbGuild.name,
              icon: null,
              isRoleBased: true, // Flag to indicate this is role-based, not admin
              owner: false,
              permissions: '0'
            });
          }
        }

        logger.debug({ 
          guildId: dbGuild.id, 
          userId, 
          hasRequiredRole 
        }, 'User has dashboard role access');
      }
    }
  }

  // Map to final format
  return adminGuilds.map(g => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    owner: g.owner,
    isRoleBased: g.isRoleBased || false,
  }));
}
