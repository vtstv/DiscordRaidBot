// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Authentication routes for admin panel

import { FastifyInstance } from 'fastify';
import { getModuleLogger } from '../../../utils/logger.js';
import { config } from '../../../config/env.js';
import { isAdmin } from './middleware.js';

const logger = getModuleLogger('admin-auth');

export async function authRoutes(server: FastifyInstance): Promise<void> {
  // Get config
  server.get('/config', async () => {
    return {
      apiBaseUrl: config.ADMIN_BASE_URL,
      oauthEnabled: !!config.DISCORD_CLIENT_SECRET,
      passwordAuthEnabled: !!(config.ADMIN_USERNAME && config.ADMIN_PASSWORD)
    };
  });

  // Password authentication
  server.post<{
    Body: { username: string; password: string };
  }>('/auth/password', async (request, reply) => {
    const { username, password } = request.body;

    if (!config.ADMIN_USERNAME || !config.ADMIN_PASSWORD) {
      return reply.code(401).send({ error: 'Password authentication disabled' });
    }

    if (username === config.ADMIN_USERNAME && password === config.ADMIN_PASSWORD) {
      // Create session data
      const sessionData = {
        user: {
          id: 'admin',
          username: 'Administrator',
          avatar: null
        }
      };

      // Set session using direct assignment
      (request as any).session.user = sessionData.user;

      logger.info({ username }, 'Admin logged in with password');

      return { 
        success: true,
        user: sessionData.user
      };
    }

    return reply.code(401).send({ error: 'Invalid credentials' });
  });

  // Get admin status
  server.get('/status', async (request) => {
    const user = (request as any).session?.user;
    
    if (!user) {
      return { isAdmin: false, authenticated: false };
    }
    
    // Check if user is admin (either password login or Discord OAuth with whitelisted ID)
    const isAdminUser = user.id === 'admin' || isAdmin(user.id);
    
    return { 
      isAdmin: isAdminUser,
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar
      }
    };
  });
}
