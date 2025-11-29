// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Other menus - automation, voice, channels, view all

import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuInteraction,
  MessageComponentInteraction,
} from 'discord.js';
import getPrismaClient from '../../../database/db.js';

const prisma = getPrismaClient();

export async function showAutomationMenu(interaction: StringSelectMenuInteraction | MessageComponentInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('⏰ Automation Settings')
    .setDescription('Configure automatic features')
    .addFields(
      { name: 'Reminder Intervals', value: (guild?.reminderIntervals || ['1h', '15m']).join(', '), inline: false },
      { name: 'DM Reminders', value: (guild as any)?.dmRemindersEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'Auto-delete (hours)', value: guild?.autoDeleteHours?.toString() || 'Disabled', inline: true },
      { name: 'Log Retention (days)', value: (guild as any)?.logRetentionDays?.toString() || 'Forever', inline: true },
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_automation_action')
        .setPlaceholder('Select setting to configure...')
        .addOptions([
          { label: 'Set Reminder Intervals', description: 'e.g., 1h, 30m, 15m', value: 'reminders', emoji: '⏰' },
          { label: 'Toggle DM Reminders', description: 'Send DM to confirmed participants', value: 'dm_reminders', emoji: '📬' },
          { label: 'Set Auto-delete Timer', description: 'Hours after archiving to delete', value: 'auto_delete', emoji: '🗑' },
          { label: 'Set Log Retention', description: 'Days to keep audit logs', value: 'log_retention', emoji: '📋' },
        ])
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀')
  );

  await interaction.update({ embeds: [embed], components: [row1, backRow] });
}

export async function showVoiceMenu(interaction: StringSelectMenuInteraction | MessageComponentInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const categoryId = (guild as any)?.voiceChannelCategoryId;
  const categoryText = categoryId ? `<#${categoryId}>` : 'Not set';

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🔊 Voice Channel Settings')
    .setDescription('Configure automatic voice channel creation for events')
    .addFields(
      { name: 'Category', value: categoryText, inline: false },
      { name: 'Duration (after event)', value: `${(guild as any)?.voiceChannelDuration || 120} minutes`, inline: true },
      { name: 'Create Before Event', value: `${(guild as any)?.voiceChannelCreateBefore || 60} minutes`, inline: true },
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_voice_action')
        .setPlaceholder('Select setting to configure...')
        .addOptions([
          { label: 'Set Voice Category', description: 'Category for temporary voice channels', value: 'category', emoji: '📁' },
          { label: 'Set Duration After Event', description: 'Minutes to keep channel after event', value: 'duration', emoji: '⏱' },
          { label: 'Set Create Before Time', description: 'Minutes before event to create channel', value: 'create_before', emoji: '🕐' },
        ])
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀')
  );

  await interaction.update({ embeds: [embed], components: [row1, backRow] });
}

export async function showChannelsMenu(interaction: StringSelectMenuInteraction | MessageComponentInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📋 Channel Settings')
    .setDescription('Configure channels for various bot features')
    .addFields(
      { name: 'Log Channel', value: guild?.logChannelId ? `<#${guild.logChannelId}>` : 'Not set', inline: true },
      { name: 'Archive Channel', value: guild?.archiveChannelId ? `<#${guild.archiveChannelId}>` : 'Not set', inline: true },
      { name: 'Thread Channels', value: guild?.threadChannels && guild.threadChannels.length > 0 ? guild.threadChannels.map(id => `<#${id}>`).join(', ') : 'None', inline: false },
      { name: 'Note Channels', value: (guild as any)?.noteChannels && (guild as any).noteChannels.length > 0 ? (guild as any).noteChannels.map((id: string) => `<#${id}>`).join(', ') : 'All channels', inline: false },
      { name: 'Approval Channels', value: guild?.approvalChannels && guild.approvalChannels.length > 0 ? guild.approvalChannels.map(id => `<#${id}>`).join(', ') : 'None', inline: false },
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_channels_action')
        .setPlaceholder('Select channel to configure...')
        .addOptions([
          { label: 'Set Log Channel', description: 'Channel for audit logs', value: 'log', emoji: '📝' },
          { label: 'Set Archive Channel', description: 'Channel for archived events', value: 'archive', emoji: '📦' },
          { label: 'Manage Thread Channels', description: 'Auto-create threads in these channels', value: 'thread', emoji: '🧵' },
          { label: 'Manage Note Channels', description: 'Allow participant notes in these channels', value: 'note', emoji: '📝' },
          { label: 'Manage Approval Channels', description: 'Require approval in these channels', value: 'approval', emoji: '✅' },
        ])
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀')
  );

  await interaction.update({ embeds: [embed], components: [row1, backRow] });
}

export async function showViewAll(interaction: StringSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  if (!guild) {
    await interaction.update({ content: 'No settings configured yet.', embeds: [], components: [] });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('📄 All Server Settings')
    .setDescription('Current configuration overview')
    .addFields(
      { name: '🌐 Language', value: guild.locale || 'en', inline: true },
      { name: '🌍 Timezone', value: guild.timezone || 'UTC', inline: true },
      { name: '⏰ Reminders', value: guild.reminderIntervals.join(', '), inline: true },
      { name: '📬 DM Reminders', value: (guild as any).dmRemindersEnabled ? '✅ On' : '❌ Off', inline: true },
      { name: '🗑️ Auto-delete', value: guild.autoDeleteHours ? `${guild.autoDeleteHours}h` : '❌ Off', inline: true },
      { name: '📋 Log Retention', value: (guild as any).logRetentionDays ? `${(guild as any).logRetentionDays}d` : '♾️ Forever', inline: true },
      { name: '📝 Log Channel', value: guild.logChannelId ? `<#${guild.logChannelId}>` : 'Not set', inline: true },
      { name: '📦 Archive Channel', value: guild.archiveChannelId ? `<#${guild.archiveChannelId}>` : 'Not set', inline: true },
      { name: '🔊 Voice Category', value: (guild as any).voiceChannelCategoryId ? `<#${(guild as any).voiceChannelCategoryId}>` : 'Not set', inline: true },
      { name: '⏱️ Voice Duration', value: `${(guild as any).voiceChannelDuration || 120}m`, inline: true },
      { name: '🕐 Voice Create Before', value: `${(guild as any).voiceChannelCreateBefore || 60}m`, inline: true },
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀')
  );

  await interaction.update({ embeds: [embed], components: [backRow] });
}

export async function showPermissionsMenu(interaction: StringSelectMenuInteraction | MessageComponentInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('👥 Permission Settings')
    .setDescription('Configure manager roles and dashboard access')
    .addFields(
      { name: 'Manager Role', value: guild?.managerRoleId ? `<@&${guild.managerRoleId}>` : 'Not set (Admins only)', inline: false },
      { name: 'Dashboard Roles', value: guild?.dashboardRoles?.length ? guild.dashboardRoles.map(id => `<@&${id}>`).join(', ') : 'Managers only', inline: false },
      { name: 'Command Prefix', value: guild?.commandPrefix || '!', inline: true },
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_permissions_action')
        .setPlaceholder('Select setting to configure...')
        .addOptions([
          { label: 'Set Manager Role', description: 'Role that can manage events', value: 'manager_role', emoji: '👑' },
          { label: 'Set Dashboard Roles', description: 'Roles allowed web dashboard access', value: 'dashboard_roles', emoji: '🌐' },
          { label: 'Set Command Prefix', description: 'Prefix for text commands', value: 'command_prefix', emoji: '⚙️' },
        ])
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀')
  );

  await interaction.update({ embeds: [embed], components: [row1, backRow] });
}

export async function showStatisticsMenu(interaction: StringSelectMenuInteraction | MessageComponentInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📊 Statistics Settings')
    .setDescription('Configure participant leaderboards and auto-roles')
    .addFields(
      { name: 'Statistics Enabled', value: (guild as any)?.statsEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'Update Interval', value: (guild as any)?.statsUpdateInterval || 'daily', inline: true },
      { name: 'Minimum Events', value: ((guild as any)?.statsMinEvents || 3).toString(), inline: true },
      { name: 'Stats Channel', value: (guild as any)?.statsChannelId ? `<#${(guild as any).statsChannelId}>` : 'Not set', inline: true },
      { name: 'Auto-role', value: (guild as any)?.statsAutoRoleEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'Top 10 Role', value: (guild as any)?.statsTop10RoleId ? `<@&${(guild as any).statsTop10RoleId}>` : 'Not set', inline: true },
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_statistics_action')
        .setPlaceholder('Select setting to configure...')
        .addOptions([
          { label: 'Toggle Statistics', description: 'Enable/disable leaderboards', value: 'toggle_stats', emoji: '📊' },
          { label: 'Set Stats Channel', description: 'Channel for leaderboard embed', value: 'stats_channel', emoji: '📺' },
          { label: 'Set Update Interval', description: 'daily, weekly, or monthly', value: 'stats_interval', emoji: '⏰' },
          { label: 'Set Minimum Events', description: 'Events required for leaderboard', value: 'stats_min_events', emoji: '🎯' },
          { label: 'Toggle Auto-role', description: 'Auto-assign role to top 10', value: 'toggle_auto_role', emoji: '🏆' },
          { label: 'Set Top 10 Role', description: 'Role for top 10 participants', value: 'top10_role', emoji: '👑' },
        ])
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀')
  );

  await interaction.update({ embeds: [embed], components: [row1, backRow] });
}

/**
 * Show Notes submenu
 */
export async function showNotesMenu(interaction: StringSelectMenuInteraction | MessageComponentInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📝 Participant Notes Settings')
    .setDescription('Configure participant notes and view online button')
    .addFields(
      { 
        name: 'Allow Participant Notes', 
        value: guild?.allowParticipantNotes ? '✅ Enabled' : '❌ Disabled', 
        inline: true 
      },
      { 
        name: 'Max Note Length', 
        value: `${(guild as any)?.participantNoteMaxLength || 30} characters`, 
        inline: true 
      },
      { 
        name: 'Show View Online Button', 
        value: (guild as any)?.showViewOnlineButton !== false ? '✅ Enabled' : '❌ Disabled', 
        inline: true 
      },
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_notes_action')
        .setPlaceholder('Choose a setting to configure...')
        .addOptions([
          { label: 'Toggle Participant Notes', description: 'Enable/disable participant notes', value: 'toggle_notes', emoji: '📝' },
          { label: 'Set Max Note Length', description: 'Maximum characters for notes', value: 'note_length', emoji: '📏' },
          { label: 'Toggle View Online Button', description: 'Show/hide view online button', value: 'toggle_view_online', emoji: '🔗' },
        ])
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀')
  );

  await interaction.update({ embeds: [embed], components: [row1, backRow] });
}
