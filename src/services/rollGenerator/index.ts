// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/rollGenerator/index.ts

import { Client, TextChannel, Message } from 'discord.js';
import db from '../../database/db.js';
import { logger } from '../../utils/logger.js';
import { createRollEmbed, createRollComponents } from './rollEmbed.js';
import { RollManager } from './rollManager.js';

export class RollGeneratorService {
  private rollManager: RollManager;

  constructor(private client: Client) {
    this.rollManager = new RollManager(client);
  }

  /**
   * Create and send roll generator message to Discord
   */
  async createRollMessage(rollGeneratorId: string): Promise<Message | null> {
    try {
      const rollGenerator = await db().rollGenerator.findUnique({
        where: { id: rollGeneratorId },
        include: {
          rolls: {
            orderBy: {
              rollValue: 'desc',
            },
            take: 100,
          },
        },
      });

      if (!rollGenerator) {
        logger.error({ rollGeneratorId }, 'Roll generator not found');
        return null;
      }

      const channel = await this.client.channels.fetch(rollGenerator.channelId);
      if (!channel || !channel.isTextBased()) {
        logger.error({ channelId: rollGenerator.channelId }, 'Channel not found or not text-based');
        return null;
      }

      const embed = createRollEmbed(rollGenerator, rollGenerator.rolls);
      const components = createRollComponents(rollGenerator);

      const message = await (channel as TextChannel).send({
        embeds: [embed],
        components,
      });

      // Update database with message ID
      await db().rollGenerator.update({
        where: { id: rollGeneratorId },
        data: { messageId: message.id },
      });

      logger.info({ rollGeneratorId, messageId: message.id }, 'Roll generator message created');

      return message;
    } catch (error) {
      logger.error({ err: error, rollGeneratorId }, 'Failed to create roll message');
      return null;
    }
  }

  /**
   * Update roll generator message
   */
  async updateRollMessage(rollGeneratorId: string): Promise<void> {
    try {
      const rollGenerator = await db().rollGenerator.findUnique({
        where: { id: rollGeneratorId },
        include: {
          rolls: {
            orderBy: {
              rollValue: 'desc',
            },
            take: 100,
          },
        },
      });

      if (!rollGenerator || !rollGenerator.messageId) {
        return;
      }

      const channel = await this.client.channels.fetch(rollGenerator.channelId);
      if (!channel || !channel.isTextBased()) {
        return;
      }

      const message = await (channel as TextChannel).messages.fetch(rollGenerator.messageId);
      if (!message) {
        return;
      }

      const embed = createRollEmbed(rollGenerator, rollGenerator.rolls);
      const components = createRollComponents(rollGenerator);

      await message.edit({
        embeds: [embed],
        components,
      });

      logger.debug({ rollGeneratorId }, 'Roll generator message updated');
    } catch (error) {
      logger.error({ err: error, rollGeneratorId }, 'Failed to update roll message');
    }
  }

  /**
   * Close roll generator
   */
  async closeRollGenerator(rollGeneratorId: string): Promise<void> {
    try {
      await db().rollGenerator.update({
        where: { id: rollGeneratorId },
        data: {
          status: 'closed',
          endTime: new Date(),
        },
      });

      await this.updateRollMessage(rollGeneratorId);

      logger.info({ rollGeneratorId }, 'Roll generator closed');
    } catch (error) {
      logger.error({ err: error, rollGeneratorId }, 'Failed to close roll generator');
      throw error;
    }
  }

  /**
   * Schedule auto-close for roll generator
   */
  scheduleAutoClose(rollGeneratorId: string, delaySeconds: number): void {
    setTimeout(async () => {
      try {
        const rollGenerator = await db().rollGenerator.findUnique({
          where: { id: rollGeneratorId },
        });

        if (rollGenerator && rollGenerator.status !== 'closed') {
          await this.closeRollGenerator(rollGeneratorId);
        }
      } catch (error) {
        logger.error({ err: error, rollGeneratorId }, 'Failed to auto-close roll generator');
      }
    }, delaySeconds * 1000);

    logger.info({ rollGeneratorId, delaySeconds }, 'Scheduled auto-close for roll generator');
  }

  /**
   * Schedule auto-start for roll generator
   */
  scheduleAutoStart(rollGeneratorId: string, delaySeconds: number): void {
    setTimeout(async () => {
      try {
        await db().rollGenerator.update({
          where: { id: rollGeneratorId },
          data: {
            status: 'active',
            startTime: new Date(),
          },
        });

        await this.updateRollMessage(rollGeneratorId);

        logger.info({ rollGeneratorId }, 'Roll generator auto-started');
      } catch (error) {
        logger.error({ err: error, rollGeneratorId }, 'Failed to auto-start roll generator');
      }
    }, delaySeconds * 1000);

    logger.info({ rollGeneratorId, delaySeconds }, 'Scheduled auto-start for roll generator');
  }

  /**
   * Handle user roll
   */
  async handleRoll(rollGeneratorId: string, userId: string, username: string): Promise<{ success: boolean; message: string; rollValue?: number }> {
    return this.rollManager.processRoll(rollGeneratorId, userId, username);
  }
}
