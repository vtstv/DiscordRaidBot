// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Reminder task for event scheduler

import { DateTime } from 'luxon';
import { EmbedBuilder } from 'discord.js';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { getClient } from '../../bot/index.js';
import { parseDuration } from '../../utils/time.js';

const logger = getModuleLogger('scheduler:reminders');
const prisma = getPrismaClient();

/**
 * Check for events that need reminders
 */
export async function checkReminders(): Promise<void> {
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
 * Delete all reminder messages for an event
 */
export async function deleteReminderMessages(eventId: string): Promise<void> {
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
