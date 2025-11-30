// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Admin panel routes - modular version

import { FastifyInstance } from 'fastify';
import { authRoutes } from './admin/auth.js';
import { statsRoutes } from './admin/stats.js';
import { guildRoutes } from './admin/guilds.js';
import { eventRoutes } from './admin/events.js';
import { templateRoutes } from './admin/templates.js';
import { logRoutes } from './admin/logs.js';
import { systemRoutes } from './admin/system.js';
import { databaseRoutes } from './admin/database.js';

export async function adminRoutes(server: FastifyInstance): Promise<void> {
  // Register all route modules
  await authRoutes(server);
  await statsRoutes(server);
  await guildRoutes(server);
  await eventRoutes(server);
  await templateRoutes(server);
  await logRoutes(server);
  await systemRoutes(server);
  
  // Database backup/restore routes
  await server.register(databaseRoutes, { prefix: '/database' });
}
