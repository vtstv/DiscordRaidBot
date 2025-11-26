// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/statistics.ts
// Participant statistics tracking and leaderboard management

import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';

const logger = getModuleLogger('statistics');
const prisma = getPrismaClient();

const SCORE_WEIGHTS = {
  joined: 0,  // No points for joining
  completed: 3,
  noShow: -2,
};

interface StatsUpdate {
  userId: string;
  guildId: string;
  incrementJoined?: boolean;
  incrementCompleted?: boolean;
  incrementNoShow?: boolean;
}

/**
 * Calculate score based on statistics
 */
function calculateScore(joined: number, completed: number, noShows: number): number {
  return (
    joined * SCORE_WEIGHTS.joined +
    completed * SCORE_WEIGHTS.completed +
    noShows * SCORE_WEIGHTS.noShow
  );
}

/**
 * Update participant statistics
 */
export async function updateParticipantStats(update: StatsUpdate): Promise<void> {
  const { userId, guildId, incrementJoined, incrementCompleted, incrementNoShow } = update;

  try {
    const existing = await prisma.participantStatistics.findUnique({
      where: {
        userId_guildId: { userId, guildId },
      },
    });

    const newJoined = (existing?.totalEventsJoined || 0) + (incrementJoined ? 1 : 0);
    const newCompleted = (existing?.totalEventsCompleted || 0) + (incrementCompleted ? 1 : 0);
    const newNoShows = (existing?.totalNoShows || 0) + (incrementNoShow ? 1 : 0);
    const newScore = calculateScore(newJoined, newCompleted, newNoShows);

    await prisma.participantStatistics.upsert({
      where: {
        userId_guildId: { userId, guildId },
      },
      create: {
        userId,
        guildId,
        totalEventsJoined: incrementJoined ? 1 : 0,
        totalEventsCompleted: incrementCompleted ? 1 : 0,
        totalNoShows: incrementNoShow ? 1 : 0,
        score: newScore,
        lastActivityAt: new Date(),
      },
      update: {
        totalEventsJoined: newJoined,
        totalEventsCompleted: newCompleted,
        totalNoShows: newNoShows,
        score: newScore,
        lastActivityAt: new Date(),
      },
    });

    logger.debug({ userId, guildId, score: newScore }, 'Updated participant statistics');
  } catch (error) {
    logger.error({ error, userId, guildId }, 'Failed to update participant statistics');
    throw error;
  }
}

/**
 * Recalculate ranks for all participants in a guild
 */
export async function recalculateRanks(guildId: string): Promise<void> {
  try {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { statsMinEvents: true },
    });

    if (!guild) {
      throw new Error(`Guild ${guildId} not found`);
    }

    const allStats = await prisma.participantStatistics.findMany({
      where: { guildId },
      orderBy: { score: 'desc' },
    });

    const updates = allStats.map((stat, index) => {
      const meetsMinimum = stat.totalEventsCompleted >= guild.statsMinEvents;
      const rank = meetsMinimum ? index + 1 : null;

      return prisma.participantStatistics.update({
        where: { id: stat.id },
        data: { rank },
      });
    });

    await prisma.$transaction(updates);

    logger.info({ guildId, count: allStats.length }, 'Recalculated participant ranks');
  } catch (error) {
    logger.error({ error, guildId }, 'Failed to recalculate ranks');
    throw error;
  }
}

/**
 * Get leaderboard for a guild
 */
export async function getLeaderboard(
  guildId: string,
  limit: number = 10
): Promise<Array<{
  userId: string;
  totalEventsJoined: number;
  totalEventsCompleted: number;
  totalNoShows: number;
  score: number;
  rank: number | null;
}>> {
  try {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { statsMinEvents: true },
    });

    if (!guild) {
      throw new Error(`Guild ${guildId} not found`);
    }

    const leaderboard = await prisma.participantStatistics.findMany({
      where: {
        guildId,
        totalEventsCompleted: { gte: guild.statsMinEvents },
      },
      orderBy: { score: 'desc' },
      take: limit,
      select: {
        userId: true,
        totalEventsJoined: true,
        totalEventsCompleted: true,
        totalNoShows: true,
        score: true,
        rank: true,
      },
    });

    return leaderboard;
  } catch (error) {
    logger.error({ error, guildId }, 'Failed to get leaderboard');
    throw error;
  }
}

/**
 * Get statistics for a specific user in a guild
 */
export async function getUserStats(userId: string, guildId: string) {
  try {
    const stats = await prisma.participantStatistics.findUnique({
      where: {
        userId_guildId: { userId, guildId },
      },
    });

    return stats;
  } catch (error) {
    logger.error({ error, userId, guildId }, 'Failed to get user statistics');
    throw error;
  }
}

/**
 * Mark participant as no-show and update stats
 */
export async function markNoShow(eventId: string, userId: string): Promise<void> {
  try {
    const participant = await prisma.participant.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
      include: {
        event: true,
      },
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    if (participant.noShow) {
      throw new Error('Participant already marked as no-show');
    }

    await prisma.participant.update({
      where: { id: participant.id },
      data: { noShow: true },
    });

    await updateParticipantStats({
      userId,
      guildId: participant.event.guildId,
      incrementNoShow: true,
    });

    await recalculateRanks(participant.event.guildId);

    logger.info({ eventId, userId }, 'Marked participant as no-show');
  } catch (error) {
    logger.error({ error, eventId, userId }, 'Failed to mark no-show');
    throw error;
  }
}

/**
 * Process event completion - update stats for all confirmed participants
 */
export async function processEventCompletion(eventId: string): Promise<void> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          where: {
            status: 'confirmed',
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const updates = event.participants.map((participant) =>
      updateParticipantStats({
        userId: participant.userId,
        guildId: event.guildId,
        incrementCompleted: !participant.noShow,
      })
    );

    await Promise.all(updates);
    await recalculateRanks(event.guildId);

    logger.info(
      { eventId, participantCount: event.participants.length },
      'Processed event completion statistics'
    );
  } catch (error) {
    logger.error({ error, eventId }, 'Failed to process event completion');
    throw error;
  }
}

/**
 * Get top N users who should receive auto-role
 */
export async function getTopParticipants(guildId: string, limit: number = 10) {
  try {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { statsMinEvents: true },
    });

    if (!guild) {
      throw new Error(`Guild ${guildId} not found`);
    }

    const topUsers = await prisma.participantStatistics.findMany({
      where: {
        guildId,
        totalEventsCompleted: { gte: guild.statsMinEvents },
      },
      orderBy: { score: 'desc' },
      take: limit,
      select: {
        userId: true,
        score: true,
        rank: true,
      },
    });

    return topUsers;
  } catch (error) {
    logger.error({ error, guildId }, 'Failed to get top participants');
    throw error;
  }
}
