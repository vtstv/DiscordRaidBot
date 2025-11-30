// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/messages/eventMessage.ts
// Create and update Discord messages for events (non-embed format)

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';
import { DateTime } from 'luxon';
import { getClient } from '../bot/index.js';
import { getTranslator } from '../i18n/index.js';
import { config } from '../config/env.js';
import { DiscordEventService } from '../services/discordEvent.js';

const logger = getModuleLogger('event-message');
const prisma = getPrismaClient();

/**
 * Create event message with interactive components
 */
export async function createEventMessage(event: any) {
  const { t } = await getTranslator(event.guildId);

  // Fetch guild settings to check if view online button should be shown
  const guild = await prisma.guild.findUnique({
    where: { id: event.guildId },
    select: { showViewOnlineButton: true },
  });
  const showViewOnline = guild?.showViewOnlineButton !== false;

  const participants = await prisma.participant.findMany({
    where: { eventId: event.id, status: 'confirmed' },
    orderBy: { joinedAt: 'asc' },
    select: { userId: true, username: true, role: true, spec: true, joinedAt: true, note: true },
  });

  const pending = await prisma.participant.findMany({
    where: { eventId: event.id, status: 'pending' },
    orderBy: { joinedAt: 'asc' },
    select: { userId: true, username: true, role: true },
  });

  logger.debug({
    eventId: event.id,
    requireApproval: event.requireApproval,
    participantsCount: participants.length,
    pendingCount: pending.length,
  }, 'Creating event message with participants');


  // Build message content
  let content = `# ${event.title}\n\n`;

  // Get role config early
  const roleConfig = event.roleConfig as any;

  // Description
  if (event.description) {
    content += `${event.description}\n\n`;
  }

  // Time information
  const startTimeDt = DateTime.fromJSDate(event.startTime, { zone: event.timezone });
  const unixTimestamp = Math.floor(startTimeDt.toMillis() / 1000);
  content += `**${t('event.startTime')}:** <t:${unixTimestamp}:F> (<t:${unixTimestamp}:R>)\n`;

  // Leader/Creator
  content += `**${t('event.leader')}:** <@${event.createdBy}>\n`;

  // Duration if specified
  if (event.duration) {
    const hours = Math.floor(event.duration / 60);
    const minutes = event.duration % 60;
    let durationText = '';
    if (hours > 0) durationText += `${hours} ${t('common.hours')} `;
    if (minutes > 0) durationText += `${minutes} ${t('common.minutes')}`;
    content += `⏱️ **${t('event.plannedDuration')}:** ${durationText.trim()}\n`;
  }

  // Deadline if specified
  if (event.deadline !== null && event.deadline !== undefined) {
    const deadlineTime = DateTime.fromJSDate(event.startTime, { zone: event.timezone })
      .minus({ hours: event.deadline });
    const deadlineUnix = Math.floor(deadlineTime.toMillis() / 1000);
    content += `⏰ **Signup Deadline:** <t:${deadlineUnix}:F> (<t:${deadlineUnix}:R>)\n`;
  }

  content += '\n';

  // Participant information by roles
  if (roleConfig && roleConfig.roles) {
    // Group participants by role
    const roleGroups: Record<string, any[]> = {};

    for (const role of roleConfig.roles) {
      roleGroups[role] = [];
    }

    for (const participant of participants) {
      const role = participant.role || 'Unknown';
      if (!roleGroups[role]) {
        roleGroups[role] = [];
      }
      roleGroups[role].push(participant);
    }

    // Build role composition line
    let compositionLine = `**${t('event.composition')}**\n`;
    for (const role of roleConfig.roles) {
      const limit = roleConfig.limits?.[role];
      const current = roleGroups[role].length;
      const emoji = roleConfig.emojiMap?.[role] || '•';
      compositionLine += `${emoji} ${role} (${limit ? current + '/' + limit : current}):\n`;
      
      if (roleGroups[role].length > 0) {
        compositionLine += roleGroups[role].map((p: any, i: number) => {
          const note = p.note ? ` - _${p.note}_` : '';
          return `${i + 1}. <@${p.userId}>${note}`;
        }).join('\n');
      } else {
        compositionLine += `_${t('event.empty')}_`;
      }
      compositionLine += '\n';
    }
    content += compositionLine;
  }

  // Simple participant list (no roles) - only if no roleConfig
  if (!roleConfig) {
    const maxPart = event.maxParticipants || t('event.unlimited');
    content += `**${t('event.participants')} (${participants.length}/${maxPart})**\n`;

    if (participants.length > 0) {
      for (let i = 0; i < participants.length; i++) {
        const p = participants[i] as any;
        const note = p.note ? ` - _${p.note}_` : '';
        content += `${i + 1}. <@${p.userId}>${note}\n`;
      }
    } else {
      content += `_${t('event.noParticipants')}_\n`;
    }
  }

  // Bench/Waitlist section
  const waitlist = await prisma.participant.findMany({
    where: { eventId: event.id, status: 'waitlist' },
    orderBy: { position: 'asc' },
    select: { userId: true, username: true, role: true, position: true },
  });

  if (waitlist.length > 0) {
    content += `\n**🪑 Bench (${waitlist.length})**\n`;
    for (const p of waitlist) {
      const roleInfo = p.role ? ` [${p.role}]` : '';
      content += `${p.position}. <@${p.userId}>${roleInfo}\n`;
    }
  }

  // Pending participants section (show AFTER participant list)
  if (event.requireApproval && pending.length > 0) {
    content += `\n**⏳ ${t('event.pendingApproval')} (${pending.length})**\n`;
    const pendingMentions = pending.map((p: any) => {
      const roleInfo = p.role ? ` [${p.role}]` : '';
      return `<@${p.userId}>${roleInfo}`;
    }).join(', ');
    content += pendingMentions + '\n';
  }

  // Footer
  content += `\n---\n_ID: \`${event.id.substring(0, 8)}\`_`;

  // Interactive components
  const components: any[] = [];

  // Create image embed if template has imageUrl
  const embeds: any[] = [];
  if (roleConfig?.imageUrl) {
    const imageEmbed = new EmbedBuilder()
      .setImage(roleConfig.imageUrl);
    embeds.push(imageEmbed);
  }

  if (event.status === 'scheduled' || event.status === 'active') {
    // Create role buttons if template has roles
    if (roleConfig && roleConfig.roles && roleConfig.roles.length > 0) {
      // First row: role buttons (max 5)
      const firstRowRoles = roleConfig.roles.slice(0, 5);
      const buttonRow1 = new ActionRowBuilder<ButtonBuilder>();
      
      for (const role of firstRowRoles) {
        const emoji = roleConfig.emojiMap?.[role];
        const button = new ButtonBuilder()
          .setCustomId(`event_join_role:${event.id}:${role}`)
          .setLabel(role)
          .setStyle(ButtonStyle.Primary);
        
        if (emoji) {
          button.setEmoji({ name: emoji });
        }
        
        buttonRow1.addComponents(button);
      }
      components.push(buttonRow1);

      // Second row: remaining roles if any (max 5)
      if (roleConfig.roles.length > 5) {
        const secondRowRoles = roleConfig.roles.slice(5, 10);
        const buttonRow2 = new ActionRowBuilder<ButtonBuilder>();
        
        for (const role of secondRowRoles) {
          const emoji = roleConfig.emojiMap?.[role];
          const button = new ButtonBuilder()
            .setCustomId(`event_join_role:${event.id}:${role}`)
            .setLabel(role)
            .setStyle(ButtonStyle.Primary);
          
          if (emoji) {
            button.setEmoji({ name: emoji });
          }
          
          buttonRow2.addComponents(button);
        }
        components.push(buttonRow2);
      }

      // Action buttons row
      const actionRow = new ActionRowBuilder<ButtonBuilder>();
      
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`event_leave:${event.id}`)
          .setLabel(t('buttons.leave'))
          .setStyle(ButtonStyle.Danger)
      );

      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`event_menu:${event.id}`)
          .setLabel(t('buttons.edit'))
          .setStyle(ButtonStyle.Secondary)
      );

      // View online button (conditionally shown based on guild settings)
      if (showViewOnline && config.WEB_BASE_URL) {
        const viewOnlineRow = new ActionRowBuilder<ButtonBuilder>();
        viewOnlineRow.addComponents(
          new ButtonBuilder()
            .setLabel('View online')
            .setStyle(ButtonStyle.Link)
            .setURL(`${config.WEB_BASE_URL}/event/${event.id}`)
        );
        components.push(viewOnlineRow);
      }

      components.push(actionRow);
    } else {
      // Simple buttons without roles
      const buttonRow = new ActionRowBuilder<ButtonBuilder>();
      
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`event_join:${event.id}`)
          .setLabel(t('buttons.join'))
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`event_leave:${event.id}`)
          .setLabel(t('buttons.leave'))
          .setStyle(ButtonStyle.Danger)
      );

      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`event_menu:${event.id}`)
          .setLabel(t('buttons.edit'))
          .setStyle(ButtonStyle.Secondary)
      );

      // View online button (conditionally shown based on guild settings)
      if (showViewOnline && config.WEB_BASE_URL) {
        const viewOnlineRow = new ActionRowBuilder<ButtonBuilder>();
        viewOnlineRow.addComponents(
          new ButtonBuilder()
            .setLabel('View online')
            .setStyle(ButtonStyle.Link)
            .setURL(`${config.WEB_BASE_URL}/event/${event.id}`)
        );
        components.push(viewOnlineRow);
      }

      components.push(buttonRow);
    }
  }

  return { content, components, embeds };
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
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      logger.warn({ eventId, channelId: event.channelId }, 'Invalid channel');
      return;
    }

    const message = await channel.messages.fetch(event.messageId);
    const messageData = await createEventMessage(event);

    await message.edit(messageData);
    logger.debug({ eventId, messageId: event.messageId }, 'Event message updated');

    // Update Discord scheduled event if exists
    try {
      const discordEventService = new DiscordEventService(client);
      await discordEventService.updateDiscordEvent(eventId);
    } catch (discordEventError) {
      logger.warn({ error: discordEventError, eventId }, 'Failed to update Discord event');
    }
  } catch (error) {
    logger.error({ error, eventId }, 'Failed to update event message');
  }
}
