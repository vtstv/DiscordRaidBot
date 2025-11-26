// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/stats.ts
// Statistics commands

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import type { Command } from '../types/command.js';
import getPrismaClient from '../database/db.js';
import { createStatsEmbed, createPersonalStatsEmbed, createStatsSetupEmbed } from '../embeds/statsEmbed.js';
import { markNoShow } from '../services/statistics.js';
import { getModuleLogger } from '../utils/logger.js';

const logger = getModuleLogger('stats-commands');
const prisma = getPrismaClient();

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Participant statistics and leaderboard')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your personal statistics')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard')
        .setDescription('View server leaderboard')
        .addIntegerOption(option =>
          option
            .setName('top')
            .setDescription('Number of top participants to show')
            .setMinValue(5)
            .setMaxValue(25)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Configure statistics system (admin only)')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel for stats leaderboard')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('interval')
            .setDescription('Update interval')
            .addChoices(
              { name: 'Daily', value: 'daily' },
              { name: 'Weekly', value: 'weekly' },
              { name: 'Monthly', value: 'monthly' }
            )
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('auto_roles')
            .setDescription('Enable automatic role assignment for top participants')
            .setRequired(false)
        )
        .addRoleOption(option =>
          option
            .setName('top10_role')
            .setDescription('Role to assign to top 10 participants')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('min_events')
            .setDescription('Minimum events to qualify for leaderboard')
            .setMinValue(1)
            .setMaxValue(50)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('mark-noshow')
        .setDescription('Mark a participant as no-show (admin only)')
        .addStringOption(option =>
          option
            .setName('event_id')
            .setDescription('Event ID')
            .setRequired(true)
        )
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User who did not show up')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();

    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    try {
      switch (subcommand) {
        case 'view':
          await handleView(interaction);
          break;
        case 'leaderboard':
          await handleLeaderboard(interaction);
          break;
        case 'setup':
          await handleSetup(interaction);
          break;
        case 'mark-noshow':
          await handleMarkNoShow(interaction);
          break;
      }
    } catch (error) {
      logger.error({ error, subcommand }, 'Error executing stats command');
      const message = error instanceof Error ? error.message : 'An error occurred';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: `❌ ${message}`, ephemeral: true });
      } else {
        await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
      }
    }
  },
};

async function handleView(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guild = await prisma.guild.findUnique({
    where: { id: interaction.guildId! },
  });

  if (!guild || !guild.statsEnabled) {
    await interaction.editReply('❌ Statistics system is not enabled on this server.');
    return;
  }

  const embed = await createPersonalStatsEmbed(interaction.user.id, interaction.guildId!);
  await interaction.editReply({ embeds: [embed] });
}

async function handleLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guild = await prisma.guild.findUnique({
    where: { id: interaction.guildId! },
  });

  if (!guild || !guild.statsEnabled) {
    await interaction.editReply('❌ Statistics system is not enabled on this server.');
    return;
  }

  const topN = interaction.options.getInteger('top') || 10;
  const { embed, components } = await createStatsEmbed(interaction.guildId!, topN);
  
  await interaction.editReply({ embeds: [embed], components });
}

async function handleSetup(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member;
  if (!member || !('permissions' in member)) {
    await interaction.reply({ content: '❌ Could not verify permissions.', ephemeral: true });
    return;
  }

  if (typeof member.permissions === 'string' || !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ content: '❌ You need Manage Server permission to configure statistics.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const channelResolved = interaction.options.getChannel('channel', true);
  const interval = interaction.options.getString('interval') || 'daily';
  const autoRoles = interaction.options.getBoolean('auto_roles') ?? false;
  const top10Role = interaction.options.getRole('top10_role');
  const minEvents = interaction.options.getInteger('min_events') ?? 3;

  if (channelResolved.type !== ChannelType.GuildText) {
    await interaction.editReply('❌ Please select a text channel.');
    return;
  }

  // Fetch the actual channel to get full TextChannel type
  const channel = await interaction.guild!.channels.fetch(channelResolved.id);
  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    await interaction.editReply('❌ Could not access text channel.');
    return;
  }

  await prisma.guild.update({
    where: { id: interaction.guildId! },
    data: {
      statsEnabled: true,
      statsChannelId: channel.id,
      statsUpdateInterval: interval,
      statsAutoRoleEnabled: autoRoles,
      statsTop10RoleId: top10Role?.id || null,
      statsMinEvents: minEvents,
    },
  });

  // Create initial stats message
  const { embed, components } = await createStatsEmbed(interaction.guildId!, 10);
  const message = await channel.send({ embeds: [embed], components });

  // Save message ID
  await prisma.guild.update({
    where: { id: interaction.guildId! },
    data: {
      statsMessageId: message.id,
    },
  });

  const setupEmbed = createStatsSetupEmbed(
    channel.id,
    interval,
    autoRoles,
    top10Role?.id
  );

  await interaction.editReply({ embeds: [setupEmbed] });

  logger.info(
    {
      guildId: interaction.guildId,
      channelId: channel.id,
      interval,
      autoRoles,
    },
    'Statistics system configured'
  );
}

async function handleMarkNoShow(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member;
  if (!member || !('permissions' in member)) {
    await interaction.reply({ content: '❌ Could not verify permissions.', ephemeral: true });
    return;
  }

  if (typeof member.permissions === 'string' || !member.permissions.has(PermissionFlagsBits.ManageEvents)) {
    await interaction.reply({ content: '❌ You need Manage Events permission to mark no-shows.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const eventId = interaction.options.getString('event_id', true);
  const user = interaction.options.getUser('user', true);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    await interaction.editReply('❌ Event not found.');
    return;
  }

  if (event.guildId !== interaction.guildId) {
    await interaction.editReply('❌ Event does not belong to this server.');
    return;
  }

  if (event.status !== 'completed') {
    await interaction.editReply('❌ Event must be completed before marking no-shows.');
    return;
  }

  await markNoShow(eventId, user.id);

  await interaction.editReply(
    `✅ Marked ${user.tag} as no-show for event "${event.title}". Their statistics have been updated.`
  );

  logger.info(
    {
      eventId,
      userId: user.id,
      markedBy: interaction.user.id,
    },
    'User marked as no-show'
  );
}

export default command;
