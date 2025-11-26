// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/scheduler/statsScheduler.ts
// Statistics scheduler for daily updates and role management

import cron from 'node-cron';
import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';
import { getClient } from '../bot/index.js';
import { createStatsEmbed } from '../embeds/statsEmbed.js';
import { recalculateRanks, getTopParticipants } from '../services/statistics.js';
import { ChannelType } from 'discord.js';

const logger = getModuleLogger('stats-scheduler');
const prisma = getPrismaClient();

let statsSchedulerTask: cron.ScheduledTask | null = null;

/**
 * Start stats scheduler
 */
export function startStatsScheduler(): void {
  if (statsSchedulerTask) {
    logger.warn('Stats scheduler already running');
    return;
  }

  // Run every hour
  statsSchedulerTask = cron.schedule('0 * * * *', async () => {
    try {
      await updateStatsChannels();
      await updateAutoRoles();
    } catch (error) {
      logger.error({ error }, 'Error in stats scheduler');
    }
  });

  logger.info('Stats scheduler started (runs every hour)');
}

/**
 * Stop stats scheduler
 */
export function stopStatsScheduler(): void {
  if (statsSchedulerTask) {
    statsSchedulerTask.stop();
    statsSchedulerTask = null;
    logger.info('Stats scheduler stopped');
  }
}

/**
 * Update stats channel messages for all guilds
 */
async function updateStatsChannels(): Promise<void> {
  const guilds = await prisma.guild.findMany({
    where: {
      statsEnabled: true,
      statsChannelId: { not: null },
    },
  });

  for (const guild of guilds) {
    try {
      const shouldUpdate = checkUpdateInterval(guild.statsUpdateInterval, guild.updatedAt);
      
      if (!shouldUpdate) {
        continue;
      }

      await updateGuildStatsChannel(guild.id, guild.statsChannelId!, guild.statsMessageId);
      
      await prisma.guild.update({
        where: { id: guild.id },
        data: { updatedAt: new Date() },
      });

      logger.info({ guildId: guild.id }, 'Updated stats channel');
    } catch (error) {
      logger.error({ error, guildId: guild.id }, 'Failed to update stats channel');
    }
  }
}

/**
 * Check if stats should be updated based on interval
 */
function checkUpdateInterval(interval: string, lastUpdated: Date): boolean {
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

  switch (interval) {
    case 'daily':
      return hoursSinceUpdate >= 24;
    case 'weekly':
      return hoursSinceUpdate >= 168; // 7 days
    case 'monthly':
      return hoursSinceUpdate >= 720; // 30 days
    default:
      return hoursSinceUpdate >= 24;
  }
}

/**
 * Update stats channel for a specific guild
 */
async function updateGuildStatsChannel(
  guildId: string,
  channelId: string,
  messageId: string | null
): Promise<void> {
  const client = getClient();
  if (!client) {
    logger.warn('Discord client not available');
    return;
  }

  // Recalculate ranks before updating
  await recalculateRanks(guildId);

  const { embed, components } = await createStatsEmbed(guildId, 10);

  try {
    const channel = await client.channels.fetch(channelId);
    
    if (!channel || channel.type !== ChannelType.GuildText) {
      logger.warn({ guildId, channelId }, 'Stats channel not found or not a text channel');
      return;
    }

    // Try to edit existing message
    if (messageId) {
      try {
        const message = await channel.messages.fetch(messageId);
        await message.edit({ embeds: [embed], components });
        return;
      } catch (error) {
        logger.debug({ error, messageId }, 'Could not edit existing stats message, creating new one');
      }
    }

    // Create new message
    const newMessage = await channel.send({ embeds: [embed], components });

    // Save new message ID
    await prisma.guild.update({
      where: { id: guildId },
      data: { statsMessageId: newMessage.id },
    });
  } catch (error) {
    logger.error({ error, guildId, channelId }, 'Failed to update stats channel');
  }
}

/**
 * Update auto-roles for top participants
 */
async function updateAutoRoles(): Promise<void> {
  const guilds = await prisma.guild.findMany({
    where: {
      statsEnabled: true,
      statsAutoRoleEnabled: true,
      statsTop10RoleId: { not: null },
    },
  });

  for (const guild of guilds) {
    try {
      await updateGuildAutoRoles(guild.id, guild.statsTop10RoleId!);
    } catch (error) {
      logger.error({ error, guildId: guild.id }, 'Failed to update auto-roles');
    }
  }
}

/**
 * Update auto-roles for a specific guild
 */
async function updateGuildAutoRoles(guildId: string, roleId: string): Promise<void> {
  const client = getClient();
  if (!client) {
    logger.warn('Discord client not available');
    return;
  }

  try {
    const discordGuild = await client.guilds.fetch(guildId);
    const role = await discordGuild.roles.fetch(roleId);

    if (!role) {
      logger.warn({ guildId, roleId }, 'Top 10 role not found');
      return;
    }

    // Get top 10 participants
    const topParticipants = await getTopParticipants(guildId, 10);
    const topUserIds = new Set(topParticipants.map(p => p.userId));

    // Get all members with the role
    const membersWithRole = role.members.map(m => m.id);

    // Add role to new top participants
    for (const userId of topUserIds) {
      if (!membersWithRole.includes(userId)) {
        try {
          const member = await discordGuild.members.fetch(userId);
          await member.roles.add(role);
          logger.info({ guildId, userId, roleId }, 'Added top participant role');
        } catch (error) {
          logger.debug({ error, userId }, 'Could not add role to user');
        }
      }
    }

    // Remove role from members no longer in top 10
    for (const userId of membersWithRole) {
      if (!topUserIds.has(userId)) {
        try {
          const member = await discordGuild.members.fetch(userId);
          await member.roles.remove(role);
          logger.info({ guildId, userId, roleId }, 'Removed top participant role');
        } catch (error) {
          logger.debug({ error, userId }, 'Could not remove role from user');
        }
      }
    }
  } catch (error) {
    logger.error({ error, guildId }, 'Failed to process auto-roles');
  }
}

/**
 * Manually trigger stats update for a guild
 */
export async function triggerStatsUpdate(guildId: string): Promise<void> {
  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
  });

  if (!guild || !guild.statsEnabled || !guild.statsChannelId) {
    throw new Error('Statistics not configured for this guild');
  }

  await updateGuildStatsChannel(guild.id, guild.statsChannelId, guild.statsMessageId);
  
  if (guild.statsAutoRoleEnabled && guild.statsTop10RoleId) {
    await updateGuildAutoRoles(guild.id, guild.statsTop10RoleId);
  }
}
