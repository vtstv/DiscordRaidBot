// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Locale menu - language and timezone selection

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

export async function showLocaleMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🌐 Language & Timezone Settings')
    .setDescription('Configure your server\'s language and timezone')
    .addFields(
      { name: 'Current Language', value: guild?.locale || 'en', inline: true },
      { name: 'Current Timezone', value: guild?.timezone || 'UTC', inline: true },
    );

  const languageRow = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_set_language')
        .setPlaceholder('Select language...')
        .addOptions([
          { label: 'English', value: 'en', emoji: '🇬🇧' },
          { label: 'Русский (Russian)', value: 'ru', emoji: '🇷🇺' },
          { label: 'Deutsch (German)', value: 'de', emoji: '🇩🇪' },
        ])
    );

  const timezoneRow = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_set_timezone')
        .setPlaceholder('Select timezone...')
        .addOptions([
          { label: 'UTC (GMT+0)', value: 'UTC' },
          { label: 'Europe/London (GMT+0)', value: 'Europe/London' },
          { label: 'Europe/Paris (GMT+1)', value: 'Europe/Paris' },
          { label: 'Europe/Berlin (GMT+1)', value: 'Europe/Berlin' },
          { label: 'Europe/Moscow (GMT+3)', value: 'Europe/Moscow' },
          { label: 'America/New_York (GMT-5)', value: 'America/New_York' },
          { label: 'America/Chicago (GMT-6)', value: 'America/Chicago' },
          { label: 'America/Los_Angeles (GMT-8)', value: 'America/Los_Angeles' },
          { label: 'Asia/Tokyo (GMT+9)', value: 'Asia/Tokyo' },
          { label: 'Asia/Shanghai (GMT+8)', value: 'Asia/Shanghai' },
        ])
    );

  const backRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_main')
        .setLabel('Back to Main Menu')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('◀️')
    );

  await interaction.update({ embeds: [embed], components: [languageRow, timezoneRow, backRow] });
}
