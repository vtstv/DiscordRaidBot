// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/embeds/eventEmbed.ts
// Create and update Discord embeds for events

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';
import { formatDiscordTimestamp } from '../utils/time.js';
import { DateTime } from 'luxon';
import { getClient } from '../bot/index.js';

const logger = getModuleLogger('event-embed');
const prisma = getPrismaClient();

/**
 * Create event embed with interactive components
 */
export async function createEventEmbed(event: any) {
  const participants = await prisma.participant.findMany({
    where: { eventId: event.id, status: 'confirmed' },
    orderBy: { joinedAt: 'asc' },
  });

  const waitlist = await prisma.participant.findMany({
    where: { eventId: event.id, status: 'waitlist' },
    orderBy: { position: 'asc' },
  });

  const embed = new EmbedBuilder()
    .setColor(getEventColor(event.status))
    .setTitle(event.title)
    .setDescription(event.description || 'No description provided')
    .setTimestamp();

  // Time information
  const startTimeDt = DateTime.fromJSDate(event.startTime, { zone: event.timezone });
  embed.addFields({
    name: '📅 Start Time',
    value: formatDiscordTimestamp(startTimeDt, 'F'),
    inline: true,
  });

  if (event.duration) {
    embed.addFields({
      name: '⏱️ Duration',
      value: `${event.duration} minutes`,
      inline: true,
    });
  }

  // Status
  embed.addFields({
    name: '📊 Status',
    value: capitalizeFirst(event.status),
    inline: true,
  });

  // Participant information
  const roleConfig = event.roleConfig as any;
  
  if (roleConfig && roleConfig.roles) {
    // Group participants by role
    const roleGroups: Record<string, string[]> = {};
    
    for (const role of roleConfig.roles) {
      roleGroups[role] = [];
    }

    for (const participant of participants) {
      const role = participant.role || 'Unknown';
      if (!roleGroups[role]) {
        roleGroups[role] = [];
      }
      const emoji = roleConfig.emojiMap?.[role] || '•';
      const spec = participant.spec ? ` (${participant.spec})` : '';
      roleGroups[role].push(`${emoji} ${participant.username}${spec}`);
    }

    // Add fields for each role
    for (const role of roleConfig.roles) {
      const limit = roleConfig.limits?.[role] || 'Unlimited';
      const current = roleGroups[role].length;
      const emoji = roleConfig.emojiMap?.[role] || '';
      
      const value = roleGroups[role].length > 0
        ? roleGroups[role].join('\n')
        : '_No signups yet_';

      embed.addFields({
        name: `${emoji} ${role} (${current}/${limit})`,
        value: value.slice(0, 1024),
        inline: true,
      });
    }
  } else {
    // Simple participant list
    const participantList = participants.length > 0
      ? participants.map(p => `• ${p.username}`).join('\n')
      : '_No signups yet_';
    
    const maxPart = event.maxParticipants || 'Unlimited';
    embed.addFields({
      name: `👥 Participants (${participants.length}/${maxPart})`,
      value: participantList.slice(0, 1024),
      inline: false,
    });
  }

  // Waitlist
  if (waitlist.length > 0) {
    const waitlistText = waitlist.map((p, i) => `${i + 1}. ${p.username}`).join('\n');
    embed.addFields({
      name: `⏳ Waitlist (${waitlist.length})`,
      value: waitlistText.slice(0, 1024),
      inline: false,
    });
  }

  // Interactive components
  const components: any[] = [];

  if (event.status === 'scheduled' || event.status === 'active') {
    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`event_join:${event.id}`)
          .setLabel('Join')
          .setStyle(ButtonStyle.Success)
          .setEmoji({ name: '✅' }),
        new ButtonBuilder()
          .setCustomId(`event_leave:${event.id}`)
          .setLabel('Leave')
          .setStyle(ButtonStyle.Danger)
          .setEmoji({ name: '❌' }),
      );

    components.push(buttons);

    // Role selection menu
    if (roleConfig && roleConfig.roles && roleConfig.roles.length > 1) {
      const options = roleConfig.roles.map((role: string) => {
        const option: any = {
          label: role,
          value: role,
        };
        
        // Only add emoji if it exists and is valid
        if (roleConfig.emojiMap?.[role]) {
          option.emoji = roleConfig.emojiMap[role];
        }
        
        return option;
      });

      const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`event_role:${event.id}`)
            .setPlaceholder('Select your role')
            .addOptions(options)
        );

      components.push(selectMenu);
    }
  }

  return { embeds: [embed], components };
}

/**
 * Update event message in Discord
 */
export async function updateEventMessage(eventId: string): Promise<void> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || !event.messageId) {
      logger.warn({ eventId }, 'Cannot update event message - no message ID');
      return;
    }

    const client = getClient();
    if (!client) {
      logger.warn('Client not available');
      return;
    }

    const channel = await client.channels.fetch(event.channelId);
    if (!channel || !channel.isTextBased()) {
      logger.warn({ eventId, channelId: event.channelId }, 'Invalid channel');
      return;
    }

    const message = await channel.messages.fetch(event.messageId);
    const embedData = await createEventEmbed(event);

    await message.edit(embedData);
    logger.debug({ eventId, messageId: event.messageId }, 'Event message updated');
  } catch (error) {
    logger.error({ error, eventId }, 'Failed to update event message');
  }
}

function getEventColor(status: string): number {
  switch (status) {
    case 'scheduled':
      return 0x0099ff; // Blue
    case 'active':
      return 0x00ff00; // Green
    case 'completed':
      return 0x808080; // Gray
    case 'cancelled':
      return 0xff0000; // Red
    default:
      return 0x0099ff;
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
