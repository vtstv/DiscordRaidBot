// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/templates.ts
// Templates API routes

import { FastifyInstance } from 'fastify';
import getPrismaClient from '../../database/db.js';
import { TemplateConfigSchema } from '../../commands/template.js';
import { requireGuildManager } from '../auth/middleware.js';

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
    });

    if (!template) {
      return reply.code(404).send({ error: 'Template not found' });
    }

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
    { preHandler: requireGuildManager },
    async (request, reply) => {
      const { guildId, guildName, ...templateData } = request.body;

    // Validate config with schema
    const validationResult = TemplateConfigSchema.safeParse(templateData.config);
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

        // Add guildId to request for middleware
        (request as any).body = { ...(request.body || {}), guildId: template.guildId };

        // Run auth check
        await requireGuildManager(request, reply);
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

        // Add guildId to request for middleware
        (request as any).body = { guildId: template.guildId };

        // Run auth check
        await requireGuildManager(request, reply);
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
