// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Admin panel routes - modular version

import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { statsRoutes } from './stats.js';
import { guildRoutes } from './guilds.js';
import { eventRoutes } from './events.js';
import { templateRoutes } from './templates.js';
import { logRoutes } from './logs.js';
import { systemRoutes } from './system.js';

export async function adminRoutes(server: FastifyInstance): Promise<void> {
  // Register all route modules
  await authRoutes(server);
  await statsRoutes(server);
  await guildRoutes(server);
  await eventRoutes(server);
  await templateRoutes(server);
  await logRoutes(server);
  await systemRoutes(server);
}
