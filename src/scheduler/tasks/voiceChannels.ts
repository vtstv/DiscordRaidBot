// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Voice channel management task for event scheduler

import { DateTime } from 'luxon';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { getClient } from '../../bot/index.js';

const logger = getModuleLogger('scheduler:voiceChannels');
const prisma = getPrismaClient();

/**
 * Check for events that need voice channels created or deleted
 */
export async function manageVoiceChannels(): Promise<void> {
  try {
    const now = new Date();
    
    // Create channels for upcoming events
    await createVoiceChannels(now);
    
    // Delete expired channels
    await deleteExpiredVoiceChannels(now);
  } catch (error) {
    logger.error({ error }, 'Failed to manage voice channels');
  }
}

/**
 * Create voice channels for events that need them
 */
async function createVoiceChannels(now: Date): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;

    // Find events that need voice channels created
    const events = await prisma.event.findMany({
      where: {
        createVoiceChannel: true,
        voiceChannelId: null,
        status: 'scheduled',
        voiceChannelCreatedAt: null,
      },
      include: {
        guild: true,
        participants: {
          where: { status: 'confirmed' },
          select: { userId: true },
        },
      },
    });

    for (const event of events) {
      try {
        // Calculate when to create channel
        const createBefore = event.voiceChannelCreateBefore ?? event.guild.voiceChannelCreateBefore;
        const createAt = DateTime.fromJSDate(event.startTime, { zone: event.timezone })
          .minus({ minutes: createBefore });
        
        const nowDt = DateTime.fromJSDate(now, { zone: event.timezone });
        
        // Check if it's time to create the channel
        if (nowDt < createAt) {
          continue; // Not yet time
        }

        // Check if category exists
        if (!event.guild.voiceChannelCategoryId) {
          logger.warn({ eventId: event.id, guildId: event.guildId }, 'No voice channel category set for guild');
          continue;
        }

        const guild = await client.guilds.fetch(event.guildId);
        if (!guild) {
          logger.warn({ eventId: event.id, guildId: event.guildId }, 'Guild not found');
          continue;
        }

        const category = await guild.channels.fetch(event.guild.voiceChannelCategoryId);
        if (!category || category.type !== ChannelType.GuildCategory) {
          logger.warn({ eventId: event.id, categoryId: event.guild.voiceChannelCategoryId }, 'Category not found or invalid');
          continue;
        }

        // Generate channel name
        let channelName = event.voiceChannelName || event.title;
        if (channelName.length > 50) {
          channelName = channelName.substring(0, 47) + '...';
        }

        // Create voice channel
        const permissionOverwrites: any[] = [];
        
        if (event.voiceChannelRestricted && event.participants.length > 0) {
          // Restrict to participants only
          permissionOverwrites.push({
            id: guild.id, // @everyone
            deny: [PermissionFlagsBits.Connect],
          });
          
          // Allow each confirmed participant
          for (const participant of event.participants) {
            permissionOverwrites.push({
              id: participant.userId,
              allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
            });
          }
        }

        const voiceChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: event.guild.voiceChannelCategoryId,
          permissionOverwrites,
        });

        // Calculate deletion time
        const eventEndTime = DateTime.fromJSDate(event.startTime, { zone: event.timezone })
          .plus({ minutes: event.duration || 0 })
          .plus({ minutes: event.guild.voiceChannelDuration });

        // Update event with voice channel info
        await prisma.event.update({
          where: { id: event.id },
          data: {
            voiceChannelId: voiceChannel.id,
            voiceChannelCreatedAt: now,
            voiceChannelDeleteAt: eventEndTime.toJSDate(),
          },
        });

        logger.info({
          eventId: event.id,
          voiceChannelId: voiceChannel.id,
          channelName,
          deleteAt: eventEndTime.toISO(),
        }, 'Voice channel created for event');
      } catch (error) {
        logger.error({ error, eventId: event.id }, 'Failed to create voice channel for event');
      }
    }
  } catch (error) {
    logger.error({ error }, 'Failed to create voice channels');
  }
}

/**
 * Delete expired voice channels
 */
async function deleteExpiredVoiceChannels(now: Date): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;

    // Find events with voice channels that should be deleted
    const events = await prisma.event.findMany({
      where: {
        voiceChannelId: { not: null },
        voiceChannelDeleteAt: { lte: now },
      },
    });

    for (const event of events) {
      try {
        if (!event.voiceChannelId) continue;

        const guild = await client.guilds.fetch(event.guildId);
        if (!guild) {
          logger.warn({ eventId: event.id, guildId: event.guildId }, 'Guild not found for voice channel deletion');
          continue;
        }

        const channel = await guild.channels.fetch(event.voiceChannelId).catch(() => null);
        if (channel) {
          await channel.delete('Event voice channel expired');
          logger.info({ eventId: event.id, voiceChannelId: event.voiceChannelId }, 'Voice channel deleted');
        }

        // Clear voice channel info from event
        await prisma.event.update({
          where: { id: event.id },
          data: {
            voiceChannelId: null,
            voiceChannelDeleteAt: null,
          },
        });
      } catch (error) {
        logger.error({ error, eventId: event.id }, 'Failed to delete voice channel');
      }
    }
  } catch (error) {
    logger.error({ error }, 'Failed to delete expired voice channels');
  }
}

/**
 * Delete voice channel immediately (when event is cancelled)
 */
export async function deleteVoiceChannelNow(eventId: string): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { guildId: true, voiceChannelId: true },
    });

    if (!event || !event.voiceChannelId) return;

    const guild = await client.guilds.fetch(event.guildId);
    if (!guild) return;

    const channel = await guild.channels.fetch(event.voiceChannelId).catch(() => null);
    if (channel) {
      await channel.delete('Event cancelled');
      logger.info({ eventId, voiceChannelId: event.voiceChannelId }, 'Voice channel deleted (event cancelled)');
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        voiceChannelId: null,
        voiceChannelDeleteAt: null,
      },
    });
  } catch (error) {
    logger.error({ error, eventId }, 'Failed to delete voice channel');
  }
}

/**
 * Extend voice channel lifetime
 */
export async function extendVoiceChannel(eventId: string, additionalMinutes: number): Promise<void> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { voiceChannelDeleteAt: true },
    });

    if (!event || !event.voiceChannelDeleteAt) {
      throw new Error('Event has no voice channel or deletion time');
    }

    const newDeleteAt = DateTime.fromJSDate(event.voiceChannelDeleteAt)
      .plus({ minutes: additionalMinutes })
      .toJSDate();

    await prisma.event.update({
      where: { id: eventId },
      data: { voiceChannelDeleteAt: newDeleteAt },
    });

    logger.info({ eventId, additionalMinutes, newDeleteAt }, 'Voice channel lifetime extended');
  } catch (error) {
    logger.error({ error, eventId }, 'Failed to extend voice channel');
    throw error;
  }
}
