// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/discordEvent.ts

import { GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, GuildScheduledEventStatus, Client } from 'discord.js';
import db from '../database/db.js';
import { logger } from '../utils/logger.js';
import { getTranslator } from '../i18n/index.js';

/**
 * Service for managing native Discord scheduled events
 */
export class DiscordEventService {
  constructor(private client: Client) {}

  /**
   * Build Discord event description with localization
   */
  private async buildEventDescription(
    event: any,
    participants: { confirmed: number; tentative: number },
    guildId: string
  ): Promise<string> {
    const { t } = await getTranslator(guildId);
    const startTime = new Date(event.startTime);
    const confirmedCount = participants.confirmed;
    const tentativeCount = participants.tentative;
    const totalSignups = confirmedCount + tentativeCount;

    // Fetch creator information - use mention for clickable profile
    let creatorMention = `<@${event.createdBy}>`;
    try {
      // Verify user exists
      await this.client.users.fetch(event.createdBy);
    } catch (error) {
      logger.warn(`Could not fetch creator ${event.createdBy}`);
      creatorMention = 'Unknown';
    }

    // Build event message URL
    let eventUrl = '';
    if (event.messageId && event.channelId) {
      eventUrl = `https://discord.com/channels/${guildId}/${event.channelId}/${event.messageId}`;
    }

    // Calculate time until event
    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeUntilText = '';
    if (timeDiff > 0) {
      if (hoursUntil > 24) {
        const daysUntil = Math.floor(hoursUntil / 24);
        timeUntilText = t(daysUntil > 1 ? 'nativeEvents.startsInDaysPlural' : 'nativeEvents.startsInDays', { days: daysUntil });
      } else if (hoursUntil > 0) {
        timeUntilText = t('nativeEvents.startsInHours', { hours: hoursUntil, minutes: minutesUntil });
      } else {
        timeUntilText = t(minutesUntil > 1 ? 'nativeEvents.startsInMinutesPlural' : 'nativeEvents.startsInMinutes', { minutes: minutesUntil });
      }
    } else {
      timeUntilText = t('nativeEvents.eventStarted');
    }

    // Build description
    let description = '';
    
    // Creator and signup stats on the same line
    description += `👤 ${t('nativeEvents.createdBy')}: ${creatorMention}`;
    description += `     📊 ${t('nativeEvents.signUps')}: ${totalSignups}`;
    if (event.maxParticipants) {
      description += `/${event.maxParticipants}`;
    }
    description += ` (✅ ${confirmedCount}`;
    if (tentativeCount > 0) {
      description += `, ❓ ${tentativeCount}`;
    }
    description += ')';
    
    // Event description if exists
    if (event.description) {
      description += `\n\n${event.description}`;
    }
    
    // Time info
    description += `\n\n⏰ ${timeUntilText}`;
    description += `\n📅 ${startTime.toLocaleString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: event.timezone || 'UTC'
    })}`;
    
    // Event link
    if (eventUrl) {
      description += `\n\n🔗 [${t('nativeEvents.viewEventInDiscord')}](${eventUrl})`;
    }

    return description;
  }

  /**
   * Create a native Discord scheduled event
   */
  async createDiscordEvent(eventId: string): Promise<string | null> {
    try {
      const event = await db().event.findUnique({
        where: { id: eventId },
        include: {
          guild: true,
          participants: {
            where: {
              status: { in: ['confirmed', 'tentative'] }
            }
          }
        }
      });

      if (!event) {
        logger.error(`Event ${eventId} not found`);
        return null;
      }

      // Check if native events are enabled for this guild
      if (!event.guild.createNativeEvent) {
        logger.debug(`Native events disabled for guild ${event.guildId}`);
        return null;
      }

      // Skip if Discord event already exists
      if (event.discordEventId) {
        logger.debug(`Discord event already exists for event ${eventId}`);
        return event.discordEventId;
      }

      const guild = await this.client.guilds.fetch(event.guildId);
      if (!guild) {
        logger.error(`Guild ${event.guildId} not found`);
        return null;
      }

      // Calculate end time
      const startTime = new Date(event.startTime);
      const endTime = event.duration 
        ? new Date(startTime.getTime() + event.duration * 60 * 1000)
        : new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

      // Build description with full details
      const confirmedCount = event.participants.filter(p => p.status === 'confirmed').length;
      const tentativeCount = event.participants.filter(p => p.status === 'tentative').length;
      
      const description = await this.buildEventDescription(
        event,
        { confirmed: confirmedCount, tentative: tentativeCount },
        event.guildId
      );

      // Create Discord scheduled event
      const discordEvent = await guild.scheduledEvents.create({
        name: event.title,
        description: description.substring(0, 1000), // Discord limit
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        entityMetadata: {
          location: event.channelId ? `<#${event.channelId}>` : 'Discord'
        }
      });

      // Store Discord event ID
      await db().event.update({
        where: { id: eventId },
        data: { discordEventId: discordEvent.id }
      });

      logger.info(`Created Discord event ${discordEvent.id} for event ${eventId}`);
      return discordEvent.id;
    } catch (error) {
      logger.error('Error creating Discord event:', error);
      return null;
    }
  }

  /**
   * Update native Discord event when participants change
   */
  async updateDiscordEvent(eventId: string): Promise<boolean> {
    try {
      const event = await db().event.findUnique({
        where: { id: eventId },
        include: {
          guild: true,
          participants: {
            where: {
              status: { in: ['confirmed', 'tentative'] }
            }
          }
        }
      });

      if (!event || !event.discordEventId) {
        return false;
      }

      // Check if native events are enabled
      if (!event.guild.createNativeEvent) {
        return false;
      }

      const guild = await this.client.guilds.fetch(event.guildId);
      if (!guild) {
        logger.error(`Guild ${event.guildId} not found`);
        return false;
      }

      const discordEvent = await guild.scheduledEvents.fetch(event.discordEventId).catch(() => null);
      if (!discordEvent) {
        logger.warn(`Discord event ${event.discordEventId} not found, removing reference`);
        await db().event.update({
          where: { id: eventId },
          data: { discordEventId: null }
        });
        return false;
      }

      // Calculate end time
      const startTime = new Date(event.startTime);
      const endTime = event.duration 
        ? new Date(startTime.getTime() + event.duration * 60 * 1000)
        : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      // Build updated description with full details
      const confirmedCount = event.participants.filter(p => p.status === 'confirmed').length;
      const tentativeCount = event.participants.filter(p => p.status === 'tentative').length;
      
      const description = await this.buildEventDescription(
        event,
        { confirmed: confirmedCount, tentative: tentativeCount },
        event.guildId
      );

      // Update Discord event
      await discordEvent.edit({
        name: event.title,
        description: description.substring(0, 1000),
        scheduledStartTime: startTime,
        scheduledEndTime: endTime
      });

      logger.debug(`Updated Discord event ${discordEvent.id} for event ${eventId}`);
      return true;
    } catch (error) {
      logger.error('Error updating Discord event:', error);
      return false;
    }
  }

  /**
   * Complete/cancel native Discord event
   */
  async completeDiscordEvent(eventId: string, cancel: boolean = false): Promise<boolean> {
    try {
      const event = await db().event.findUnique({
        where: { id: eventId },
        select: { discordEventId: true, guildId: true }
      });

      if (!event || !event.discordEventId) {
        return false;
      }

      const guild = await this.client.guilds.fetch(event.guildId);
      if (!guild) {
        return false;
      }

      const discordEvent = await guild.scheduledEvents.fetch(event.discordEventId).catch(() => null);
      if (!discordEvent) {
        // Already deleted or not found, clean up reference
        await db().event.update({
          where: { id: eventId },
          data: { discordEventId: null }
        });
        return false;
      }

      // Set status to completed or cancelled
      const newStatus = cancel 
        ? GuildScheduledEventStatus.Canceled 
        : GuildScheduledEventStatus.Completed;

      await discordEvent.setStatus(newStatus);
      
      logger.info(`${cancel ? 'Cancelled' : 'Completed'} Discord event ${discordEvent.id} for event ${eventId}`);
      return true;
    } catch (error) {
      logger.error('Error completing/cancelling Discord event:', error);
      return false;
    }
  }

  /**
   * Delete native Discord event
   */
  async deleteDiscordEvent(eventId: string): Promise<boolean> {
    try {
      const event = await db().event.findUnique({
        where: { id: eventId },
        select: { discordEventId: true, guildId: true }
      });

      if (!event || !event.discordEventId) {
        return false;
      }

      const guild = await this.client.guilds.fetch(event.guildId);
      if (!guild) {
        return false;
      }

      const discordEvent = await guild.scheduledEvents.fetch(event.discordEventId).catch(() => null);
      if (discordEvent) {
        await discordEvent.delete();
        logger.info(`Deleted Discord event ${discordEvent.id} for event ${eventId}`);
      }

      // Clean up reference
      await db().event.update({
        where: { id: eventId },
        data: { discordEventId: null }
      });

      return true;
    } catch (error) {
      logger.error('Error deleting Discord event:', error);
      return false;
    }
  }
}
