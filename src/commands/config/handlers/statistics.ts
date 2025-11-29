// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Statistics settings handlers

import {
  StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChannelSelectMenuInteraction,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';

const prisma = getPrismaClient();
const logger = getModuleLogger('config:statistics');

export async function handleStatisticsAction(
  interaction: StringSelectMenuInteraction,
  value: string
): Promise<void> {
  const guildId = interaction.guild!.id;

  switch (value) {
    case 'toggle_stats':
      await toggleStatistics(interaction);
      break;

    case 'stats_channel':
      await showStatsChannelSelect(interaction);
      break;

    case 'stats_interval':
      await showStatsIntervalSelect(interaction);
      break;

    case 'stats_min_events':
      await showMinEventsModal(interaction);
      break;

    case 'toggle_auto_role':
      await toggleAutoRole(interaction);
      break;

    case 'top10_role':
      await showTop10RoleSelect(interaction);
      break;

    default:
      await interaction.update({
        content: `Action "${value}" not implemented.`,
        components: [],
      });
  }
}

async function toggleStatistics(interaction: StringSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { statsEnabled: true },
  });

  const newValue = !(guild as any)?.statsEnabled;

  await prisma.guild.update({
    where: { id: guildId },
    data: { statsEnabled: newValue },
  });

  logger.info({ guildId, statsEnabled: newValue }, 'Statistics toggled');

  // Return to statistics menu
  const { showStatisticsMenu } = await import('../menus/others.js');
  await showStatisticsMenu(interaction);
}

async function showStatsChannelSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const selectRow = new ActionRowBuilder<ChannelSelectMenuBuilder>()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('config_set_stats_channel')
        .setPlaceholder('Select stats channel...')
        .setChannelTypes(ChannelType.GuildText)
        .setMaxValues(1)
    );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_statistics')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('◀')
    );

  await interaction.update({
    content: '📺 **Select Statistics Channel**\n\nLeaderboard will be posted here.',
    components: [selectRow, buttonRow],
    embeds: [],
  });
}

async function showStatsIntervalSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  await interaction.update({
    content: '⏰ **Select Update Interval**\n\nHow often should stats be updated?\n\nPlease use select menu above to choose interval.',
    components: [],
    embeds: [],
  });

  // Create a new StringSelectMenu
  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_set_stats_interval')
        .setPlaceholder('Select update interval...')
        .addOptions([
          { label: 'Daily', description: 'Update stats every day', value: 'daily', emoji: '📅' },
          { label: 'Weekly', description: 'Update stats every week', value: 'weekly', emoji: '📆' },
          { label: 'Monthly', description: 'Update stats every month', value: 'monthly', emoji: '🗓' },
        ])
    );

  await interaction.followUp({
    content: '⏰ **Select Update Interval**',
    components: [row],
    ephemeral: true,
  });
}

async function showMinEventsModal(interaction: StringSelectMenuInteraction): Promise<void> {
  const guild = await prisma.guild.findUnique({
    where: { id: interaction.guild!.id },
    select: { statsMinEvents: true },
  });

  const modal = new ModalBuilder()
    .setCustomId('config_modal_stats_min_events')
    .setTitle('Set Minimum Events')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('min_events')
          .setLabel('Minimum Events for Leaderboard')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g., 3')
          .setRequired(true)
          .setValue(((guild as any)?.statsMinEvents || 3).toString())
      )
    );

  await interaction.showModal(modal);
}

async function toggleAutoRole(interaction: StringSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { statsAutoRoleEnabled: true },
  });

  const newValue = !(guild as any)?.statsAutoRoleEnabled;

  await prisma.guild.update({
    where: { id: guildId },
    data: { statsAutoRoleEnabled: newValue },
  });

  logger.info({ guildId, statsAutoRoleEnabled: newValue }, 'Auto-role toggled');

  // Return to statistics menu
  const { showStatisticsMenu } = await import('../menus/others.js');
  await showStatisticsMenu(interaction);
}

async function showTop10RoleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const selectRow = new ActionRowBuilder<RoleSelectMenuBuilder>()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('config_set_top10_role')
        .setPlaceholder('Select top 10 role...')
        .setMaxValues(1)
    );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_statistics')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('◀')
    );

  await interaction.update({
    content: '👑 **Select Top 10 Role**\n\nThis role will be assigned to top 10 participants.',
    components: [selectRow, buttonRow],
    embeds: [],
  });
}

export async function handleStatsChannelSelect(interaction: ChannelSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const channelId = interaction.values[0];

  await prisma.guild.update({
    where: { id: guildId },
    data: { statsChannelId: channelId },
  });

  logger.info({ guildId, channelId }, 'Stats channel updated');

  // Return to statistics menu
  const { showStatisticsMenu } = await import('../menus/others.js');
  await showStatisticsMenu(interaction);
}

export async function handleStatsIntervalSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const interval = interaction.values[0];

  await prisma.guild.update({
    where: { id: guildId },
    data: { statsUpdateInterval: interval },
  });

  logger.info({ guildId, interval }, 'Stats interval updated');

  // Return to statistics menu
  const { showStatisticsMenu } = await import('../menus/others.js');
  await showStatisticsMenu(interaction);
}

export async function handleTop10RoleSelect(interaction: RoleSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const roleId = interaction.values[0];

  await prisma.guild.update({
    where: { id: guildId },
    data: { statsTop10RoleId: roleId },
  });

  logger.info({ guildId, roleId }, 'Top 10 role updated');

  // Return to statistics menu
  const { showStatisticsMenu } = await import('../menus/others.js');
  await showStatisticsMenu(interaction);
}

export async function handleStatisticsModal(interaction: ModalSubmitInteraction): Promise<void> {
  const guildId = interaction.guild!.id;

  if (interaction.customId === 'config_modal_stats_min_events') {
    const minEventsStr = interaction.fields.getTextInputValue('min_events').trim();
    const minEvents = parseInt(minEventsStr, 10);

    if (isNaN(minEvents) || minEvents < 1 || minEvents > 100) {
      await interaction.reply({
        content: '❌ Minimum events must be between 1 and 100.',
        ephemeral: true,
      });
      return;
    }

    await prisma.guild.update({
      where: { id: guildId },
      data: { statsMinEvents: minEvents },
    });

    logger.info({ guildId, minEvents }, 'Stats min events updated');

    // For modal submissions, just show success
    await interaction.reply({
      content: `✅ Minimum events set to ${minEvents}\n\nUse /config again to continue configuring.`,
      ephemeral: true,
    });
  }
}
