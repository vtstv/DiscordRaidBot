// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/participation/leave.ts
// Leave event handler

import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { ValidationError } from '../../utils/errors.js';
import { updateEventMessage } from '../../messages/eventMessage.js';
import { logAction } from '../auditLog.js';
import { promoteFromWaitlist } from './waitlist.js';
import type { ParticipationResult } from './types.js';

const logger = getModuleLogger('participation:leave');
const prisma = getPrismaClient();

/**
 * Remove a user from an event
 */
export async function leaveEvent(eventId: string, userId: string, username: string): Promise<ParticipationResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new ValidationError('Event not found');
  }

  const participant = await prisma.participant.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (!participant) {
    return { success: false, message: 'You are not signed up for this event' };
  }

  const wasConfirmed = participant.status === 'confirmed';

  // Delete participant
  await prisma.participant.delete({
    where: { id: participant.id },
  });

  // If confirmed participant left and there's a waitlist, promote first person
  if (wasConfirmed) {
    await promoteFromWaitlist(eventId, participant.role);
  }

  // Update event message
  await updateEventMessage(eventId);

  // Log action
  await logAction({
    guildId: event.guildId,
    eventId,
    action: 'leave',
    userId,
    username,
  });

  logger.info({ eventId, userId, username }, 'User left event');

  return { success: true, message: 'You have left the event' };
}
