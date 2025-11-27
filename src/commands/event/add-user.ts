// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/event/add-user.ts
// Add user to event handler

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { CommandError, NotFoundError } from '../../utils/errors.js';
import { updateEventMessage } from '../../messages/eventMessage.js';
import { logAction } from '../../services/auditLog.js';
import { hasManagementPermissions } from '../../utils/permissions.js';
import { getUserDisplayName } from '../../utils/discord.js';

const logger = getModuleLogger('event:add-user');
const prisma = getPrismaClient();

export async function handleAddUser(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guild!.id;
  const eventId = interaction.options.getString('event-id', true);
  const targetUser = interaction.options.getUser('user', true);
  const role = interaction.options.getString('role');
  const spec = interaction.options.getString('spec');

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
    throw new CommandError('You do not have permission to add users to this event. Only the event creator, administrators, or users with the manager role can add users.');
  }

  // Check if user is already a participant
  const existingParticipant = await prisma.participant.findUnique({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: targetUser.id,
      },
    },
  });

  if (existingParticipant) {
    await interaction.editReply(`❌ ${targetUser.username} is already participating in this event.`);
    return;
  }

  // Add user to event
  await prisma.participant.create({
    data: {
      eventId: event.id,
      userId: targetUser.id,
      username: targetUser.username,
      role: role || undefined,
      spec: spec || undefined,
      status: 'confirmed',
    },
  });

  // Update event message
  await updateEventMessage(event.id);

  // Log action
  await logAction({
    guildId,
    eventId: event.id,
    action: 'add_user',
    userId: interaction.user.id,
    username: getUserDisplayName(interaction.user),
    details: {
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
      role,
      spec,
    },
  });

  logger.info(
    { eventId, guildId, targetUserId: targetUser.id },
    'User added to event by admin/creator'
  );

  await interaction.editReply(
    `✅ Added **${targetUser.username}** to event **${event.title}**${role ? ` as ${role}` : ''}${spec ? ` (${spec})` : ''}.`
  );
}
