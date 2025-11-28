// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Other menus - automation, voice, channels, view all

import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuInteraction,
} from 'discord.js';
import getPrismaClient from '../../../database/db.js';

const prisma = getPrismaClient();

export async function showAutomationMenu(interaction: StringSelectMenuInteraction): Promise<void> {
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
          { label: 'Set Auto-delete Timer', description: 'Hours after archiving to delete', value: 'auto_delete', emoji: '🗑️' },
          { label: 'Set Log Retention', description: 'Days to keep audit logs', value: 'log_retention', emoji: '📋' },
        ])
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀️')
  );

  await interaction.update({ embeds: [embed], components: [row1, backRow] });
}

export async function showVoiceMenu(interaction: StringSelectMenuInteraction): Promise<void> {
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
          { label: 'Set Duration After Event', description: 'Minutes to keep channel after event', value: 'duration', emoji: '⏱️' },
          { label: 'Set Create Before Time', description: 'Minutes before event to create channel', value: 'create_before', emoji: '🕐' },
        ])
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀️')
  );

  await interaction.update({ embeds: [embed], components: [row1, backRow] });
}

export async function showChannelsMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📋 Channel Settings')
    .setDescription('Configure log and archive channels')
    .addFields(
      { name: 'Log Channel', value: guild?.logChannelId ? `<#${guild.logChannelId}>` : 'Not set', inline: true },
      { name: 'Archive Channel', value: guild?.archiveChannelId ? `<#${guild.archiveChannelId}>` : 'Not set', inline: true },
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_channels_action')
        .setPlaceholder('Select channel to configure...')
        .addOptions([
          { label: 'Set Log Channel', description: 'Channel for audit logs', value: 'log', emoji: '📝' },
          { label: 'Set Archive Channel', description: 'Channel for archived events', value: 'archive', emoji: '📦' },
        ])
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀️')
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
    new ButtonBuilder().setCustomId('config_back_main').setLabel('Back to Main Menu').setStyle(ButtonStyle.Secondary).setEmoji('◀️')
  );

  await interaction.update({ embeds: [embed], components: [backRow] });
}
