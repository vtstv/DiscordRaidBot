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

      // Check if we're within the reminder window (±1 minute for tolerance)
      const tolerance = 60000; // 1 minute in ms
      if (Math.abs(timeUntilStart - intervalMs) < tolerance) {
        await sendReminder(event, intervalStr);
      }
    }
  }
}

/**
 * Send reminder for an event
 */
async function sendReminder(event: any, interval: string): Promise<void> {
  try {
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

    await channel.send({
      content: mentions || 'No participants yet',
      embeds: [embed],
    });

    logger.info({ eventId: event.id, interval }, 'Reminder sent');
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

  // Update the original event message
  await updateEventMessage(event.id);

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
