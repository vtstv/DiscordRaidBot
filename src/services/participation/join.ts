// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/participation/join.ts
// Join event handler

import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { ValidationError } from '../../utils/errors.js';
import { updateEventMessage } from '../../messages/eventMessage.js';
import { logAction } from '../auditLog.js';
import { updateParticipantStats } from '../statistics.js';
import type { JoinEventParams, ParticipationResult } from './types.js';

const logger = getModuleLogger('participation:join');
const prisma = getPrismaClient();

/**
 * Add a user to an event
 */
export async function joinEvent(params: JoinEventParams): Promise<ParticipationResult> {
  const { eventId, userId, username, role, spec, userRoleIds = [] } = params;

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

  // Check if signup deadline has passed
  if (event.deadline !== null && event.deadline !== undefined) {
    const now = new Date();
    const deadlineTime = new Date(event.startTime);
    deadlineTime.setHours(deadlineTime.getHours() - event.deadline);
    
    if (now >= deadlineTime) {
      throw new ValidationError('The signup deadline for this event has passed');
    }
  }

  // Check if already signed up
  const existing = event.participants.find(p => p.userId === userId);
  if (existing) {
    return { success: false, message: 'You are already signed up for this event' };
  }

  const roleConfig = event.roleConfig as any;
  
  // Check if user has allowed role (if restrictions exist)
  const hasAllowedRole = event.allowedRoles && event.allowedRoles.length > 0
    ? userRoleIds.some(roleId => event.allowedRoles.includes(roleId))
    : true; // If no restrictions, everyone is allowed
  
  // Check if event requires approval
  let status: 'confirmed' | 'waitlist' | 'pending' = event.requireApproval ? 'pending' : 'confirmed';
  let position: number | null = null;

  // If user doesn't have allowed role, force to waitlist or deny
  if (!hasAllowedRole && event.allowedRoles && event.allowedRoles.length > 0) {
    if (!event.benchOverflow) {
      // Deny signup completely
      return { 
        success: false, 
        message: 'You do not have the required role(s) to sign up for this event' 
      };
    }
    // Force to waitlist
    status = 'waitlist';
    const waitlistCount = event.participants.filter(p => p.status === 'waitlist').length;
    position = waitlistCount + 1;
  }

  // Only check limits if not requiring approval AND user has allowed role
  if (!event.requireApproval && hasAllowedRole && status !== 'waitlist') {
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

  // Update statistics: increment joined count
  if (status === 'confirmed' || status === 'waitlist') {
    await updateParticipantStats({
      userId,
      guildId: event.guildId,
      incrementJoined: true,
    });
  }

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
