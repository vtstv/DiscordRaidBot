// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/participation.ts
// Event participation logic

import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import { updateEventMessage } from '../messages/eventMessage.js';
import { logAction } from './auditLog.js';

const logger = getModuleLogger('participation');
const prisma = getPrismaClient();

interface JoinEventParams {
  eventId: string;
  userId: string;
  username: string;
  role?: string;
  spec?: string;
}

/**
 * Add a user to an event
 */
export async function joinEvent(params: JoinEventParams): Promise<{ success: boolean; message: string; waitlisted?: boolean }> {
  const { eventId, userId, username, role, spec } = params;

  // Get event with participants
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

  if (event.status !== 'scheduled' && event.status !== 'active') {
    throw new ValidationError('This event is not accepting signups');
  }

  // Check if already signed up
  const existing = event.participants.find(p => p.userId === userId);
  if (existing) {
    return { success: false, message: 'You are already signed up for this event' };
  }

  const roleConfig = event.roleConfig as any;
  
  // Check if event requires approval
  let status: 'confirmed' | 'waitlist' | 'pending' = event.requireApproval ? 'pending' : 'confirmed';
  let position: number | null = null;

  // Only check limits if not requiring approval (approval will be checked later)
  if (!event.requireApproval) {
    // Check if event is full
    const confirmedCount = event.participants.filter(p => p.status === 'confirmed').length;
    
    if (event.maxParticipants && confirmedCount >= event.maxParticipants) {
      status = 'waitlist';
      const waitlistCount = event.participants.filter(p => p.status === 'waitlist').length;
      position = waitlistCount + 1;
    }

    // Check role-specific limits
    if (roleConfig && role && status === 'confirmed') {
      const roleLimit = roleConfig.limits?.[role];
      if (roleLimit) {
        const roleCount = event.participants.filter(
          p => p.role === role && p.status === 'confirmed'
        ).length;

        if (roleCount >= roleLimit) {
          status = 'waitlist';
          const waitlistCount = event.participants.filter(p => p.status === 'waitlist').length;
          position = waitlistCount + 1;
        }
      }
    }
  }

  // Create participant
  await prisma.participant.create({
    data: {
      eventId,
      userId,
      username,
      role,
      spec,
      status,
      position,
    },
  });

  logger.info({ 
    eventId, 
    userId, 
    username, 
    role, 
    status, 
    requireApproval: event.requireApproval,
  }, 'Participant created');

  // Update event message
  await updateEventMessage(eventId);

  // Log action
  await logAction({
    guildId: event.guildId,
    eventId,
    action: 'signup',
    userId,
    username,
    details: { role, spec, status },
  });

  logger.info({ eventId, userId, username, role, status }, 'User joined event');

  if (status === 'pending') {
    return {
      success: true,
      message: '⏳ Your signup is pending approval from the event creator',
      waitlisted: false,
    };
  }

  if (status === 'waitlist') {
    return {
      success: true,
      message: `You have been added to the waitlist (position ${position})`,
      waitlisted: true,
    };
  }

  return { success: true, message: 'Successfully joined the event!' };
}

/**
 * Remove a user from an event
 */
export async function leaveEvent(eventId: string, userId: string, username: string): Promise<{ success: boolean; message: string }> {
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

/**
 * Update participant's role/spec
 */
export async function updateParticipantRole(
  eventId: string,
  userId: string,
  username: string,
  role: string,
  spec?: string
): Promise<{ success: boolean; message: string }> {
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

/**
 * Approve pending participant(s)
 */
export async function approveParticipants(
  eventId: string,
  userIds: string[],
  approverId: string
): Promise<{ success: boolean; message: string; approved: number }> {
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
): Promise<{ success: boolean; message: string; rejected: number }> {
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

/**
 * Promote first person from waitlist for a specific role
 */
async function promoteFromWaitlist(eventId: string, role: string | null): Promise<void> {
  const waitlist = await prisma.participant.findMany({
    where: {
      eventId,
      status: 'waitlist',
      ...(role ? { role } : {}),
    },
    orderBy: { position: 'asc' },
    take: 1,
  });

  if (waitlist.length > 0) {
    const promoted = waitlist[0];
    
    await prisma.participant.update({
      where: { id: promoted.id },
      data: {
        status: 'confirmed',
        position: null,
      },
    });

    // Reindex waitlist positions
    await reindexWaitlist(eventId);

    logger.info({ eventId, userId: promoted.userId, role }, 'Promoted from waitlist');
  }
}

/**
 * Reindex waitlist positions after changes
 */
async function reindexWaitlist(eventId: string): Promise<void> {
  const waitlist = await prisma.participant.findMany({
    where: { eventId, status: 'waitlist' },
    orderBy: { joinedAt: 'asc' },
  });

  for (let i = 0; i < waitlist.length; i++) {
    await prisma.participant.update({
      where: { id: waitlist[i].id },
      data: { position: i + 1 },
    });
  }
}
