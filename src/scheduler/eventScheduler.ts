// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/scheduler/eventScheduler.ts
// Event scheduler for reminders and archiving using node-cron

import cron from 'node-cron';
import { DateTime } from 'luxon';
import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';
import { getClient } from '../bot/index.js';
import { parseDuration } from '../utils/time.js';
import { EmbedBuilder } from 'discord.js';
import { updateEventMessage } from '../messages/eventMessage.js';
import { processEventCompletion } from '../services/statistics.js';

const logger = getModuleLogger('scheduler');
const prisma = getPrismaClient();

let schedulerTask: cron.ScheduledTask | null = null;

/**
 * Start the event scheduler
 * Runs every minute to check for events needing reminders or archiving
 */
export function startScheduler(): void {
  if (schedulerTask) {
    logger.warn('Scheduler already running');
    return;
  }

  logger.info('Starting event scheduler');

  // Run every minute
  schedulerTask = cron.schedule('* * * * *', async () => {
    try {
      await checkReminders();
      await checkArchiving();
      await checkEventStart();
      await checkMessageDeletion();
      await cleanupOldLogs();
    } catch (error) {
      logger.error({ error }, 'Scheduler task failed');
    }
  });

  logger.info('Event scheduler started');
}

/**
 * Stop the event scheduler
 */
export function stopScheduler(): void {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    logger.info('Event scheduler stopped');
  }
}

/**
 * Check for events that need reminders
 */
async function checkReminders(): Promise<void> {
  const now = DateTime.now();

  // Get all scheduled events
  const events = await prisma.event.findMany({
    where: {
      status: 'scheduled',
      startTime: {
        gte: now.toJSDate(),
        lte: now.plus({ hours: 24 }).toJSDate(), // Only check events in next 24 hours
      },
    },
    include: {
      guild: true,
      participants: {
        where: { status: 'confirmed' },
      },
    },
  });

  for (const event of events) {
    const eventStart = DateTime.fromJSDate(event.startTime, { zone: event.timezone });
    const timeUntilStart = eventStart.diff(now, 'milliseconds').milliseconds;

    // Get reminder intervals for this guild
    const reminderIntervals = event.guild.reminderIntervals;

    for (const intervalStr of reminderIntervals) {
      const intervalMs = parseDuration(intervalStr);
      if (!intervalMs) continue;

      // Check if we're within the reminder window (±90 seconds for tolerance)
      // This gives more leeway since scheduler runs every minute
      const tolerance = 90000; // 90 seconds in ms
      const timeDiff = Math.abs(timeUntilStart - intervalMs);
      
      if (timeDiff < tolerance) {
        logger.debug({ 
          eventId: event.id, 
          interval: intervalStr, 
          timeUntilStart, 
          intervalMs, 
          timeDiff,
          shouldSend: true 
        }, 'Reminder window matched');
        await sendReminder(event, intervalStr);
      } else {
        logger.debug({ 
          eventId: event.id, 
          interval: intervalStr, 
          timeUntilStart, 
          intervalMs, 
          timeDiff,
          tolerance,
          shouldSend: false 
        }, 'Reminder window not matched');
      }
    }
  }
}

/**
 * Send reminder for an event
 */
async function sendReminder(event: any, interval: string): Promise<void> {
  try {
    // Check if reminder was already sent
    const existingReminder = await prisma.reminder.findUnique({
      where: {
        eventId_interval: {
          eventId: event.id,
          interval: interval,
        },
      },
    });

    if (existingReminder) {
      logger.debug({ eventId: event.id, interval }, 'Reminder already sent, skipping');
      return;
    }

    const client = getClient();
    if (!client) return;

    const channel = await client.channels.fetch(event.channelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      logger.warn({ eventId: event.id, channelId: event.channelId }, 'Cannot send reminder - invalid channel');
      return;
    }

    const participants = event.participants || [];
    const mentions = participants.map((p: any) => `<@${p.userId}>`).join(' ');

    const eventStart = DateTime.fromJSDate(event.startTime, { zone: event.timezone });
    const timestamp = `<t:${Math.floor(eventStart.toMillis() / 1000)}:R>`;

    const embed = new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle(`⏰ Event Reminder: ${event.title}`)
      .setDescription(`The event starts ${timestamp}!`)
      .addFields(
        { name: 'Participants', value: `${participants.length} signed up`, inline: true }
      )
      .setTimestamp();

    const message = await channel.send({
      content: mentions || 'No participants yet',
      embeds: [embed],
    });

    // Save reminder to database
    await prisma.reminder.create({
      data: {
        eventId: event.id,
        interval: interval,
        messageId: message.id,
        channelId: event.channelId,
      },
    });

    logger.info({ eventId: event.id, interval, messageId: message.id }, 'Reminder sent');
  } catch (error) {
    logger.error({ error, eventId: event.id }, 'Failed to send reminder');
  }
}

/**
 * Check for events that should be marked as active
 */
async function checkEventStart(): Promise<void> {
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
 * Delete all reminder messages for an event
 */
async function deleteReminderMessages(eventId: string): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;

    const reminders = await prisma.reminder.findMany({
      where: { eventId },
    });

    for (const reminder of reminders) {
      try {
        const channel = await client.channels.fetch(reminder.channelId);
        if (channel && channel.isTextBased() && !channel.isDMBased()) {
          const message = await channel.messages.fetch(reminder.messageId);
          await message.delete();
          logger.info({ eventId, messageId: reminder.messageId }, 'Reminder message deleted');
        }
      } catch (error: any) {
        // Message might already be deleted
        if (error.code !== 10008) { // 10008 = Unknown Message
          logger.error({ error, eventId, messageId: reminder.messageId }, 'Failed to delete reminder message');
        }
      }
    }

    // Remove reminders from database
    await prisma.reminder.deleteMany({
      where: { eventId },
    });

    logger.info({ eventId, count: reminders.length }, 'Reminder messages cleaned up');
  } catch (error) {
    logger.error({ error, eventId }, 'Failed to delete reminder messages');
  }
}

/**
 * Check for events that should be archived
 */
async function checkArchiving(): Promise<void> {
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

/**
 * Check for archived events that should be deleted
 * Deletes Discord messages for events that have been archived longer than configured hours
 */
async function checkMessageDeletion(): Promise<void> {
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

/**
 * Clean up old audit logs based on guild retention settings
 */
async function cleanupOldLogs(): Promise<void> {
  const now = DateTime.now();

  // Get all guilds with log retention configured
  const guilds = await prisma.guild.findMany({
    where: {
      logRetentionDays: { not: null },
    },
    select: {
      id: true,
      logRetentionDays: true,
    },
  });

  for (const guild of guilds) {
    if (!guild.logRetentionDays) continue;

    const cutoffDate = now.minus({ days: guild.logRetentionDays }).toJSDate();

    try {
      const result = await prisma.logEntry.deleteMany({
        where: {
          guildId: guild.id,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      if (result.count > 0) {
        logger.info({ guildId: guild.id, count: result.count, retentionDays: guild.logRetentionDays }, 'Cleaned up old audit logs');
      }
    } catch (error) {
      logger.error({ error, guildId: guild.id }, 'Failed to cleanup old logs');
    }
  }
}
