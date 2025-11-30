// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/rollGenerator/rollManager.ts

import { Client, GuildMember } from 'discord.js';
import db from '../../database/db.js';
import { logger } from '../../utils/logger.js';

export class RollManager {
  constructor(private client: Client) {}

  /**
   * Process a user's roll
   */
  async processRoll(rollGeneratorId: string, userId: string, username: string): Promise<{ success: boolean; message: string; rollValue?: number }> {
    try {
      const rollGenerator = await db().rollGenerator.findUnique({
        where: { id: rollGeneratorId },
        include: {
          rolls: {
            where: { userId },
          },
        },
      });

      if (!rollGenerator) {
        return { success: false, message: 'Roll generator not found' };
      }

      if (rollGenerator.status !== 'active') {
        return { success: false, message: 'This roll generator is not active' };
      }

      // Check if user has reached roll limit
      const userRollCount = rollGenerator.rolls.length;
      if (userRollCount >= rollGenerator.rollsPerUser) {
        return {
          success: false,
          message: `You have already rolled ${rollGenerator.rollsPerUser} time${rollGenerator.rollsPerUser !== 1 ? 's' : ''}`,
        };
      }

      // Check max users limit
      if (rollGenerator.maxUsers) {
        const uniqueUsers = await db().rollResult.groupBy({
          by: ['userId'],
          where: { rollGeneratorId },
        });

        if (uniqueUsers.length >= rollGenerator.maxUsers && !rollGenerator.rolls.some(r => r.userId === userId)) {
          return {
            success: false,
            message: `Maximum number of users (${rollGenerator.maxUsers}) has been reached`,
          };
        }
      }

      // Check allowed roles
      if (rollGenerator.allowedRoles.length > 0) {
        const guild = await this.client.guilds.fetch(rollGenerator.guildId);
        const member = await guild.members.fetch(userId);
        
        const hasAllowedRole = rollGenerator.allowedRoles.some(roleId => member.roles.cache.has(roleId));
        if (!hasAllowedRole) {
          return {
            success: false,
            message: 'You do not have permission to roll (required role missing)',
          };
        }
      }

      // Check voice channel requirement
      if (rollGenerator.limitToVoice) {
        const guild = await this.client.guilds.fetch(rollGenerator.guildId);
        const member = await guild.members.fetch(userId);
        
        if (!member.voice.channelId || member.voice.channelId !== rollGenerator.limitToVoice) {
          const voiceChannel = await guild.channels.fetch(rollGenerator.limitToVoice);
          return {
            success: false,
            message: `You must be in ${voiceChannel?.name || 'the required voice channel'} to roll`,
          };
        }
      }

      // Generate random roll value
      const rollValue = Math.floor(Math.random() * rollGenerator.maxRoll) + 1;

      // Save roll to database
      await db().rollResult.create({
        data: {
          rollGeneratorId,
          userId,
          username,
          rollValue,
        },
      });

      logger.info({ rollGeneratorId, userId, rollValue }, 'User rolled');

      return {
        success: true,
        message: `You rolled **${rollValue}**!`,
        rollValue,
      };

    } catch (error) {
      logger.error({ err: error, rollGeneratorId, userId }, 'Failed to process roll');
      return {
        success: false,
        message: 'Failed to process your roll. Please try again.',
      };
    }
  }
}
