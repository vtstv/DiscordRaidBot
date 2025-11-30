// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/event/copy.ts

import { ChatInputCommandInteraction, ChannelType } from 'discord.js';
import db from '../../database/db.js';
import { logger } from '../../utils/logger.js';
import { sendEventToChannel } from '../../messages/sendEventToChannel.js';

export async function handleEventCopy(interaction: ChatInputCommandInteraction): Promise<void> {
  const sourceEventId = interaction.options.getString('event-id', true);
  const targetChannel = interaction.options.getChannel('channel', true);
  const newTitle = interaction.options.getString('title');

  await interaction.deferReply({ ephemeral: true });

  try {
    // Validate channel type
    if (targetChannel.type !== ChannelType.GuildText) {
      await interaction.editReply({
        content: '❌ Target channel must be a text channel.',
      });
      return;
    }

    // Fetch source event
    const sourceEvent = await db().event.findUnique({
      where: { id: sourceEventId },
      include: {
        guild: true,
      },
    });

    if (!sourceEvent) {
      await interaction.editReply({
        content: '❌ Source event not found.',
      });
      return;
    }

    // Check permissions
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const isAdmin = member.permissions.has('Administrator');
    const isManager = sourceEvent.guild.managerRoleId && member.roles.cache.has(sourceEvent.guild.managerRoleId);

    if (!isAdmin && !isManager) {
      await interaction.editReply({
        content: '❌ Only administrators or managers can copy events.',
      });
      return;
    }

    // Check if event is in the same guild
    if (sourceEvent.guildId !== interaction.guildId) {
      await interaction.editReply({
        content: '❌ Source event does not belong to this server.',
      });
      return;
    }

    // Create new event with copied parameters
    const newEvent = await db().event.create({
      data: {
        guildId: sourceEvent.guildId,
        templateId: sourceEvent.templateId,
        channelId: targetChannel.id,
        title: newTitle || `${sourceEvent.title} (Copy)`,
        description: sourceEvent.description,
        startTime: sourceEvent.startTime,
        duration: sourceEvent.duration,
        timezone: sourceEvent.timezone,
        maxParticipants: sourceEvent.maxParticipants,
        status: 'scheduled',
        roleConfig: sourceEvent.roleConfig,
        createdBy: interaction.user.id,
        editorRoleId: sourceEvent.editorRoleId,
        requireApproval: sourceEvent.requireApproval,
        createThread: sourceEvent.createThread,
        deleteThread: sourceEvent.deleteThread,
        allowedRoles: sourceEvent.allowedRoles,
        benchOverflow: sourceEvent.benchOverflow,
        deadline: sourceEvent.deadline,
        allowNotes: sourceEvent.allowNotes,
        createVoiceChannel: sourceEvent.createVoiceChannel,
        voiceChannelName: sourceEvent.voiceChannelName,
        voiceChannelRestricted: sourceEvent.voiceChannelRestricted,
        voiceChannelCreateBefore: sourceEvent.voiceChannelCreateBefore,
      },
    });

    // Send message to target channel
    const result = await sendEventToChannel(newEvent.id);

    if (!result.success) {
      await interaction.editReply({
        content: `❌ Failed to send event to target channel: ${result.error}`,
      });
      return;
    }

    // Log action
    await db().logEntry.create({
      data: {
        guildId: interaction.guildId!,
        eventId: newEvent.id,
        userId: interaction.user.id,
        username: interaction.user.tag,
        action: 'event_copied',
        details: {
          sourceEventId: sourceEvent.id,
          sourceEventTitle: sourceEvent.title,
          newEventTitle: newEvent.title,
          targetChannel: targetChannel.id,
        },
      },
    });

    await interaction.editReply({
      content: `✅ Event **${sourceEvent.title}** copied to <#${targetChannel.id}> as **${newEvent.title}**\nNew event ID: \`${newEvent.id}\``,
    });
  } catch (error) {
    logger.error({ error, sourceEventId }, 'Error copying event');
    await interaction.editReply({
      content: '❌ An error occurred while copying the event.',
    });
  }
}
