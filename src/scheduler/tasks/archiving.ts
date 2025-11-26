// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Event lifecycle task - handles event start and archiving

import { DateTime } from 'luxon';
import { EmbedBuilder } from 'discord.js';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { getClient } from '../../bot/index.js';
import { updateEventMessage } from '../../messages/eventMessage.js';
import { processEventCompletion } from '../../services/statistics.js';
import { deleteReminderMessages } from './reminders.js';

const logger = getModuleLogger('scheduler:lifecycle');
const prisma = getPrismaClient();

/**
 * Check for events that should be marked as active
 */
export async function checkEventStart(): Promise<void> {
  const now = DateTime.now();

  const events = await prisma.event.findMany({
    where: {
      status: 'scheduled',
      startTime: {
        lte: now.toJSDate(),
      },
    },
  });

  for (const event of events) {
    try {
      await prisma.event.update({
        where: { id: event.id },
        data: { status: 'active' },
      });

      // Delete all reminder messages for this event
      await deleteReminderMessages(event.id);

      await updateEventMessage(event.id);
      logger.info({ eventId: event.id }, 'Event marked as active');
    } catch (error) {
      logger.error({ error, eventId: event.id }, 'Failed to mark event as active');
    }
  }
}

/**
 * Check for events that should be archived
 */
export async function checkArchiving(): Promise<void> {
  const now = DateTime.now();

  // Get active events that have passed
  const events = await prisma.event.findMany({
    where: {
      status: 'active',
      startTime: {
        lte: now.minus({ hours: 1 }).toJSDate(), // Archive 1 hour after start
      },
    },
    include: {
      guild: true,
    },
  });

  for (const event of events) {
    try {
      // If event has duration, check if it's actually completed
      if (event.duration) {
        const endTime = DateTime.fromJSDate(event.startTime).plus({ minutes: event.duration });
        if (endTime > now) {
          continue; // Event still ongoing
        }
      }

      await archiveEvent(event);
    } catch (error) {
      logger.error({ error, eventId: event.id }, 'Failed to archive event');
    }
  }
}

/**
 * Archive a completed event
 */
async function archiveEvent(event: any): Promise<void> {
  const client = getClient();
  
  // Update event status
  await prisma.event.update({
    where: { id: event.id },
    data: {
      status: 'completed',
      archivedAt: DateTime.now().toJSDate(),
    },
  });

  // Process statistics for all confirmed participants
  try {
    await processEventCompletion(event.id);
  } catch (error) {
    logger.error({ error, eventId: event.id }, 'Failed to process event completion statistics');
  }

  // Update the original event message
  await updateEventMessage(event.id);

  // Delete thread if configured
  if (client && event.deleteThread && event.threadId) {
    try {
      const thread = await client.channels.fetch(event.threadId);
      if (thread && thread.isThread()) {
        await thread.delete('Event completed and deleteThread enabled');
        logger.info({ eventId: event.id, threadId: event.threadId }, 'Thread deleted');
      }
    } catch (error) {
      logger.error({ error, eventId: event.id, threadId: event.threadId }, 'Failed to delete thread');
    }
  }

  // Optionally post to archive channel
  if (client && event.guild.archiveChannelId) {
    try {
      const archiveChannel = await client.channels.fetch(event.guild.archiveChannelId);
      if (archiveChannel && archiveChannel.isTextBased() && !archiveChannel.isDMBased()) {
        const participants = await prisma.participant.findMany({
          where: { eventId: event.id, status: 'confirmed' },
        });

        const embed = new EmbedBuilder()
          .setColor(0x808080)
          .setTitle(`📦 Archived Event: ${event.title}`)
          .setDescription(event.description || 'No description')
          .addFields(
            { name: 'Started', value: `<t:${Math.floor(event.startTime.getTime() / 1000)}:F>`, inline: true },
            { name: 'Participants', value: `${participants.length}`, inline: true }
          )
          .setTimestamp();

        if (participants.length > 0) {
          const participantList = participants.map((p: any) => p.username).join(', ');
          embed.addFields({ name: 'Attendees', value: participantList.slice(0, 1024), inline: false });
        }

        await archiveChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      logger.error({ error, eventId: event.id }, 'Failed to post to archive channel');
    }
  }

  logger.info({ eventId: event.id }, 'Event archived');
}
