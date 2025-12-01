// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/botGuildSync.ts
// Sync bot guild list to Redis for web container access

import { createClient, RedisClientType } from 'redis';
import { Client } from 'discord.js';
import { getModuleLogger } from '../utils/logger.js';

const logger = getModuleLogger('bot-guild-sync');

const REDIS_KEY = 'bot:guilds';
const SYNC_INTERVAL = 60000; // 1 minute

let redisClient: RedisClientType | null = null;
let syncInterval: NodeJS.Timeout | null = null;

/**
 * Initialize Redis client for guild sync
 */
export async function initGuildSync(discordClient: Client): Promise<void> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
    
    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on('error', (err) => {
      logger.error({ error: err }, 'Redis guild sync error');
    });

    redisClient.on('connect', () => {
      logger.info('Redis guild sync connected');
    });

    await redisClient.connect();

    // Initial sync
    await syncGuildsToRedis(discordClient);

    // Periodic sync
    syncInterval = setInterval(async () => {
      try {
        await syncGuildsToRedis(discordClient);
      } catch (error) {
        logger.error({ error }, 'Failed to sync guilds periodically');
      }
    }, SYNC_INTERVAL);

    logger.info({ interval: SYNC_INTERVAL }, 'Guild sync initialized');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize guild sync');
    throw error;
  }
}

/**
 * Sync current guild list to Redis
 */
async function syncGuildsToRedis(discordClient: Client): Promise<void> {
  if (!redisClient || !discordClient.isReady()) {
    logger.warn('Redis or Discord client not ready for guild sync');
    return;
  }

  try {
    const guildIds = Array.from(discordClient.guilds.cache.keys());
    
    // Store as JSON array with timestamp
    const data = {
      guildIds,
      lastSync: Date.now(),
    };

    await redisClient.set(REDIS_KEY, JSON.stringify(data), {
      EX: 120, // Expire in 2 minutes (in case bot crashes)
    });

    logger.debug({ count: guildIds.length }, 'Synced guild list to Redis');
  } catch (error) {
    logger.error({ error }, 'Failed to sync guilds to Redis');
  }
}

/**
 * Get bot guild IDs from Redis (used by web container)
 */
export async function getBotGuildIds(): Promise<string[]> {
  if (!redisClient) {
    // Try to connect if not already connected
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on('error', (err) => {
      logger.error({ error: err }, 'Redis guild sync error');
    });

    await redisClient.connect();
  }

  try {
    const data = await redisClient.get(REDIS_KEY);
    
    if (!data) {
      logger.warn('No guild data in Redis');
      return [];
    }

    const parsed = JSON.parse(data as string);
    const age = Date.now() - parsed.lastSync;
    
    if (age > 180000) { // 3 minutes
      logger.warn({ age }, 'Guild data in Redis is stale');
    }

    return parsed.guildIds || [];
  } catch (error) {
    logger.error({ error }, 'Failed to get guild IDs from Redis');
    return [];
  }
}

/**
 * Close Redis connection
 */
export async function closeGuildSync(): Promise<void> {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Guild sync closed');
  }
}
