// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/stats.ts
// Statistics API routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { getLeaderboard, getUserStats } from '../../services/statistics.js';
import { bulkGetDiscordUserInfo } from '../../utils/discord-enrichment.js';
import { requireGuildAccess } from '../auth/permissions.js';

const prisma = getPrismaClient();

export async function statsRoutes(server: FastifyInstance): Promise<void> {
  // Get leaderboard for a guild
  server.get<{
    Querystring: { guildId: string; limit?: string };
  }>('/leaderboard', {
    preHandler: requireGuildAccess()
  }, async (request, reply) => {
    const { guildId, limit } = request.query;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    const topN = limit ? parseInt(limit, 10) : 10;
    const leaderboard = await getLeaderboard(guildId, topN);

    // Enrich with Discord user data
    const userIds = leaderboard.map(stat => stat.userId);
    const discordUsers = await bulkGetDiscordUserInfo(userIds);

    const enriched = leaderboard.map(stat => ({
      ...stat,
      discordUser: discordUsers.get(stat.userId),
    }));

    return enriched;
  });

  // Get personal stats for a user
  server.get<{
    Querystring: { guildId: string; userId: string };
  }>('/user', {
    preHandler: requireGuildAccess()
  }, async (request, reply) => {
    const { guildId, userId } = request.query;

    if (!guildId || !userId) {
      return reply.code(400).send({ error: 'guildId and userId are required' });
    }

    const stats = await getUserStats(userId, guildId);

    if (!stats) {
      return reply.code(404).send({ error: 'Statistics not found' });
    }

    return stats;
  });

  // Get guild stats settings
  server.get<{
    Querystring: { guildId: string };
  }>('/settings', {
    preHandler: requireGuildAccess()
  }, async (request, reply) => {
    const { guildId } = request.query;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: {
        statsEnabled: true,
        statsChannelId: true,
        statsUpdateInterval: true,
        statsAutoRoleEnabled: true,
        statsTop10RoleId: true,
        statsMinEvents: true,
      },
    });

    if (!guild) {
      return reply.code(404).send({ error: 'Guild not found' });
    }

    return guild;
  });

  // Get overall statistics for a guild
  server.get<{
    Querystring: { guildId: string };
  }>('/overview', {
    preHandler: requireGuildAccess()
  }, async (request, reply) => {
    const { guildId } = request.query;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    const [totalParticipants, totalEvents, completedEvents] = await Promise.all([
      prisma.participantStatistics.count({
        where: { guildId },
      }),
      prisma.event.count({
        where: { guildId },
      }),
      prisma.event.count({
        where: { guildId, status: 'completed' },
      }),
    ]);

    const topStats = await prisma.participantStatistics.findMany({
      where: { guildId },
      orderBy: { score: 'desc' },
      take: 3,
    });

    return {
      totalParticipants,
      totalEvents,
      completedEvents,
      topParticipants: topStats.length,
    };
  });
}
