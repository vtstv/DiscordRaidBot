// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/templates.ts
// Templates API routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { TemplateConfigSchema } from '../../commands/template.js';
import { requireGuildManager } from '../auth/middleware.js';
import { requireModulePermission } from '../auth/permissions.js';

const prisma = getPrismaClient();

export async function templatesRoutes(server: FastifyInstance): Promise<void> {
  // List templates for a guild
  server.get<{
    Querystring: { guildId: string };
  }>('/', async (request, reply) => {
    const { guildId } = request.query;

    if (!guildId) {
      return reply.code(400).send({ error: 'guildId is required' });
    }

    // Check permission
    (request as any).params = { guildId };
    await requireModulePermission('templates')(request, reply);
    if (reply.sent) return;

    const templates = await prisma.template.findMany({
      where: { guildId },
      orderBy: { name: 'asc' },
    });

    return templates;
  });

  // Get template details
  server.get<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;

    const template = await prisma.template.findUnique({
      where: { id },
      select: { id: true, guildId: true, name: true, description: true, config: true, createdAt: true, updatedAt: true },
    });

    if (!template) {
      return reply.code(404).send({ error: 'Template not found' });
    }

    // Check permission
    (request as any).params = { guildId: template.guildId };
    await requireModulePermission('templates')(request, reply);
    if (reply.sent) return;

    return template;
  });

  // Create template
  server.post<{
    Body: {
      guildId: string;
      guildName: string;
      name: string;
      description?: string;
      config: any;
    };
  }>(
    '/',
    async (request, reply) => {
      const { guildId, guildName, ...templateData } = request.body;

      // Check permission
      (request as any).params = { guildId };
      await requireModulePermission('templates')(request, reply);
      if (reply.sent) return;

    // Normalize config - ensure emojiMap doesn't have invalid values
    const config = { ...templateData.config };
    
    // Provide defaults for required fields
    if (!config.roles || !Array.isArray(config.roles)) {
      config.roles = [];
    }
    if (!config.limits) {
      config.limits = {};
    }
    
    // Remove invalid emoji entries (undefined, null, empty strings)
    if (config.emojiMap) {
      const cleanEmojiMap: Record<string, string> = {};
      for (const [role, emoji] of Object.entries(config.emojiMap)) {
        if (emoji && typeof emoji === 'string' && emoji.trim()) {
          cleanEmojiMap[role] = emoji.trim();
        }
      }
      // Only keep emojiMap if it has valid entries
      if (Object.keys(cleanEmojiMap).length > 0) {
        config.emojiMap = cleanEmojiMap;
      } else {
        delete config.emojiMap;
      }
    }
    
    // Validate config with schema
    const validationResult = TemplateConfigSchema.safeParse(config);
    if (!validationResult.success) {
      return reply.code(400).send({ 
        error: 'Invalid template configuration', 
        details: validationResult.error.message 
      });
    }

    // Ensure guild exists
    await prisma.guild.upsert({
      where: { id: guildId },
      create: { id: guildId, name: guildName || 'Unknown' },
      update: { name: guildName || 'Unknown' },
    });

    // Check template limit for this guild
    const systemSettings = await prisma.systemSettings.findUnique({
      where: { id: 'system' },
    });
    
    if (systemSettings) {
      const templateCount = await prisma.template.count({
        where: { guildId },
      });

      if (templateCount >= systemSettings.maxTemplatesPerGuild) {
        return reply.code(403).send({ 
          error: `This server has reached the maximum limit of ${systemSettings.maxTemplatesPerGuild} templates. Please delete some templates before creating new ones.` 
        });
      }
    }

    try {
      const template = await prisma.template.create({
        data: {
          guildId,
          name: templateData.name,
          description: templateData.description,
          config: validationResult.data,
        },
      });

      return reply.code(201).send(template);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'A template with this name already exists' });
      }
      throw error;
    }
  });

  // Update template
  server.put<{
    Params: { id: string };
    Body: {
      name?: string;
      description?: string;
      config?: any;
    };
  }>(
    '/:id',
    {
      preHandler: async (request, reply) => {
        const { id } = request.params as { id: string };
        
        // Fetch template to get guildId
        const template = await prisma.template.findUnique({
          where: { id },
          select: { guildId: true },
        });

        if (!template) {
          return reply.code(404).send({ error: 'Template not found' });
        }

        // Check permission
        (request as any).params = { ...request.params, guildId: template.guildId };
        await requireModulePermission('templates')(request, reply);
      },
    },
    async (request, reply) => {
      const { id } = request.params;
    const updateData: any = {};

    if (request.body.name !== undefined) updateData.name = request.body.name;
    if (request.body.description !== undefined) updateData.description = request.body.description;
    
    if (request.body.config !== undefined) {
      // Validate config with schema
      const validationResult = TemplateConfigSchema.safeParse(request.body.config);
      if (!validationResult.success) {
        return reply.code(400).send({ 
          error: 'Invalid template configuration', 
          details: validationResult.error.message 
        });
      }
      updateData.config = validationResult.data;
    }

    try {
      const template = await prisma.template.update({
        where: { id },
        data: updateData,
      });

      return template;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Template not found' });
      }
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'A template with this name already exists' });
      }
      throw error;
    }
  });

  // Delete template
  server.delete<{
    Params: { id: string };
  }>(
    '/:id',
    {
      preHandler: async (request, reply) => {
        const { id } = request.params as { id: string };
        
        // Fetch template to get guildId
        const template = await prisma.template.findUnique({
          where: { id },
          select: { guildId: true },
        });

        if (!template) {
          return reply.code(404).send({ error: 'Template not found' });
        }

        // Check permission
        (request as any).params = { ...request.params, guildId: template.guildId };
        await requireModulePermission('templates')(request, reply);
      },
    },
    async (request, reply) => {
      const { id } = request.params;

    try {
      await prisma.template.delete({
        where: { id },
      });

      return reply.code(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Template not found' });
      }
      throw error;
    }
  });
}
