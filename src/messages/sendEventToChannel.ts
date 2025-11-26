// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/messages/sendEventToChannel.ts
// Send event message to Discord channel from web interface

import { getClient } from '../bot/index.js';
import { createEventMessage } from './eventMessage.js';
import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';

const logger = getModuleLogger('send-event');
const prisma = getPrismaClient();

/**
 * Send event message to Discord channel and update event with messageId
 */
export async function sendEventToChannel(eventId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    const client = getClient();
    if (!client) {
      return { success: false, error: 'Discord bot is not connected' };
    }

    const channel = await client.channels.fetch(event.channelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      return { success: false, error: 'Invalid channel or bot has no access' };
    }

    const messageData = await createEventMessage(event);
    const message = await channel.send(messageData);

    // Create thread if enabled
    let threadId: string | undefined;
    if (event.createThread && !channel.isThread() && 'threads' in channel) {
      try {
        const thread = await message.startThread({
          name: `💬 ${event.title}`,
          autoArchiveDuration: 1440, // 24 hours
        });
        threadId = thread.id;
        logger.info({ eventId: event.id, threadId }, 'Event thread created from web');
      } catch (threadError) {
        logger.warn({ error: threadError, eventId: event.id }, 'Failed to create thread from web');
      }
    }

    // Update event with message ID and thread ID
    await prisma.event.update({
      where: { id: eventId },
      data: {
        messageId: message.id,
        threadId,
      },
    });

    logger.info({ eventId, messageId: message.id, channelId: event.channelId }, 'Event message sent to Discord from web');
    return { success: true, messageId: message.id };
  } catch (error) {
    logger.error({ error, eventId }, 'Failed to send event message to Discord');
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
