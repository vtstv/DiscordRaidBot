// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/utils/discord-enrichment.ts
// Utilities for enriching participant data with live Discord info

import { getModuleLogger } from './logger.js';
import { getClient } from '../bot/index.js';
import { config } from '../config/env.js';

const logger = getModuleLogger('discord-enrichment');

// Discord REST API base URL
const DISCORD_API_BASE = 'https://discord.com/api/v10';

export interface EnrichedParticipant {
  userId: string;
  username: string;
  discordUsername?: string;
  discordDisplayName?: string;
  discordAvatar?: string;
  role?: string;
  spec?: string;
  status: string;
  joinedAt: Date;
  noShow?: boolean;
}

/**
 * Fetch Discord user via REST API (works from web server)
 */
async function fetchDiscordUser(userId: string): Promise<{
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
} | null> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/${userId}`, {
      headers: {
        'Authorization': `Bot ${config.DISCORD_TOKEN}`,
      },
    });

    if (!response.ok) {
      logger.debug({ status: response.status, userId }, 'Failed to fetch user from Discord API');
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.debug({ error, userId }, 'Error fetching user from Discord API');
    return null;
  }
}

/**
 * Fetch Discord guild member via REST API
 */
async function fetchDiscordMember(guildId: string, userId: string): Promise<{
  user: {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
  };
  nick?: string;
} | null> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`, {
      headers: {
        'Authorization': `Bot ${config.DISCORD_TOKEN}`,
      },
    });

    if (!response.ok) {
      logger.debug({ status: response.status, userId, guildId }, 'Failed to fetch member from Discord API');
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.debug({ error, userId, guildId }, 'Error fetching member from Discord API');
    return null;
  }
}

/**
 * Get avatar URL from Discord user data
 */
function getAvatarUrl(userId: string, avatarHash?: string): string {
  if (avatarHash) {
    const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}`;
  }
  // Default avatar based on discriminator (deprecated) or user ID
  const defaultNum = (BigInt(userId) >> 22n) % 6n;
  return `https://cdn.discordapp.com/embed/avatars/${defaultNum}.png`;
}

/**
 * Enrich participant data with live Discord user information
 */
export async function enrichParticipantData(
  participants: Array<{
    userId: string;
    username: string;
    role?: string | null;
    spec?: string | null;
    status: string;
    joinedAt: Date;
    noShow?: boolean;
  }>,
  guildId: string
): Promise<EnrichedParticipant[]> {
  const client = getClient();
  
  // Try using bot client first (if available, e.g., when called from bot)
  if (client) {
    try {
      const guild = await client.guilds.fetch(guildId);
      
      const enriched = await Promise.all(
        participants.map(async (participant) => {
          try {
            const member = await guild.members.fetch(participant.userId);
            
            return {
              userId: participant.userId,
              username: participant.username,
              discordUsername: member.user.username,
              discordDisplayName: member.displayName,
              discordAvatar: member.user.displayAvatarURL(),
              role: participant.role || undefined,
              spec: participant.spec || undefined,
              status: participant.status,
              joinedAt: participant.joinedAt,
              noShow: participant.noShow,
            };
          } catch (error) {
            logger.debug({ error, userId: participant.userId }, 'Could not fetch Discord member via client');
            
            return {
              userId: participant.userId,
              username: participant.username,
              role: participant.role || undefined,
              spec: participant.spec || undefined,
              status: participant.status,
              joinedAt: participant.joinedAt,
              noShow: participant.noShow,
            };
          }
        })
      );

      return enriched;
    } catch (error) {
      logger.warn({ error, guildId }, 'Client available but guild fetch failed, falling back to REST API');
    }
  }

  // Fallback to REST API (works from web server)
  logger.debug('Using Discord REST API for enrichment');
  
  const enriched = await Promise.all(
    participants.map(async (participant) => {
      try {
        const member = await fetchDiscordMember(guildId, participant.userId);
        
        if (member) {
          const displayName = member.nick || member.user.global_name || member.user.username;
          const avatar = getAvatarUrl(member.user.id, member.user.avatar);
          
          return {
            userId: participant.userId,
            username: participant.username,
            discordUsername: member.user.username,
            discordDisplayName: displayName,
            discordAvatar: avatar,
            role: participant.role || undefined,
            spec: participant.spec || undefined,
            status: participant.status,
            joinedAt: participant.joinedAt,
            noShow: participant.noShow,
          };
        }
        
        // Fallback to user endpoint if member not found
        const user = await fetchDiscordUser(participant.userId);
        if (user) {
          const displayName = user.global_name || user.username;
          const avatar = getAvatarUrl(user.id, user.avatar);
          
          return {
            userId: participant.userId,
            username: participant.username,
            discordUsername: user.username,
            discordDisplayName: displayName,
            discordAvatar: avatar,
            role: participant.role || undefined,
            spec: participant.spec || undefined,
            status: participant.status,
            joinedAt: participant.joinedAt,
            noShow: participant.noShow,
          };
        }
        
        // No Discord data found
        return {
          userId: participant.userId,
          username: participant.username,
          role: participant.role || undefined,
          spec: participant.spec || undefined,
          status: participant.status,
          joinedAt: participant.joinedAt,
          noShow: participant.noShow,
        };
      } catch (error) {
        logger.debug({ error, userId: participant.userId }, 'Could not enrich participant');
        
        return {
          userId: participant.userId,
          username: participant.username,
          role: participant.role || undefined,
          spec: participant.spec || undefined,
          status: participant.status,
          joinedAt: participant.joinedAt,
          noShow: participant.noShow,
        };
      }
    })
  );

  return enriched;
}

/**
 * Get Discord user info by ID (simplified version for single user)
 */
export async function getDiscordUserInfo(userId: string, guildId?: string): Promise<{
  id: string;
  username: string;
  displayName: string;
  avatar: string;
} | null> {
  const client = getClient();
  
  // Try bot client first
  if (client) {
    try {
      const user = await client.users.fetch(userId);
      
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.displayAvatarURL(),
      };
    } catch (error) {
      logger.debug({ error, userId }, 'Could not fetch Discord user via client');
    }
  }

  // Fallback to REST API
  try {
    let member = null;
    if (guildId) {
      member = await fetchDiscordMember(guildId, userId);
    }
    
    if (member) {
      const displayName = member.nick || member.user.global_name || member.user.username;
      const avatar = getAvatarUrl(member.user.id, member.user.avatar);
      
      return {
        id: member.user.id,
        username: member.user.username,
        displayName,
        avatar,
      };
    }
    
    // Fallback to user endpoint
    const user = await fetchDiscordUser(userId);
    if (user) {
      const displayName = user.global_name || user.username;
      const avatar = getAvatarUrl(user.id, user.avatar);
      
      return {
        id: user.id,
        username: user.username,
        displayName,
        avatar,
      };
    }
    
    return null;
  } catch (error) {
    logger.debug({ error, userId }, 'Could not fetch Discord user');
    return null;
  }
}

/**
 * Bulk fetch Discord user info for multiple user IDs
 */
export async function bulkGetDiscordUserInfo(userIds: string[]): Promise<Map<string, {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}>> {
  const client = getClient();
  const result = new Map();
  
  if (!client) {
    return result;
  }

  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const user = await client.users.fetch(userId);
        result.set(userId, {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.displayAvatarURL(),
        });
      } catch (error) {
        logger.debug({ error, userId }, 'Could not fetch Discord user in bulk');
      }
    })
  );

  return result;
}
