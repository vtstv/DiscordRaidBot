// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/roll/close.ts

import { ChatInputCommandInteraction } from 'discord.js';
import db from '../../database/db.js';
import { logger } from '../../utils/logger.js';
import { RollGeneratorService } from '../../services/rollGenerator/index.js';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    if (!interaction.guild || !interaction.guildId) {
      throw new Error('This command can only be used in a server');
    }

    const generatorId = interaction.options.getString('generator-id', true);

    // Get roll generator from database
    const rollGenerator = await db().rollGenerator.findUnique({
      where: { id: generatorId },
    });

    if (!rollGenerator) {
      return interaction.editReply({
        content: '❌ Roll generator not found.',
      });
    }

    if (rollGenerator.guildId !== interaction.guildId) {
      return interaction.editReply({
        content: '❌ This roll generator belongs to another server.',
      });
    }

    // Check permissions (must be creator, admin, or manager)
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const isCreator = rollGenerator.createdBy === interaction.user.id;
    const isAdmin = member.permissions.has('Administrator');
    
    const guild = await db().guild.findUnique({
      where: { id: interaction.guildId },
    });
    const isManager = guild?.managerRoleId && member.roles.cache.has(guild.managerRoleId);

    if (!isCreator && !isAdmin && !isManager) {
      return interaction.editReply({
        content: '❌ You can only close roll generators that you created, or you need to be an administrator/manager.',
      });
    }

    if (rollGenerator.status === 'closed') {
      return interaction.editReply({
        content: '⚠️ This roll generator is already closed.',
      });
    }

    // Close the roll generator
    const rollService = new RollGeneratorService(interaction.client);
    await rollService.closeRollGenerator(generatorId);

    logger.info({ rollGeneratorId: generatorId, closedBy: interaction.user.id }, 'Roll generator closed');

    await interaction.editReply({
      content: '✅ Roll generator closed successfully!',
    });

  } catch (error) {
    logger.error({ err: error, module: 'roll-close' }, 'Failed to close roll generator');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await interaction.editReply({
      content: `❌ Failed to close roll generator: ${errorMessage}`,
    });
  }
}
