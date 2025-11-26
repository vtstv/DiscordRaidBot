// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Channel settings (log, archive)

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';

const logger = getModuleLogger('settings-channels');

export async function handleLogChannel(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const channel = interaction.options.getChannel('channel');
  const prisma = getPrismaClient();

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      logChannelId: channel?.id || null,
    },
    update: {
      logChannelId: channel?.id || null,
    },
  });

  logger.info({ guildId, logChannelId: channel?.id }, 'Log channel updated');

  if (channel) {
    await interaction.editReply(`✅ Audit log channel set to ${channel}`);
  } else {
    await interaction.editReply('✅ Audit log channel disabled');
  }
}

export async function handleArchiveChannel(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const channel = interaction.options.getChannel('channel');
  const prisma = getPrismaClient();

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      archiveChannelId: channel?.id || null,
    },
    update: {
      archiveChannelId: channel?.id || null,
    },
  });

  logger.info({ guildId, archiveChannelId: channel?.id }, 'Archive channel updated');

  if (channel) {
    await interaction.editReply(`✅ Archive channel set to ${channel}`);
  } else {
    await interaction.editReply('✅ Archive channel disabled');
  }
}
