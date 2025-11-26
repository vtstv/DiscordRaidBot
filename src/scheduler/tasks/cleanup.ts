// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Message deletion task for archived events

import { DateTime } from 'luxon';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { getClient } from '../../bot/index.js';

const logger = getModuleLogger('scheduler:deletion');
const prisma = getPrismaClient();

/**
 * Check for archived events that should be deleted
 * Deletes Discord messages for events that have been archived longer than configured hours
 */
export async function checkMessageDeletion(): Promise<void> {
  const now = DateTime.now();

  // Get all completed events that should be deleted
  const events = await prisma.event.findMany({
    where: {
      status: 'completed',
      archivedAt: { not: null },
      deletedAt: null,
      guild: {
        autoDeleteHours: { not: null },
      },
    },
    include: {
      guild: {
        select: {
          autoDeleteHours: true,
        },
      },
    },
  });

  for (const event of events) {
    if (!event.archivedAt || !event.guild.autoDeleteHours) {
      continue;
    }

    const archivedTime = DateTime.fromJSDate(event.archivedAt);
    const deleteTime = archivedTime.plus({ hours: event.guild.autoDeleteHours });

    // Check if it's time to delete
    if (now >= deleteTime) {
      try {
        await deleteEventMessage(event);
      } catch (error) {
        logger.error({ error, eventId: event.id }, 'Failed to delete event message');
      }
    }
  }
}

/**
 * Delete an event message from Discord and mark as deleted
 */
async function deleteEventMessage(event: any): Promise<void> {
  const client = getClient();

  if (!client) {
    logger.error({ eventId: event.id }, 'Discord client not available');
    return;
  }

  try {
    const channel = await client.channels.fetch(event.channelId);
    if (!channel || !channel.isTextBased()) {
      logger.warn({ eventId: event.id, channelId: event.channelId }, 'Channel not found or not text-based');
      return;
    }

    // Try to delete the message
    try {
      const message = await channel.messages.fetch(event.messageId);
      await message.delete();
      logger.info({ eventId: event.id, messageId: event.messageId }, 'Event message deleted');
    } catch (error: any) {
      // Message might already be deleted or not found
      if (error.code === 10008) { // Unknown Message
        logger.info({ eventId: event.id, messageId: event.messageId }, 'Message already deleted');
      } else {
        throw error;
      }
    }

    // Mark event as deleted
    await prisma.event.update({
      where: { id: event.id },
      data: {
        deletedAt: new Date(),
      },
    });

    logger.info({ eventId: event.id }, 'Event message deletion recorded');
  } catch (error) {
    logger.error({ error, eventId: event.id }, 'Failed to delete event message');
    throw error;
  }
}
