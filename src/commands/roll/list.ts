// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/roll/list.ts

import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import db from '../../database/db.js';
import { logger } from '../../utils/logger.js';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    if (!interaction.guildId) {
      throw new Error('This command can only be used in a server');
    }

    // Get all active roll generators for this guild
    const rollGenerators = await db().rollGenerator.findMany({
      where: {
        guildId: interaction.guildId,
        status: {
          in: ['pending', 'active'],
        },
      },
      include: {
        _count: {
          select: { rolls: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (rollGenerators.length === 0) {
      return interaction.editReply({
        content: '📊 There are no active roll generators in this server.',
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎲 Active Roll Generators')
      .setColor(0x5865F2)
      .setDescription(`Found ${rollGenerators.length} active roll generator${rollGenerators.length !== 1 ? 's' : ''}`)
      .setTimestamp();

    for (const generator of rollGenerators.slice(0, 10)) {
      const channel = await interaction.client.channels.fetch(generator.channelId).catch(() => null);
      const channelMention = channel ? `<#${generator.channelId}>` : 'Unknown Channel';
      
      const statusEmoji = generator.status === 'pending' ? '⏳' : '✅';
      const rollCount = generator._count.rolls;
      
      let fieldValue = `**Status:** ${statusEmoji} ${generator.status === 'pending' ? 'Pending' : 'Active'}\n`;
      fieldValue += `**Channel:** ${channelMention}\n`;
      fieldValue += `**Rolls:** ${rollCount}\n`;
      fieldValue += `**Max Roll:** 1-${generator.maxRoll}\n`;
      
      if (generator.maxUsers) {
        const uniqueUsers = await db().rollResult.groupBy({
          by: ['userId'],
          where: { rollGeneratorId: generator.id },
        });
        fieldValue += `**Users:** ${uniqueUsers.length}/${generator.maxUsers}\n`;
      }
      
      fieldValue += `**ID:** \`${generator.id}\``;

      embed.addFields({
        name: generator.title,
        value: fieldValue,
        inline: false,
      });
    }

    if (rollGenerators.length > 10) {
      embed.setFooter({ text: `Showing 10 of ${rollGenerators.length} generators` });
    }

    await interaction.editReply({
      embeds: [embed],
    });

  } catch (error) {
    logger.error({ err: error, module: 'roll-list' }, 'Failed to list roll generators');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await interaction.editReply({
      content: `❌ Failed to list roll generators: ${errorMessage}`,
    });
  }
}
