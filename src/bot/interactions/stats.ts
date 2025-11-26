// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Statistics interaction handlers

import { ButtonInteraction } from 'discord.js';
import { getModuleLogger } from '../../utils/logger.js';
import getPrismaClient from '../../database/db.js';

const logger = getModuleLogger('stats-interactions');

export async function handleStatsViewPersonal(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const { createPersonalStatsEmbed } = await import('../../embeds/statsEmbed.js');
  const prisma = getPrismaClient();

  const guild = await prisma.guild.findUnique({
    where: { id: interaction.guildId },
  });

  if (!guild || !guild.statsEnabled) {
    await interaction.editReply('❌ Statistics system is not enabled on this server.');
    return;
  }

  const embed = await createPersonalStatsEmbed(interaction.user.id, interaction.guildId);
  await interaction.editReply({ embeds: [embed] });
}

export async function handleStatsRefresh(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    return;
  }

  await interaction.deferUpdate();

  const { createStatsEmbed } = await import('../../embeds/statsEmbed.js');
  const { recalculateRanks } = await import('../../services/statistics.js');

  await recalculateRanks(interaction.guildId);

  const { embed, components } = await createStatsEmbed(interaction.guildId, 10);
  
  await interaction.editReply({ embeds: [embed], components });
}
