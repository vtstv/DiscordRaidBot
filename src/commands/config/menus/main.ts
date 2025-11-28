// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Main menu for config command

import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';
import getPrismaClient from '../../../database/db.js';

const prisma = getPrismaClient();

export async function showMainMenu(interaction: ChatInputCommandInteraction | StringSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('⚙️ Server Configuration')
    .setDescription('**Interactive Settings Menu** (Beta)\n\nSelect a category below to configure:')
    .addFields(
      { name: '🌐 Language & Timezone', value: `Current: ${guild?.locale || 'en'} / ${guild?.timezone || 'UTC'}`, inline: true },
      { name: '⏰ Automation', value: 'Reminders, Auto-delete, DM', inline: true },
      { name: '📋 Channels', value: 'Log, Archive channels', inline: true },
      { name: '🔊 Voice Channels', value: 'Auto-create voice channels', inline: true },
      { name: '👥 Permissions', value: 'Manager role, Dashboard access', inline: true },
      { name: '📊 Statistics', value: 'Leaderboards, Auto-roles', inline: true },
    )
    .setFooter({ text: 'Use /settings for traditional command-based configuration' });

  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_main_menu')
        .setPlaceholder('Select a configuration category...')
        .addOptions([
          {
            label: 'Language & Timezone',
            description: 'Set server language and timezone',
            value: 'locale',
            emoji: '🌐',
          },
          {
            label: 'Automation Settings',
            description: 'Reminders, auto-delete, DM notifications',
            value: 'automation',
            emoji: '⏰',
          },
          {
            label: 'Channel Settings',
            description: 'Configure log and archive channels',
            value: 'channels',
            emoji: '📋',
          },
          {
            label: 'Voice Channel Settings',
            description: 'Auto-create temporary voice channels',
            value: 'voice',
            emoji: '🔊',
          },
          {
            label: 'Permission Settings',
            description: 'Manager roles and dashboard access',
            value: 'permissions',
            emoji: '👥',
          },
          {
            label: 'Statistics Settings',
            description: 'Leaderboards and participant stats',
            value: 'statistics',
            emoji: '📊',
          },
          {
            label: '📄 View All Settings',
            description: 'Show current configuration',
            value: 'view_all',
            emoji: '📄',
          },
        ])
    );

  const backButton = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_close')
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

  if (interaction.isCommand()) {
    await interaction.reply({ embeds: [embed], components: [row, backButton], ephemeral: true });
  } else {
    await interaction.update({ embeds: [embed], components: [row, backButton] });
  }
}
