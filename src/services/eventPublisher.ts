// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/eventPublisher.ts
// Redis-based event publisher for bot-web communication

import { createClient, RedisClientType } from 'redis';
import { getModuleLogger } from '../utils/logger.js';

const logger = getModuleLogger('event-publisher');

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis client for publishing events
 */
export async function initializePublisher(): Promise<void> {
  if (redisClient) return;

  const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
  
  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error('Max retries reached');
        return Math.min(retries * 50, 2000);
      }
    }
  });

  redisClient.on('error', (err) => {
    logger.error({ error: err }, 'Redis publisher error');
  });

  redisClient.on('connect', () => {
    logger.info('Redis publisher connected');
  });

  await redisClient.connect();
}

/**
 * Publish event creation request
 */
export async function publishEventCreated(eventId: string): Promise<void> {
  if (!redisClient) {
    await initializePublisher();
  }

  try {
    await redisClient!.publish('bot:events:created', JSON.stringify({ eventId, timestamp: Date.now() }));
    logger.debug({ eventId }, 'Published event creation');
  } catch (error) {
    logger.error({ error, eventId }, 'Failed to publish event creation');
    throw error;
  }
}

/**
 * Publish event update request
 */
export async function publishEventUpdated(eventId: string): Promise<void> {
  if (!redisClient) {
    await initializePublisher();
  }

  try {
    await redisClient!.publish('bot:events:updated', JSON.stringify({ eventId, timestamp: Date.now() }));
    logger.debug({ eventId }, 'Published event update');
  } catch (error) {
    logger.error({ error, eventId }, 'Failed to publish event update');
    throw error;
  }
}

/**
 * Close Redis connection
 */
export async function closePublisher(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
    logger.info('Redis publisher closed');
  }
}
