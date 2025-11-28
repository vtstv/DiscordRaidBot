// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Locale handlers - language and timezone

import { StringSelectMenuInteraction } from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { showLocaleMenu } from '../menus/locale.js';

const prisma = getPrismaClient();

export async function handleLanguageSelect(interaction: StringSelectMenuInteraction, value: string): Promise<void> {
  await prisma.guild.upsert({
    where: { id: interaction.guild!.id },
    create: { id: interaction.guild!.id, name: interaction.guild!.name, locale: value },
    update: { locale: value },
  });
  await interaction.reply({ content: `✅ Language set to **${value}**`, ephemeral: true });
  await showLocaleMenu(interaction);
}

export async function handleTimezoneSelect(interaction: StringSelectMenuInteraction, value: string): Promise<void> {
  await prisma.guild.upsert({
    where: { id: interaction.guild!.id },
    create: { id: interaction.guild!.id, name: interaction.guild!.name, timezone: value },
    update: { timezone: value },
  });
  await interaction.reply({ content: `✅ Timezone set to **${value}**`, ephemeral: true });
  await showLocaleMenu(interaction);
}
