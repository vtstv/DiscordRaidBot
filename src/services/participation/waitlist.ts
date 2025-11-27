// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/participation/waitlist.ts
// Waitlist management utilities

import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';

const logger = getModuleLogger('participation:waitlist');
const prisma = getPrismaClient();

/**
 * Promote first person from waitlist for a specific role
 */
export async function promoteFromWaitlist(eventId: string, role: string | null): Promise<void> {
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
export async function reindexWaitlist(eventId: string): Promise<void> {
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
