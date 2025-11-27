// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/event/remove-user.ts
// Remove user from event handler

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { CommandError, NotFoundError } from '../../utils/errors.js';
import { updateEventMessage } from '../../messages/eventMessage.js';
import { logAction } from '../../services/auditLog.js';
import { hasManagementPermissions } from '../../utils/permissions.js';
import { getUserDisplayName } from '../../utils/discord.js';

const logger = getModuleLogger('event:remove-user');
const prisma = getPrismaClient();

export async function handleRemoveUser(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guild!.id;
  const eventId = interaction.options.getString('event-id', true);
  const targetUser = interaction.options.getUser('user', true);

  // Check permissions
  const hasPermission = await hasManagementPermissions(interaction);
  
  // Also check if user is event creator
  const event = await prisma.event.findFirst({
    where: { id: eventId, guildId },
    include: { guild: true },
  });

  if (!event) {
    throw new NotFoundError('Event');
  }

  const isCreator = event.createdBy === interaction.user.id;

  if (!hasPermission && !isCreator) {
    throw new CommandError('You do not have permission to remove users from this event. Only the event creator, administrators, or users with the manager role can remove users.');
  }

  // Remove user from event
  await prisma.participant.delete({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: targetUser.id,
      },
    },
  });

  // Update event message
  await updateEventMessage(event.id);

  // Log action
  await logAction({
    guildId,
    eventId: event.id,
    action: 'remove_user',
    userId: interaction.user.id,
    username: getUserDisplayName(interaction.user),
    details: {
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
    },
  });

  logger.info(
    { eventId, guildId, targetUserId: targetUser.id },
    'User removed from event by admin/creator'
  );

  await interaction.editReply(
    `✅ Removed **${targetUser.username}** from event **${event.title}**.`
  );
}
