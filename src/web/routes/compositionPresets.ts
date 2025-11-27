// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/compositionPresets.ts
// Composition Preset API routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { requireGuildManager } from '../auth/middleware.js';
import { getModuleLogger } from '../../utils/logger.js';

const prisma = getPrismaClient();
const logger = getModuleLogger('composition-presets-routes');

export async function compositionPresetsRoutes(server: FastifyInstance): Promise<void> {
  // Get all presets for a guild
  server.get<{
    Querystring: { guildId: string };
  }>('/', { preHandler: requireGuildManager }, async (request, reply) => {
    const { guildId } = request.query;

    try {
      const presets = await prisma.compositionPreset.findMany({
        where: { guildId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          groups: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return presets;
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to fetch composition presets');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get single preset
  server.get<{
    Params: { id: string };
    Querystring: { guildId: string };
  }>('/:id', { preHandler: requireGuildManager }, async (request, reply) => {
    const { id } = request.params;
    const { guildId } = request.query;

    try {
      const preset = await prisma.compositionPreset.findFirst({
        where: { id, guildId },
      });

      if (!preset) {
        return reply.code(404).send({ error: 'Preset not found' });
      }

      return preset;
    } catch (error) {
      logger.error({ error, presetId: id }, 'Failed to fetch preset');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create new preset
  server.post<{
    Body: {
      guildId: string;
      name: string;
      description?: string;
      groups: any;
    };
  }>('/', { preHandler: requireGuildManager }, async (request, reply) => {
    const { guildId, name, description, groups } = request.body;
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      // Strip participantId from groups (presets should be templates)
      const cleanGroups = JSON.parse(JSON.stringify(groups)).map((group: any) => ({
        ...group,
        positions: group.positions.map((pos: any) => {
          const { participantId, ...rest } = pos;
          return rest;
        }),
      }));

      const preset = await prisma.compositionPreset.create({
        data: {
          guildId,
          name,
          description,
          groups: cleanGroups,
          createdBy: userId,
        },
      });

      logger.info({ presetId: preset.id, guildId }, 'Composition preset created');
      return preset;
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to create preset');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update preset
  server.put<{
    Params: { id: string };
    Body: {
      guildId: string;
      name?: string;
      description?: string;
      groups?: any;
    };
  }>('/:id', { preHandler: requireGuildManager }, async (request, reply) => {
    const { id } = request.params;
    const { guildId, name, description, groups } = request.body;

    try {
      const existing = await prisma.compositionPreset.findFirst({
        where: { id, guildId },
      });

      if (!existing) {
        return reply.code(404).send({ error: 'Preset not found' });
      }

      const updateData: any = { updatedAt: new Date() };
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (groups) {
        // Clean groups
        const cleanGroups = JSON.parse(JSON.stringify(groups)).map((group: any) => ({
          ...group,
          positions: group.positions.map((pos: any) => {
            const { participantId, ...rest } = pos;
            return rest;
          }),
        }));
        updateData.groups = cleanGroups;
      }

      const updated = await prisma.compositionPreset.update({
        where: { id },
        data: updateData,
      });

      logger.info({ presetId: id, guildId }, 'Preset updated');
      return updated;
    } catch (error) {
      logger.error({ error, presetId: id }, 'Failed to update preset');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete preset
  server.delete<{
    Params: { id: string };
    Querystring: { guildId: string };
  }>('/:id', { preHandler: requireGuildManager }, async (request, reply) => {
    const { id } = request.params;
    const { guildId } = request.query;

    try {
      const existing = await prisma.compositionPreset.findFirst({
        where: { id, guildId },
      });

      if (!existing) {
        return reply.code(404).send({ error: 'Preset not found' });
      }

      await prisma.compositionPreset.delete({
        where: { id },
      });

      logger.info({ presetId: id, guildId }, 'Preset deleted');
      return { success: true };
    } catch (error) {
      logger.error({ error, presetId: id }, 'Failed to delete preset');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
