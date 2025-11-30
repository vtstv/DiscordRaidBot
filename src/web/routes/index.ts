// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/index.ts
// Route registration for web API

import { FastifyInstance } from 'fastify';
import { eventsRoutes } from './events.js';
import { templatesRoutes } from './templates.js';
import { registerAuthRoutes } from './auth.js';
import { adminRoutes } from './admin.js';
import { guildsRoutes } from './guilds.js';
import { statsRoutes } from './stats.js';
import { raidPlansRoutes } from './raidplans.js';
import { compositionPresetsRoutes } from './compositionPresets.js';
import { rollRoutes } from './roll.js';

export async function registerRoutes(server: FastifyInstance): Promise<void> {
  // Auth routes (no prefix)
  await registerAuthRoutes(server);

  // Event view route (direct, not under /api)
  server.register(async (routes) => {
    await routes.register(eventsRoutes, { prefix: '/events' });
  });

  // API prefix
  server.register(async (api) => {
    await api.register(guildsRoutes, { prefix: '/guilds' });
    await api.register(eventsRoutes, { prefix: '/events' });
    await api.register(templatesRoutes, { prefix: '/templates' });
    await api.register(statsRoutes, { prefix: '/stats' });
    await api.register(adminRoutes, { prefix: '/admin' });
    await api.register(raidPlansRoutes, { prefix: '/raidplans' });
    await api.register(compositionPresetsRoutes, { prefix: '/composition-presets' });
    await api.register(rollRoutes, { prefix: '/roll' });
  }, { prefix: '/api' });
}
