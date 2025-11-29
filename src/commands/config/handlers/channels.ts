// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Channels handlers

import { 
  StringSelectMenuInteraction, 
  ChannelSelectMenuBuilder, 
  ActionRowBuilder, 
  ChannelType 
} from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { showChannelsMenu } from '../menus/others.js';

const prisma = getPrismaClient();

export async function handleChannelsAction(
  interaction: StringSelectMenuInteraction, 
  value: string
): Promise<void> {
  const placeholder = value === 'log' 
    ? 'Select channel for audit logs...' 
    : 'Select channel for archived events...';

  const row = new ActionRowBuilder<ChannelSelectMenuBuilder>()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`config_set_channel_${value}`)
        .setPlaceholder(placeholder)
        .setChannelTypes([ChannelType.GuildText])
    );

  await interaction.update({
    content: `Select a text channel for ${value === 'log' ? 'audit logs' : 'archived events'}:`,
    components: [row],
    embeds: [],
  });
}

export async function handleChannelSelect(
  interaction: any, // ChannelSelectMenuInteraction
  channelType: string
): Promise<void> {
  const channelId = interaction.values[0];
  const guildId = interaction.guild!.id;

  const field = channelType === 'log' ? 'logChannelId' : 'archiveChannelId';

  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild!.name, [field]: channelId },
    update: { [field]: channelId },
  });

  await interaction.reply({
    content: `✅ ${channelType === 'log' ? 'Log' : 'Archive'} channel set to <#${channelId}>`,
    ephemeral: true,
  });

  await showChannelsMenu(interaction);
}
