// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/eventSubscriber.ts
// Redis subscriber for bot to receive event notifications from web

import { createClient, RedisClientType } from 'redis';
import { getModuleLogger } from '../utils/logger.js';
import { sendEventToChannel } from '../messages/sendEventToChannel.js';

const logger = getModuleLogger('event-subscriber');

let subscriberClient: RedisClientType | null = null;

/**
 * Initialize Redis subscriber for bot
 */
export async function initializeSubscriber(): Promise<void> {
  if (subscriberClient) return;

  const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
  
  subscriberClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error('Max retries reached');
        return Math.min(retries * 50, 2000);
      }
    }
  });

  subscriberClient.on('error', (err) => {
    logger.error({ error: err }, 'Redis subscriber error');
  });

  subscriberClient.on('connect', () => {
    logger.info('Redis subscriber connected');
  });

  await subscriberClient.connect();

  // Subscribe to event channels
  await subscriberClient.subscribe('bot:events:created', async (message) => {
    try {
      const { eventId } = JSON.parse(message);
      logger.info({ eventId }, 'Received event creation notification');
      
      // Send event to Discord channel
      const result = await sendEventToChannel(eventId);
      if (!result.success) {
        logger.warn({ eventId, error: result.error }, 'Failed to send event to Discord');
      } else {
        logger.info({ eventId, messageId: result.messageId }, 'Event sent to Discord');
      }
    } catch (error) {
      logger.error({ error, message }, 'Error processing event creation');
    }
  });

  await subscriberClient.subscribe('bot:events:updated', async (message) => {
    try {
      const { eventId } = JSON.parse(message);
      logger.info({ eventId }, 'Received event update notification');
      
      // TODO: Update event message in Discord
      logger.debug({ eventId }, 'Event update handling not yet implemented');
    } catch (error) {
      logger.error({ error, message }, 'Error processing event update');
    }
  });

  logger.info('Event subscriber initialized and listening');
}

/**
 * Close Redis subscriber connection
 */
export async function closeSubscriber(): Promise<void> {
  if (subscriberClient) {
    await subscriberClient.unsubscribe();
    await subscriberClient.disconnect();
    subscriberClient = null;
    logger.info('Redis subscriber closed');
  }
}
