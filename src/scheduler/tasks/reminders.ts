// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Reminder task for event scheduler

import { DateTime } from 'luxon';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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
  const client = getClient();

  if (!client) {
    logger.warn('Discord client not available, skipping reminders');
    return;
  }

  // Get guilds where bot is present (from bot cache)
  const botGuildIds = Array.from(client.guilds.cache.keys());

  if (botGuildIds.length === 0) {
    logger.debug('Bot not in any guilds, skipping reminders');
    return;
  }

  // Get scheduled events ONLY from guilds where bot is present
  const events = await prisma.event.findMany({
    where: {
      status: 'scheduled',
      guildId: { in: botGuildIds }, // Filter at SQL level
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

    // Create button with link to event message in Discord
    const components = [];
    if (event.messageId && event.channelId) {
      const guildId = event.guildId;
      const messageUrl = `https://discord.com/channels/${guildId}/${event.channelId}/${event.messageId}`;
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Go to Event')
            .setStyle(ButtonStyle.Link)
            .setURL(messageUrl)
            .setEmoji('📅')
        );
      components.push(row);
    }

    const message = await channel.send({
      content: mentions || 'No participants yet',
      embeds: [embed],
      components,
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

    // Send DM reminders if enabled
    if (event.guild.dmRemindersEnabled) {
      await sendDMReminders(event, timestamp, components);
    }
  } catch (error) {
    logger.error({ error, eventId: event.id }, 'Failed to send reminder');
  }
}

/**
 * Send DM reminders to confirmed participants
 */
async function sendDMReminders(event: any, timestamp: string, components: any[]): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;

    // Get confirmed participants only
    const confirmedParticipants = event.participants.filter((p: any) => p.status === 'confirmed');
    
    if (confirmedParticipants.length === 0) {
      logger.debug({ eventId: event.id }, 'No confirmed participants for DM reminders');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle(`⏰ Event Reminder: ${event.title}`)
      .setDescription(`Your event starts ${timestamp}!`)
      .addFields(
        { name: 'Event', value: event.title, inline: false },
        { name: 'Description', value: event.description || 'No description', inline: false }
      )
      .setTimestamp();

    let successCount = 0;
    let failCount = 0;

    for (const participant of confirmedParticipants) {
      try {
        const user = await client.users.fetch(participant.userId);
        await user.send({
          embeds: [embed],
          components,
        });
        successCount++;
        logger.debug({ userId: participant.userId, eventId: event.id }, 'DM reminder sent');
      } catch (error: any) {
        failCount++;
        // User might have DMs disabled or blocked the bot
        if (error.code === 50007) {
          logger.debug({ userId: participant.userId, eventId: event.id }, 'Cannot send DM - user has DMs disabled');
        } else {
          logger.warn({ error, userId: participant.userId, eventId: event.id }, 'Failed to send DM reminder');
        }
      }
    }

    logger.info({ 
      eventId: event.id, 
      successCount, 
      failCount, 
      totalConfirmed: confirmedParticipants.length 
    }, 'DM reminders completed');
  } catch (error) {
    logger.error({ error, eventId: event.id }, 'Failed to send DM reminders');
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
