// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth.ts
// OAuth authentication routes - main registration

import { FastifyInstance } from 'fastify';
import { loginHandler } from './auth/login.js';
import { callbackHandler } from './auth/callback.js';
import { logoutGetHandler, logoutPostHandler } from './auth/logout.js';
import { meHandler } from './auth/me.js';
import { guildsHandler } from './auth/guilds.js';
import { refreshPermissionsHandler } from './auth/refresh-permissions.js';
import '../types/session.js'; // Import session type declarations

/**
 * Register all authentication routes
 */
export async function registerAuthRoutes(fastify: FastifyInstance): Promise<void> {
  // Login
  fastify.get('/auth/login', loginHandler);

  // OAuth callback
  fastify.get('/auth/callback', callbackHandler);

  // Logout
  fastify.get('/auth/logout', logoutGetHandler);
  fastify.post('/auth/logout', logoutPostHandler);

  // Current user info
  fastify.get('/auth/me', meHandler);

  // User's admin guilds
  fastify.get('/auth/guilds', guildsHandler);

  // Refresh permissions
  fastify.post('/auth/refresh-permissions', refreshPermissionsHandler);
}
