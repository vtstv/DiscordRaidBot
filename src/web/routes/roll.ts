// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/roll.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';

const logger = getModuleLogger('web:roll');

export async function rollRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /roll/:id - Public roll generator page
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      const rollGenerator = await getPrismaClient().rollGenerator.findUnique({
        where: { id },
        include: {
          rolls: {
            orderBy: { rollValue: 'desc' },
          },
        },
      });

      if (!rollGenerator) {
        return reply.status(404).send({ error: 'Roll generator not found' });
      }

      // Calculate unique highest rolls per user
      const uniqueRolls = new Map<string, typeof rollGenerator.rolls[0]>();
      rollGenerator.rolls.forEach(roll => {
        const existing = uniqueRolls.get(roll.userId);
        if (!existing || roll.rollValue > existing.rollValue) {
          uniqueRolls.set(roll.userId, roll);
        }
      });

      const sortedRolls = Array.from(uniqueRolls.values())
        .sort((a, b) => b.rollValue - a.rollValue)
        .slice(0, rollGenerator.maxShown);

      const uniqueUsers = uniqueRolls.size;
      const totalRolls = rollGenerator.rolls.length;

      // Calculate time remaining
      let timeRemaining: string | null = null;
      if (rollGenerator.endTime) {
        const now = new Date();
        const end = new Date(rollGenerator.endTime);
        const diff = end.getTime() - now.getTime();

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          timeRemaining = `${hours}h ${minutes}m`;
        }
      }

      const data = {
        id: rollGenerator.id,
        title: rollGenerator.title,
        description: rollGenerator.description,
        status: rollGenerator.status,
        maxRoll: rollGenerator.maxRoll,
        showUsernames: rollGenerator.showUsernames,
        maxShown: rollGenerator.maxShown,
        maxUsers: rollGenerator.maxUsers,
        uniqueUsers,
        totalRolls,
        timeRemaining,
        startTime: rollGenerator.startTime,
        endTime: rollGenerator.endTime,
        rolls: sortedRolls.map(roll => ({
          userId: roll.userId,
          username: rollGenerator.showUsernames ? roll.username : 'Hidden',
          rollValue: roll.rollValue,
          rolledAt: roll.rolledAt,
        })),
      };

      return reply.send(data);
    } catch (error) {
      logger.error({ error, id }, 'Error loading roll generator page');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // API endpoint for real-time updates
  fastify.get('/api/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      const rollGenerator = await getPrismaClient().rollGenerator.findUnique({
        where: { id },
        include: {
          rolls: {
            orderBy: { rollValue: 'desc' },
          },
        },
      });

      if (!rollGenerator) {
        return reply.status(404).send({ error: 'Roll generator not found' });
      }

      // Calculate unique highest rolls per user
      const uniqueRolls = new Map<string, typeof rollGenerator.rolls[0]>();
      rollGenerator.rolls.forEach(roll => {
        const existing = uniqueRolls.get(roll.userId);
        if (!existing || roll.rollValue > existing.rollValue) {
          uniqueRolls.set(roll.userId, roll);
        }
      });

      const sortedRolls = Array.from(uniqueRolls.values())
        .sort((a, b) => b.rollValue - a.rollValue)
        .slice(0, rollGenerator.maxShown);

      return reply.send({
        status: rollGenerator.status,
        uniqueUsers: uniqueRolls.size,
        totalRolls: rollGenerator.rolls.length,
        rolls: sortedRolls.map(roll => ({
          userId: roll.userId,
          username: rollGenerator.showUsernames ? roll.username : 'Hidden',
          rollValue: roll.rollValue,
          rolledAt: roll.rolledAt,
        })),
      });
    } catch (error) {
      logger.error({ error, id }, 'Error fetching roll generator data');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
