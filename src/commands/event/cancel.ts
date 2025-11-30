// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/event/cancel.ts
// Cancel event handler

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { NotFoundError } from '../../utils/errors.js';
import { updateEventMessage } from '../../messages/eventMessage.js';
import { logAction } from '../../services/auditLog.js';
import { getUserDisplayName } from '../../utils/discord.js';
import { DiscordEventService } from '../../services/discordEvent.js';

const logger = getModuleLogger('event:cancel');
const prisma = getPrismaClient();

export async function handleCancel(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guild!.id;
  const eventId = interaction.options.getString('event-id', true);

  const event = await prisma.event.findFirst({
    where: { id: eventId, guildId },
  });

  if (!event) {
    throw new NotFoundError('Event');
  }

  // Update event status
  await prisma.event.update({
    where: { id: eventId },
    data: { status: 'cancelled' },
  });

  // Update event message
  await updateEventMessage(event.id);

  // Cancel native Discord event if exists
  try {
    const discordEventService = new DiscordEventService(interaction.client);
    await discordEventService.completeDiscordEvent(event.id, true);
  } catch (discordEventError) {
    logger.warn({ error: discordEventError, eventId }, 'Failed to cancel Discord event');
  }

  // Log action
  await logAction({
    guildId,
    eventId: event.id,
    action: 'cancel_event',
    userId: interaction.user.id,
    username: getUserDisplayName(interaction.user),
    details: { title: event.title },
  });

  logger.info({ eventId, guildId }, 'Event cancelled');

  await interaction.editReply(`✅ Event **${event.title}** has been cancelled.`);
}
