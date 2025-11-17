// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/index.ts
// Route registration for web API

import { FastifyInstance } from 'fastify';
import { eventsRoutes } from './events.js';
import { templatesRoutes } from './templates.js';
import { registerAuthRoutes } from './auth.js';

export async function registerRoutes(server: FastifyInstance): Promise<void> {
  // Auth routes (no prefix)
  await registerAuthRoutes(server);

  // API prefix
  server.register(async (api) => {
    await api.register(eventsRoutes, { prefix: '/events' });
    await api.register(templatesRoutes, { prefix: '/templates' });
  }, { prefix: '/api' });
}
