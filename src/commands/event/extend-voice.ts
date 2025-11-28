// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/event/extend-voice.ts
// Extend voice channel duration handler

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { CommandError, NotFoundError, PermissionError } from '../../utils/errors.js';
import { hasManagementPermissions } from '../../utils/permissions.js';
import { DateTime } from 'luxon';

const logger = getModuleLogger('event:extend-voice');
const prisma = getPrismaClient();

export async function handleExtendVoice(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  // Check permissions
  const hasPermission = await hasManagementPermissions(interaction);
  if (!hasPermission) {
    throw new PermissionError('Only administrators or users with the manager role can extend voice channels');
  }

  const guildId = interaction.guild!.id;
  const eventId = interaction.options.getString('event-id', true);
  const minutes = interaction.options.getInteger('minutes', true);

  // Validate minutes
  if (minutes < 1 || minutes > 1440) {
    throw new CommandError('Minutes must be between 1 and 1440 (24 hours)');
  }

  // Get event
  const event = await prisma.event.findUnique({
    where: { id: eventId, guildId },
  });

  if (!event) {
    throw new NotFoundError(`Event with ID "${eventId}"`);
  }

  // Check if event has voice channel
  if (!event.voiceChannelId) {
    throw new CommandError('This event does not have a voice channel');
  }

  if (!event.voiceChannelDeleteAt) {
    throw new CommandError('Voice channel deletion time is not set');
  }

  // Calculate new delete time
  const currentDeleteAt = DateTime.fromJSDate(event.voiceChannelDeleteAt);
  const newDeleteAt = currentDeleteAt.plus({ minutes });

  // Update event
  await prisma.event.update({
    where: { id: eventId },
    data: {
      voiceChannelDeleteAt: newDeleteAt.toJSDate(),
    },
  });

  logger.info(
    { eventId, minutes, oldDeleteAt: currentDeleteAt.toISO(), newDeleteAt: newDeleteAt.toISO() },
    'Voice channel duration extended'
  );

  const deleteTimestamp = `<t:${Math.floor(newDeleteAt.toSeconds())}:R>`;
  
  await interaction.editReply({
    content: `✅ Voice channel for event **${event.title}** will now be deleted ${deleteTimestamp}.\n\n` +
      `Extended by **${minutes} minutes**.`,
  });
}
