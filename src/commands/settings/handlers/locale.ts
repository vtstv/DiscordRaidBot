// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Language and timezone settings

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { ValidationError } from '../../../utils/errors.js';
import { isValidTimezone } from '../../../utils/time.js';

const logger = getModuleLogger('settings-locale');

export async function handleLanguage(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const locale = interaction.options.getString('locale', true) as 'en' | 'ru' | 'de';
  const prisma = getPrismaClient();

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      locale,
    },
    update: {
      locale,
    },
  });

  const languageNames: Record<string, string> = {
    en: 'English',
    ru: 'Русский (Russian)',
    de: 'Deutsch (German)'
  };
  const languageName = languageNames[locale] || 'English';
  
  logger.info({ guildId, locale }, 'Guild language updated');

  await interaction.editReply(`✅ Language set to **${languageName}**`);
}

export async function handleTimezone(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const timezone = interaction.options.getString('timezone', true);
  const prisma = getPrismaClient();

  if (!isValidTimezone(timezone)) {
    throw new ValidationError(`Invalid timezone: ${timezone}. Use IANA format (e.g., America/New_York, Europe/London, UTC)`);
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      timezone,
    },
    update: { timezone },
  });

  logger.info({ guildId, timezone }, 'Timezone updated');

  await interaction.editReply(`✅ Server timezone set to **${timezone}**`);
}
