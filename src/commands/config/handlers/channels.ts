// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Channels handlers

import { 
  StringSelectMenuInteraction, 
  ChannelSelectMenuBuilder, 
  ActionRowBuilder, 
  ChannelType,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import getPrismaClient from '../../../database/db.js';

const prisma = getPrismaClient();

export async function handleChannelsAction(
  interaction: StringSelectMenuInteraction, 
  value: string
): Promise<void> {
  // Handle multi-channel types (thread, note, approval)
  if (value === 'thread' || value === 'note' || value === 'approval') {
    const guildId = interaction.guild!.id;
    const guild = await prisma.guild.findUnique({ where: { id: guildId } });
    
    const currentChannels = value === 'thread' 
      ? guild?.threadChannels || []
      : value === 'note'
      ? (guild as any)?.noteChannels || []
      : guild?.approvalChannels || [];

    const descriptions: Record<string, string> = {
      thread: 'Channels where threads will be auto-created for events',
      note: 'Channels where participant notes are allowed',
      approval: 'Channels where events require approval'
    };

    const selectRow = new ActionRowBuilder<ChannelSelectMenuBuilder>()
      .addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`config_set_channels_${value}`) // plural
          .setPlaceholder(`Select channels (${currentChannels.length} selected)...`)
          .setChannelTypes([ChannelType.GuildText])
          .setMinValues(0)  // Allow clearing
          .setMaxValues(25) // Discord limit
      );

    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_back_channels')
          .setLabel('Back')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('◀')
      );

    await interaction.update({
      content: `**${descriptions[value]}**\n\nSelect multiple channels or clear all to disable:`,
      components: [selectRow, buttonRow],
      embeds: [],
    });
    return;
  }

  // Handle single-channel types (log, archive)
  const placeholder = value === 'log' 
    ? 'Select channel for audit logs...' 
    : 'Select channel for archived events...';

  const selectRow = new ActionRowBuilder<ChannelSelectMenuBuilder>()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`config_set_channel_${value}`)
        .setPlaceholder(placeholder)
        .setChannelTypes([ChannelType.GuildText])
    );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_channels')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('◀')
    );

  await interaction.update({
    content: `Select a text channel for ${value === 'log' ? 'audit logs' : 'archived events'}:`,
    components: [selectRow, buttonRow],
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

  // Return to channels menu with updated values
  const { showChannelsMenu } = await import('../menus/others.js');
  await showChannelsMenu(interaction);
}

export async function handleMultiChannelSelect(
  interaction: any, // ChannelSelectMenuInteraction
  channelType: string // 'thread', 'note', or 'approval'
): Promise<void> {
  const channelIds = interaction.values; // Array of channel IDs
  const guildId = interaction.guild!.id;

  const field = channelType === 'thread' 
    ? 'threadChannels'
    : channelType === 'note'
    ? 'noteChannels'
    : 'approvalChannels';

  await prisma.guild.upsert({
    where: { id: guildId },
    create: { 
      id: guildId, 
      name: interaction.guild!.name, 
      [field]: channelIds 
    },
    update: { [field]: channelIds },
  });

  // Return to channels menu with updated values
  const { showChannelsMenu } = await import('../menus/others.js');
  await showChannelsMenu(interaction);
}
