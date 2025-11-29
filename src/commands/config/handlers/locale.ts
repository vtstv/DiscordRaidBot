// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Locale handlers - language and timezone

import { StringSelectMenuInteraction } from 'discord.js';
import getPrismaClient from '../../../database/db.js';

const prisma = getPrismaClient();

export async function handleLanguageSelect(interaction: StringSelectMenuInteraction, value: string): Promise<void> {
  await prisma.guild.upsert({
    where: { id: interaction.guild!.id },
    create: { id: interaction.guild!.id, name: interaction.guild!.name, locale: value },
    update: { locale: value },
  });
  
  // Show the locale menu again with updated values
  const { showLocaleMenu } = await import('../menus/locale.js');
  await showLocaleMenu(interaction);
}

export async function handleTimezoneSelect(interaction: StringSelectMenuInteraction, value: string): Promise<void> {
  await prisma.guild.upsert({
    where: { id: interaction.guild!.id },
    create: { id: interaction.guild!.id, name: interaction.guild!.name, timezone: value },
    update: { timezone: value },
  });
  
  // Show the locale menu again with updated values
  const { showLocaleMenu } = await import('../menus/locale.js');
  await showLocaleMenu(interaction);
}
