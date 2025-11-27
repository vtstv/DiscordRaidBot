// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/participation/approval.ts
// Participant approval/rejection handlers

import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { ValidationError } from '../../utils/errors.js';
import { updateEventMessage } from '../../messages/eventMessage.js';
import { logAction } from '../auditLog.js';
import type { ApprovalResult } from './types.js';

const logger = getModuleLogger('participation:approval');
const prisma = getPrismaClient();

/**
 * Approve pending participant(s)
 */
export async function approveParticipants(
  eventId: string,
  userIds: string[],
  approverId: string
): Promise<ApprovalResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: {
        where: { status: { in: ['confirmed', 'pending'] } },
      },
    },
  });

  if (!event) {
    throw new ValidationError('Event not found');
  }

  if (!event.requireApproval) {
    throw new ValidationError('This event does not require approval');
  }

  let approved = 0;
  const roleConfig = event.roleConfig as any;

  for (const userId of userIds) {
    const participant = await prisma.participant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!participant || participant.status !== 'pending') {
      continue;
    }

    // Check if there's space
    const confirmedCount = event.participants.filter((p: any) => p.status === 'confirmed').length;
    
    if (event.maxParticipants && confirmedCount >= event.maxParticipants) {
      // Move to waitlist instead
      await prisma.participant.update({
        where: { id: participant.id },
        data: { status: 'waitlist', position: confirmedCount + 1 },
      });
      continue;
    }

    // Check role limits
    if (roleConfig && participant.role) {
      const roleLimit = roleConfig.limits?.[participant.role];
      if (roleLimit) {
        const roleCount = event.participants.filter(
          (p: any) => p.role === participant.role && p.status === 'confirmed'
        ).length;

        if (roleCount >= roleLimit) {
          // Move to waitlist
          await prisma.participant.update({
            where: { id: participant.id },
            data: { status: 'waitlist', position: confirmedCount + 1 },
          });
          continue;
        }
      }
    }

    // Approve participant
    await prisma.participant.update({
      where: { id: participant.id },
      data: { status: 'confirmed' },
    });

    await logAction({
      guildId: event.guildId,
      eventId,
      action: 'approve_participant',
      userId: approverId,
      username: 'Approver',
      details: { approvedUserId: userId, approvedUsername: participant.username },
    });

    approved++;
  }

  await updateEventMessage(eventId);

  logger.info({ eventId, approverId, approved }, 'Participants approved');

  return {
    success: true,
    message: `✅ Approved ${approved} participant(s)`,
    approved,
  };
}

/**
 * Reject pending participant(s)
 */
export async function rejectParticipants(
  eventId: string,
  userIds: string[],
  rejecterId: string
): Promise<ApprovalResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new ValidationError('Event not found');
  }

  if (!event.requireApproval) {
    throw new ValidationError('This event does not require approval');
  }

  let rejected = 0;

  for (const userId of userIds) {
    const participant = await prisma.participant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!participant || participant.status !== 'pending') {
      continue;
    }

    // Delete pending participant
    await prisma.participant.delete({
      where: { id: participant.id },
    });

    await logAction({
      guildId: event.guildId,
      eventId,
      action: 'reject_participant',
      userId: rejecterId,
      username: 'Rejector',
      details: { rejectedUserId: userId, rejectedUsername: participant.username },
    });

    rejected++;
  }

  await updateEventMessage(eventId);

  logger.info({ eventId, rejecterId, rejected }, 'Participants rejected');

  return {
    success: true,
    message: `❌ Rejected ${rejected} participant(s)`,
    rejected,
  };
}
