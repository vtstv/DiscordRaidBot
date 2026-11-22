// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/guild-permissions.ts
// Guild permissions logic

import { getGuildMember, hasAdminPermissions } from '../../auth/discord-oauth.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { getBotGuildIds } from '../../../services/botGuildSync.js';

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
  const userGuildMap = new Map(userGuilds.map(g => [g.id, g]));

  // Find guilds where user has admin permissions
  const adminGuilds: (DiscordGuild & { isRoleBased?: boolean })[] = userGuilds.filter(guild => 
    guild.owner || hasAdminPermissions(guild.permissions)
  );

  // Get guilds where bot is present
  const botGuildIdsArray = await getBotGuildIds();
  const botGuildIds = new Set(botGuildIdsArray);

  // Only check guilds where:
  // 1. User is actually a member (in userGuilds)
  // 2. Bot is also present (in botGuildIds)
  const candidateGuildIds = userGuilds
    .map(g => g.id)
    .filter(id => botGuildIds.has(id));

  if (candidateGuildIds.length > 0) {
    const dbGuildsWithDashboardRoles = await prisma.guild.findMany({
      where: {
        id: { in: candidateGuildIds },
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
      candidateRoleGuildsCount: dbGuildsWithDashboardRoles.length 
    }, 'Checking role-based guild permissions');

    // Run member checks in parallel with Promise.allSettled
    if (dbGuildsWithDashboardRoles.length > 0) {
      const memberChecks = await Promise.allSettled(
        dbGuildsWithDashboardRoles.map(async dbGuild => {
          const memberInfo = await getGuildMember(dbGuild.id, userId);
          return { dbGuild, memberInfo };
        })
      );

      for (const check of memberChecks) {
        if (check.status !== 'fulfilled' || !check.value.memberInfo) {
          continue;
        }

        const { dbGuild, memberInfo } = check.value;
        const hasRequiredRole = memberInfo.roles.some(roleId => 
          dbGuild.dashboardRoles.includes(roleId)
        );

        if (hasRequiredRole) {
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
            const guildInfo = userGuildMap.get(dbGuild.id);
            if (guildInfo) {
              adminGuilds.push({
                ...guildInfo,
                isRoleBased: true
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
