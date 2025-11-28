// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/participation/promote.ts
// Waitlist promotion handlers

import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { ValidationError } from '../../utils/errors.js';
import { updateEventMessage } from '../../messages/eventMessage.js';
import { logAction } from '../auditLog.js';
import { reindexWaitlist } from './waitlist.js';
import type { ParticipationResult } from './types.js';

const logger = getModuleLogger('participation:promote');
const prisma = getPrismaClient();

/**
 * Promote a specific participant from waitlist to confirmed
 */
export async function promoteParticipant(
  eventId: string,
  userId: string,
  promoterId: string
): Promise<ParticipationResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: {
        where: { status: { in: ['confirmed', 'waitlist'] } },
      },
    },
  });

  if (!event) {
    throw new ValidationError('Event not found');
  }

  const participant = await prisma.participant.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (!participant || !['waitlist', 'pending'].includes(participant.status)) {
    return { success: false, message: 'Participant is not on the waitlist or pending approval' };
  }

  // Check if there's space in the event
  const confirmedCount = event.participants.filter((p: any) => p.status === 'confirmed').length;
  
  if (event.maxParticipants && confirmedCount >= event.maxParticipants) {
    return { success: false, message: 'Event is full. Cannot promote from waitlist.' };
  }

  // Check role limits if applicable
  const roleConfig = event.roleConfig as any;
  if (roleConfig && participant.role) {
    const roleLimit = roleConfig.limits?.[participant.role];
    if (roleLimit) {
      const roleCount = event.participants.filter(
        (p: any) => p.role === participant.role && p.status === 'confirmed'
      ).length;

      if (roleCount >= roleLimit) {
        return { 
          success: false, 
          message: `The ${participant.role} role is full. Cannot promote.` 
        };
      }
    }
  }

  // Promote participant
  await prisma.participant.update({
    where: { id: participant.id },
    data: {
      status: 'confirmed',
      position: null,
    },
  });

  // Reindex waitlist positions
  await reindexWaitlist(eventId);

  // Update event message
  await updateEventMessage(eventId);

  // Log action
  await logAction({
    guildId: event.guildId,
    eventId,
    action: 'promote_participant',
    userId: promoterId,
    username: 'Promoter',
    details: { promotedUserId: userId, promotedUsername: participant.username },
  });

  logger.info({ eventId, userId, promoterId }, 'Participant promoted from waitlist');

  return {
    success: true,
    message: `✅ <@${userId}> has been promoted from the bench to the roster!`,
  };
}

/**
 * Promote next participant from waitlist (first in queue)
 */
export async function promoteNext(
  eventId: string,
  promoterId: string
): Promise<ParticipationResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: {
        where: { status: { in: ['confirmed', 'waitlist'] } },
      },
    },
  });

  if (!event) {
    throw new ValidationError('Event not found');
  }

  // Get first person in waitlist or pending approval (prioritize pending, then waitlist by position)
  const pending = await prisma.participant.findFirst({
    where: { eventId, status: 'pending' },
    orderBy: { joinedAt: 'asc' },
  });

  const waitlist = await prisma.participant.findFirst({
    where: { eventId, status: 'waitlist' },
    orderBy: { position: 'asc' },
  });

  const nextParticipant = pending || waitlist;

  if (!nextParticipant) {
    return { success: false, message: 'No participants on the waitlist or pending approval' };
  }

  // Use the promoteParticipant function
  return promoteParticipant(eventId, nextParticipant.userId, promoterId);
}
