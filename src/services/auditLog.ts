// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/auditLog.ts
// Audit logging service

import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';
import { getClient } from '../bot/index.js';
import { EmbedBuilder } from 'discord.js';

const logger = getModuleLogger('audit-log');
const prisma = getPrismaClient();

interface LogActionParams {
  guildId: string;
  eventId?: string;
  action: string;
  userId: string;
  username: string;
  details?: Record<string, any>;
}

/**
 * Log an action to the database and optionally to a Discord channel
 */
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    // Save to database
    await prisma.logEntry.create({
      data: {
        guildId: params.guildId,
        eventId: params.eventId,
        action: params.action,
        userId: params.userId,
        username: params.username,
        details: params.details || {},
      },
    });

    logger.debug({ action: params.action, user: params.username }, 'Action logged');

    // Optionally post to log channel
    await postToLogChannel(params);
  } catch (error) {
    logger.error({ error, action: params.action }, 'Failed to log action');
  }
}

/**
 * Post log entry to configured Discord log channel
 */
async function postToLogChannel(params: LogActionParams): Promise<void> {
  try {
    const guild = await prisma.guild.findUnique({
      where: { id: params.guildId },
      select: { logChannelId: true },
    });

    if (!guild || !guild.logChannelId) {
      return; // No log channel configured
    }

    const client = getClient();
    if (!client) {
      return;
    }

    const channel = await client.channels.fetch(guild.logChannelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(getActionColor(params.action))
      .setTitle(`📋 ${formatActionName(params.action)}`)
      .setDescription(`Action by ${params.username}`)
      .addFields(
        { name: 'User ID', value: params.userId, inline: true },
        { name: 'Action', value: params.action, inline: true }
      )
      .setTimestamp();

    if (params.details && Object.keys(params.details).length > 0) {
      const detailsText = JSON.stringify(params.details, null, 2).slice(0, 1000);
      embed.addFields({ name: 'Details', value: `\`\`\`json\n${detailsText}\n\`\`\``, inline: false });
    }

    await channel.send({ embeds: [embed] });
  } catch (error) {
    logger.error({ error }, 'Failed to post to log channel');
  }
}

function getActionColor(action: string): number {
  if (action.includes('create')) return 0x00ff00;
  if (action.includes('delete') || action.includes('cancel')) return 0xff0000;
  if (action.includes('edit') || action.includes('update')) return 0xffaa00;
  return 0x0099ff;
}

function formatActionName(action: string): string {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
