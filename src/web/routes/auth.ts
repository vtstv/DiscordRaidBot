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
import { getBotGuildIds } from '../../services/botGuildSync.js';
import '../types/session.js'; // Import session type declarations

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
        // Get user's member info in this guild
        const memberInfo = await getGuildMember(dbGuild.id, user.id);
        
        if (memberInfo) {
          // Check if user has any role in dashboardRoles
          const hasRequiredRole = memberInfo.roles.some(roleId => 
            dbGuild.dashboardRoles.includes(roleId)
          );

          if (hasRequiredRole) {
            // Check if user already in adminGuilds (has ADMINISTRATOR permission)
            const existingIndex = adminGuilds.findIndex(g => g.id === dbGuild.id);
            
            if (existingIndex !== -1) {
              // User has ADMINISTRATOR but also has dashboard role
              // Mark as role-based to enforce permission restrictions
              adminGuilds[existingIndex] = {
                ...adminGuilds[existingIndex],
                isRoleBased: true
              } as any;
            } else {
              // User doesn't have ADMINISTRATOR, only dashboard role
              // Find the guild in user's guilds list
              const guildInfo = guilds.find(g => g.id === dbGuild.id);
              if (guildInfo) {
                // Mark this guild as role-based access (not admin)
                adminGuilds.push({
                  ...guildInfo,
                  isRoleBased: true // Flag to indicate this is role-based, not admin
                } as any);
              } else {
                // User is in the guild but it didn't come from Discord API
                // This shouldn't happen, but add it anyway with minimal info
                adminGuilds.push({
                  id: dbGuild.id,
                  name: dbGuild.name,
                  icon: null,
                  isRoleBased: true, // Flag to indicate this is role-based, not admin
                  owner: false,
                  permissions: '0'
                } as any);
              }
            }
          }
        }
      }

      // Helper function for avatar URL
      function getAvatarUrl(userId: string, avatarHash: string | null): string | null {
        if (!avatarHash) return null;
        const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
        return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=128`;
      }

      // Store user in session
      request.session.user = {
        id: user.id,
        username: user.username,
        avatar: getAvatarUrl(user.id, user.avatar),
      };

      // Also store tokens for API calls
      request.session.accessToken = tokenData.access_token;
      request.session.refreshToken = tokenData.refresh_token;
      request.session.expiresAt = Date.now() + tokenData.expires_in * 1000;

      // Store admin guilds with isRoleBased flag
      request.session.adminGuilds = adminGuilds.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        owner: g.owner,
        isRoleBased: (g as any).isRoleBased || false,
      }));

      // Check if user is bot admin and store in session
      const isBotAdmin = ADMIN_IDS.includes(user.id);
      request.session.isBotAdmin = isBotAdmin;

      // Clear user cache to ensure fresh data on first request
      const { clearUserCache } = await import('../auth/middleware.js');
      clearUserCache(user.id);

      logger.info({ 
        userId: user.id, 
        username: user.username,
        adminGuildsCount: adminGuilds.length,
      }, 'User logged in via Discord');

      // Get the stored returnTo or default redirect
      const returnTo = stateData.returnTo || '/';
      
      logger.info({ 
        userId: user.id,
        username: user.username,
        adminIds: ADMIN_IDS,
        isBotAdmin: request.session.isBotAdmin,
        adminGuildsCount: adminGuilds.length
      }, 'OAuth: Checking user permissions');
      
      // Determine redirect:
      // 1. Bot admins go to /select-panel (choose between bot admin and guild admin)
      // 2. Guild admins go to /servers (server selection)
      // 3. Regular users go to returnTo
      let redirectUrl = returnTo;
      if (request.session.isBotAdmin) {
        redirectUrl = '/select-panel';
      } else if (adminGuilds.length > 0) {
        redirectUrl = '/servers';
      }
      
      logger.info({ 
        userId: user.id, 
        isBotAdmin: request.session.isBotAdmin, 
        hasGuildAdmin: adminGuilds.length > 0,
        redirectUrl 
      }, 'Redirecting after OAuth');
      
      reply.redirect(redirectUrl);
    } catch (error) {
      logger.error({ error }, 'Failed to complete OAuth flow');
      
      // Check if it's a rate limit error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('rate limited')) {
        return reply.code(429).send({
          error: 'Rate Limited',
          message: 'Discord API rate limit exceeded. Please wait a few minutes and try again.',
        });
      }
      
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
    // Check if user is admin: either password auth (id='admin') or Discord OAuth with whitelisted ID
    const isBotAdmin = user.id === 'admin' || ADMIN_IDS.includes(user.id);

    reply.send({ 
      user,
      adminGuilds,
      isBotAdmin,
    });
  });

  /**
   * GET /auth/guilds
   * Get user's admin guilds - show guilds where:
   * 1. (Bot present AND user is member) OR (Data in DB AND user is member)
   * 2. Mark each guild with hasBot: true/false
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
    
    // Get guilds where bot is actually present (from Redis synced by bot container)
    const botGuildIdsArray = await getBotGuildIds();
    const botGuildIds = new Set(botGuildIdsArray);
    
    // Get guilds that have data in database
    const guildIds = adminGuilds.map((g: any) => g.id);
    const dbGuilds = await prisma.guild.findMany({
      where: { id: { in: guildIds } },
      select: { id: true },
    });
    const dbGuildIds = new Set(dbGuilds.map(g => g.id));
    
    logger.debug({ 
      botGuildCount: botGuildIds.size,
      dbGuildCount: dbGuildIds.size,
      adminGuildCount: adminGuilds.length 
    }, 'Checking guild presence');
    
    // Show guilds where: (bot present OR data in DB) AND user is member
    const filteredGuilds: any[] = [];
    
    for (const g of adminGuilds) {
      const hasBot = botGuildIds.has(g.id);
      const inDB = dbGuildIds.has(g.id);
      
      // Skip if neither bot present nor data in DB
      if (!hasBot && !inDB) {
        logger.debug({ guildId: g.id, guildName: g.name }, 'Skipping guild - no bot and no data');
        continue;
      }
      
      // If bot is present, verify user is actually a member via Discord API
      // If bot is NOT present, we can't verify membership (bot can't access guild info)
      // so trust the OAuth data (guild is in adminGuilds = user has access)
      if (hasBot) {
        const memberInfo = await getGuildMember(g.id, user.id);
        if (!memberInfo) {
          logger.debug({ guildId: g.id, guildName: g.name, userId: user.id }, 'Skipping guild - user not a member');
          continue;
        }
      }
      
      filteredGuilds.push({
        ...g,
        hasBot, // true if bot present, false if only data in DB
      });
      
      logger.debug({
        guildId: g.id,
        guildName: g.name,
        hasBot,
        inDB
      }, 'Guild included in list');
    }
    
    logger.debug({ resultCount: filteredGuilds.length }, 'Filtered guilds result');
    
    reply.send({ guilds: filteredGuilds });
  });

  /**
   * POST /auth/refresh-permissions
   * Clear cache and re-fetch user's guild permissions
   * Use this when user's roles change and they need immediate access
   */
  fastify.post('/auth/refresh-permissions', async (request, reply) => {
    const user = (request as any).session?.user;
    
    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    logger.info({ userId: user.id }, 'Refreshing user permissions');

    // Clear user's cache
    const { clearUserCache } = await import('../auth/middleware.js');
    clearUserCache(user.id);

    // Re-fetch user's guilds and permissions
    const accessToken = (request as any).session?.accessToken;
    if (!accessToken) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'No access token in session. Please log out and log in again.',
      });
    }

    try {
      // Get fresh guilds from Discord
      const guilds = await getUserGuilds(accessToken);
      
      // Find guilds where user has admin permissions
      let adminGuilds = guilds.filter(guild => 
        guild.owner || hasAdminPermissions(guild.permissions)
      );

      // Check guilds with dashboardRoles
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

      // Check if user has required roles
      for (const dbGuild of dbGuildsWithDashboardRoles) {
        const memberInfo = await getGuildMember(dbGuild.id, user.id);
        
        if (memberInfo) {
          const hasRequiredRole = memberInfo.roles.some(roleId => 
            dbGuild.dashboardRoles.includes(roleId)
          );

          if (hasRequiredRole) {
            const existingIndex = adminGuilds.findIndex(g => g.id === dbGuild.id);
            
            if (existingIndex !== -1) {
              adminGuilds[existingIndex] = {
                ...adminGuilds[existingIndex],
                isRoleBased: true
              } as any;
            } else {
              const guildInfo = guilds.find(g => g.id === dbGuild.id);
              if (guildInfo) {
                adminGuilds.push({
                  ...guildInfo,
                  isRoleBased: true
                } as any);
              } else {
                adminGuilds.push({
                  id: dbGuild.id,
                  name: dbGuild.name,
                  icon: null,
                  isRoleBased: true,
                  owner: false,
                  permissions: '0'
                } as any);
              }
            }
          }
        }
      }

      // Update session with fresh data
      request.session.adminGuilds = adminGuilds.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        owner: g.owner,
        isRoleBased: (g as any).isRoleBased || false,
      }));

      logger.info({ 
        userId: user.id, 
        adminGuildsCount: adminGuilds.length 
      }, 'Permissions refreshed successfully');

      reply.send({ 
        success: true,
        message: 'Permissions refreshed',
        adminGuilds: request.session.adminGuilds,
      });
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Failed to refresh permissions');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to refresh permissions',
      });
    }
  });
}
