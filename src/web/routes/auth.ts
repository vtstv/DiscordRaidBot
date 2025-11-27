// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth.ts
// OAuth authentication routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import {
  getAuthorizationUrl,
  exchangeCode,
  getDiscordUser,
  getUserGuilds,
  getGuildMember,
  hasAdminPermissions,
} from '../auth/discord-oauth.js';
import { config } from '../../config/env.js';
import { getModuleLogger } from '../../utils/logger.js';
import getPrismaClient from '../../database/db.js';

const logger = getModuleLogger('auth-routes');
const prisma = getPrismaClient();

// Admin user IDs from environment
const ADMIN_IDS = (config.ADMIN_USER_IDS || '').split(',').filter(id => id.trim());

// Temporary in-memory store for OAuth states (in production, use Redis)
const stateStore = new Map<string, { created: number; returnTo?: string }>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.created > 10 * 60 * 1000) { // 10 minutes
      stateStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

export async function registerAuthRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /auth/login
   * Redirect to Discord OAuth
   */
  fastify.get('/auth/login', async (request: FastifyRequest<{
    Querystring: { returnTo?: string };
  }>, reply: FastifyReply) => {
    const state = crypto.randomBytes(16).toString('hex');
    const returnTo = request.query.returnTo || '/';
    stateStore.set(state, { created: Date.now(), returnTo });

    const authUrl = getAuthorizationUrl(config.DISCORD_OAUTH_REDIRECT_URI, state);
    
    logger.info({ state, returnTo }, 'Redirecting to Discord OAuth');
    reply.redirect(authUrl);
  });

  /**
   * GET /auth/callback
   * Handle OAuth callback
   */
  fastify.get<{
    Querystring: { code?: string; state?: string; error?: string };
  }>('/auth/callback', async (request, reply) => {
    const { code, state, error } = request.query;

    if (error) {
      logger.error({ error }, 'OAuth error');
      return reply.code(400).send({
        error: 'OAuth Error',
        message: error,
      });
    }

    if (!code || !state) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Missing code or state parameter',
      });
    }

    // Verify state
    if (!stateStore.has(state)) {
      logger.warn({ state }, 'Invalid OAuth state');
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid state parameter',
      });
    }

    // Get state data BEFORE deleting
    const stateData = stateStore.get(state)!;
    stateStore.delete(state);

    try {
      // Exchange code for tokens
      const tokenData = await exchangeCode(code, config.DISCORD_OAUTH_REDIRECT_URI);
      
      // Get user info
      const user = await getDiscordUser(tokenData.access_token);

      // Get user's guilds to check permissions
      const guilds = await getUserGuilds(tokenData.access_token);
      
      // Find guilds where user has admin permissions
      let adminGuilds = guilds.filter(guild => 
        guild.owner || hasAdminPermissions(guild.permissions)
      );

      // Also check guilds with dashboardRoles configured
      const dbGuildsWithDashboardRoles = await prisma.guild.findMany({
        where: {
          dashboardRoles: {
            isEmpty: false
          }
        },
        select: {
          id: true,
          name: true,
          dashboardRoles: true
        }
      });

      // For each guild with dashboardRoles, check if user has any of those roles
      for (const dbGuild of dbGuildsWithDashboardRoles) {
        // Skip if already in adminGuilds
        if (adminGuilds.some(g => g.id === dbGuild.id)) {
          continue;
        }

        // Get user's member info in this guild
        const memberInfo = await getGuildMember(dbGuild.id, user.id);
        
        if (memberInfo) {
          // Check if user has any role in dashboardRoles
          const hasRequiredRole = memberInfo.roles.some(roleId => 
            dbGuild.dashboardRoles.includes(roleId)
          );

          if (hasRequiredRole) {
            // Find the guild in user's guilds list
            const guildInfo = guilds.find(g => g.id === dbGuild.id);
            if (guildInfo) {
              adminGuilds.push(guildInfo);
            } else {
              // User is in the guild but it didn't come from Discord API
              // This shouldn't happen, but add it anyway with minimal info
              adminGuilds.push({
                id: dbGuild.id,
                name: dbGuild.name,
                icon: null,
                owner: false,
                permissions: '0'
              });
            }
          }
        }
      }

      // Store user in session using direct assignment
      (request as any).session.user = {
        id: user.id,
        username: user.username,
        avatar: getAvatarUrl(user.id, user.avatar),
      };

      function getAvatarUrl(userId: string, avatarHash: string | null): string | null {
        if (!avatarHash) return null;
        const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
        return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=128`;
      }

      // Also store tokens for API calls
      (request as any).session.accessToken = tokenData.access_token;
      (request as any).session.refreshToken = tokenData.refresh_token;
      (request as any).session.expiresAt = Date.now() + tokenData.expires_in * 1000;

      // Store admin guilds
      (request as any).session.adminGuilds = adminGuilds.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        owner: g.owner,
      }));

      logger.info({ 
        userId: user.id, 
        username: user.username,
        adminGuildsCount: adminGuilds.length 
      }, 'User logged in via Discord');

      // Get the stored returnTo or default redirect
      const returnTo = stateData.returnTo || '/';
      
      // Check if user is bot admin
      const isBotAdmin = ADMIN_IDS.includes(user.id);
      
      logger.info({ 
        userId: user.id,
        username: user.username,
        adminIds: ADMIN_IDS,
        isBotAdmin,
        adminGuildsCount: adminGuilds.length
      }, 'OAuth: Checking user permissions');
      
      // Determine redirect:
      // 1. Bot admins go to /select-panel (choose between bot admin and guild admin)
      // 2. Guild admins go to /servers (server selection)
      // 3. Regular users go to returnTo
      let redirectUrl = returnTo;
      if (isBotAdmin) {
        redirectUrl = '/select-panel';
      } else if (adminGuilds.length > 0) {
        redirectUrl = '/servers';
      }
      
      logger.info({ 
        userId: user.id, 
        isBotAdmin, 
        hasGuildAdmin: adminGuilds.length > 0,
        redirectUrl 
      }, 'Redirecting after OAuth');
      
      reply.redirect(redirectUrl);
    } catch (error) {
      logger.error({ error }, 'Failed to complete OAuth flow');
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to complete authentication',
      });
    }
  });

  /**
   * GET /auth/logout
   * Clear session and redirect
   */
  fastify.get('/auth/logout', async (request, reply) => {
    return new Promise<void>((resolve) => {
      request.session.destroy((err) => {
        if (err) {
          logger.error({ err }, 'Error destroying session');
        }
        logger.info('User logged out');
        reply.redirect('/');
        resolve();
      });
    });
  });

  /**
   * POST /auth/logout
   * Clear session (API endpoint)
   */
  fastify.post('/auth/logout', async (request, reply) => {
    return new Promise<void>((resolve) => {
      request.session.destroy((err) => {
        if (err) {
          logger.error({ err }, 'Error destroying session');
          reply.code(500).send({ error: 'Failed to logout' });
        } else {
          logger.info('User logged out via API');
          reply.send({ success: true });
        }
        resolve();
      });
    });
  });

  /**
   * GET /auth/me
   * Get current user info
   */
  fastify.get('/auth/me', async (request, reply) => {
    const user = (request as any).session?.user;
    
    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const adminGuilds = (request as any).session?.adminGuilds || [];
    const isBotAdmin = ADMIN_IDS.includes(user.id);

    reply.send({ 
      user,
      adminGuilds,
      isBotAdmin,
    });
  });

  /**
   * GET /auth/guilds
   * Get user's admin guilds (filtered to only guilds where bot is present)
   */
  fastify.get('/auth/guilds', async (request, reply) => {
    const user = (request as any).session?.user;
    
    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const adminGuilds = (request as any).session?.adminGuilds || [];
    
    // Filter to only guilds where bot is present (in database)
    const guildIds = adminGuilds.map((g: any) => g.id);
    const dbGuilds = await prisma.guild.findMany({
      where: {
        id: { in: guildIds }
      },
      select: {
        id: true,
      },
    });
    
    const dbGuildIds = new Set(dbGuilds.map(g => g.id));
    const guildsWithBot = adminGuilds.filter((g: any) => dbGuildIds.has(g.id));
    
    reply.send({ guilds: guildsWithBot });
  });
}
