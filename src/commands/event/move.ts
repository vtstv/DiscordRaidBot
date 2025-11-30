// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/event/move.ts

import { ChatInputCommandInteraction, ChannelType, TextChannel } from 'discord.js';
import db from '../../database/db.js';
import { logger } from '../../utils/logger.js';
import { sendEventToChannel } from '../../messages/sendEventToChannel.js';
import { logAction } from '../../services/auditLog.js';

export async function handleEventMove(interaction: ChatInputCommandInteraction): Promise<void> {
  const eventId = interaction.options.getString('event-id', true);
  const targetChannel = interaction.options.getChannel('channel', true);

  await interaction.deferReply({ ephemeral: true });

  try {
    // Validate channel type
    if (targetChannel.type !== ChannelType.GuildText) {
      await interaction.editReply({
        content: '❌ Target channel must be a text channel.',
      });
      return;
    }

    // Fetch event
    const event = await db().event.findUnique({
      where: { id: eventId },
      include: {
        guild: true,
        participants: true,
      },
    });

    if (!event) {
      await interaction.editReply({
        content: '❌ Event not found.',
      });
      return;
    }

    // Check permissions
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const isCreator = event.createdBy === interaction.user.id;
    const isAdmin = member.permissions.has('Administrator');
    const isManager = event.guild.managerRoleId && member.roles.cache.has(event.guild.managerRoleId);

    if (!isCreator && !isAdmin && !isManager) {
      await interaction.editReply({
        content: '❌ Only the event creator, administrators, or managers can move events.',
      });
      return;
    }

    // Check if event is in the same guild
    if (event.guildId !== interaction.guildId) {
      await interaction.editReply({
        content: '❌ Event does not belong to this server.',
      });
      return;
    }

    // Check if event is not archived or deleted
    if (event.archivedAt || event.deletedAt) {
      await interaction.editReply({
        content: '❌ Cannot move archived or deleted events.',
      });
      return;
    }

    // Delete old message if exists
    if (event.messageId && event.channelId) {
      try {
        const oldChannel = await interaction.client.channels.fetch(event.channelId) as TextChannel;
        if (oldChannel) {
          const oldMessage = await oldChannel.messages.fetch(event.messageId);
          await oldMessage.delete();
        }
      } catch (error) {
        logger.warn({ error, eventId, oldChannelId: event.channelId }, 'Failed to delete old event message');
      }
    }

    // Update event channel first
    await db().event.update({
      where: { id: eventId },
      data: {
        channelId: targetChannel.id,
        messageId: null, // Will be updated by sendEventToChannel
      },
    });

    // Send new message to target channel
    const result = await sendEventToChannel(event.id);

    if (!result.success) {
      await interaction.editReply({
        content: `❌ Failed to send event to target channel: ${result.error}`,
      });
      return;
    }

    // Log action
    await logAction({
      guildId: interaction.guildId!,
      eventId: eventId,
      userId: interaction.user.id,
      username: interaction.user.tag,
      action: 'event_moved',
      details: {
        eventTitle: event.title,
        fromChannel: event.channelId,
        toChannel: targetChannel.id,
      },
    });

    await interaction.editReply({
      content: `✅ Event **${event.title}** moved to <#${targetChannel.id}>`,
    });
  } catch (error) {
    logger.error({ error, eventId }, 'Error moving event');
    await interaction.editReply({
      content: '❌ An error occurred while moving the event.',
    });
  }
}
