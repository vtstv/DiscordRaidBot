// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/auth/discord-oauth.ts
// Discord OAuth2 authentication

import { getModuleLogger } from '../../utils/logger.js';
import { config } from '../../config/env.js';

const logger = getModuleLogger('discord-oauth');

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DISCORD_OAUTH_URL = 'https://discord.com/api/oauth2/authorize';
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

export interface AuthSession {
  user: DiscordUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface GuildMemberInfo {
  user: DiscordUser;
  roles: string[];
  nick?: string;
}

/**
 * Get Discord OAuth2 authorization URL
 */
export function getAuthorizationUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: config.DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
    state,
  });

  return `${DISCORD_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: config.DISCORD_CLIENT_ID,
    client_secret: config.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(DISCORD_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error({ status: response.status, error }, 'Failed to exchange code');
    throw new Error('Failed to exchange authorization code');
  }

  return (await response.json()) as TokenResponse;
}

/**
 * Get Discord user info
 */
export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error({ status: response.status, error }, 'Failed to get user info');
    throw new Error('Failed to get user info');
  }

  return (await response.json()) as DiscordUser;
}

/**
 * Get user's guilds from Discord
 */
export async function getUserGuilds(accessToken: string): Promise<GuildInfo[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error({ status: response.status, error }, 'Failed to get user guilds');
    throw new Error('Failed to get user guilds');
  }

  return (await response.json()) as GuildInfo[];
}

/**
 * Get guild member info (requires bot to be in the guild)
 */
export async function getGuildMember(
  guildId: string,
  userId: string
): Promise<GuildMemberInfo | null> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`, {
      headers: {
        Authorization: `Bot ${config.DISCORD_TOKEN}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.warn({ guildId, userId, status: 404 }, 'Guild member not found (404)');
        return null;
      }
      const errorText = await response.text();
      logger.error({ guildId, userId, status: response.status, errorText }, 'Discord API error getting guild member');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return (await response.json()) as GuildMemberInfo;
  } catch (error) {
    logger.error({ error, guildId, userId, message: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to get guild member');
    return null;
  }
}

/**
 * Check if user has admin permissions in guild
 */
export function hasAdminPermissions(permissions: string): boolean {
  const permBigInt = BigInt(permissions);
  const ADMINISTRATOR = BigInt(0x8); // 8
  const MANAGE_GUILD = BigInt(0x20); // 32

  return (permBigInt & ADMINISTRATOR) === ADMINISTRATOR || (permBigInt & MANAGE_GUILD) === MANAGE_GUILD;
}

/**
 * Build Discord avatar URL from user data
 */
export function getAvatarUrl(userId: string, avatarHash: string | null): string | null {
  if (!avatarHash) return null;
  
  const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=128`;
}

/**
 * Get guild roles
 */
export async function getGuildRoles(guildId: string): Promise<any[]> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${config.DISCORD_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as any[];
  } catch (error) {
    logger.error({ error, guildId }, 'Failed to get guild roles');
    return [];
  }
}

/**
 * Get guild channels
 */
export async function getGuildChannels(guildId: string): Promise<any[]> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${config.DISCORD_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as any[];
  } catch (error) {
    logger.error({ error, guildId }, 'Failed to get guild channels');
    return [];
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: config.DISCORD_CLIENT_ID,
    client_secret: config.DISCORD_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(DISCORD_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error({ status: response.status, error }, 'Failed to refresh token');
    throw new Error('Failed to refresh access token');
  }

  return (await response.json()) as TokenResponse;
}
