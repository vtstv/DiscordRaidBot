// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/participation/update-role.ts
// Update participant role handler

import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { ValidationError } from '../../utils/errors.js';
import { updateEventMessage } from '../../messages/eventMessage.js';
import { logAction } from '../auditLog.js';
import type { ParticipationResult } from './types.js';

const logger = getModuleLogger('participation:update-role');
const prisma = getPrismaClient();

/**
 * Update participant's role/spec
 */
export async function updateParticipantRole(
  eventId: string,
  userId: string,
  username: string,
  role: string,
  spec?: string
): Promise<ParticipationResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: true,
    },
  });

  if (!event) {
    throw new ValidationError('Event not found');
  }

  const participant = event.participants.find(p => p.userId === userId);
  if (!participant) {
    return { success: false, message: 'You are not signed up for this event' };
  }

  // Check if role change would violate limits
  const roleConfig = event.roleConfig as any;
  if (roleConfig && role && participant.status === 'confirmed') {
    const roleLimit = roleConfig.limits?.[role];
    if (roleLimit) {
      const roleCount = event.participants.filter(
        p => p.role === role && p.status === 'confirmed' && p.userId !== userId
      ).length;

      if (roleCount >= roleLimit) {
        return { success: false, message: `The ${role} role is full. Please choose a different role.` };
      }
    }
  }

  // Update participant
  await prisma.participant.update({
    where: { id: participant.id },
    data: { role, spec },
  });

  // Update event message
  await updateEventMessage(eventId);

  // Log action
  await logAction({
    guildId: event.guildId,
    eventId,
    action: 'update_role',
    userId,
    username,
    details: { role, spec },
  });

  logger.info({ eventId, userId, role, spec }, 'Participant role updated');

  return { success: true, message: `Role updated to ${role}${spec ? ` (${spec})` : ''}` };
}
