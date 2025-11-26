// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Reminder settings

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { ValidationError } from '../../../utils/errors.js';

const logger = getModuleLogger('settings-reminders');

export async function handleReminders(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const intervalsString = interaction.options.getString('intervals', true);
  const prisma = getPrismaClient();

  // Parse and validate intervals
  const intervals = intervalsString.split(',').map(s => s.trim());
  
  if (intervals.length === 0) {
    throw new ValidationError('Provide at least one reminder interval');
  }

  // Validate each interval format
  const validIntervalRegex = /^\d+[smhd]$/;
  for (const interval of intervals) {
    if (!validIntervalRegex.test(interval)) {
      throw new ValidationError(
        `Invalid interval format: "${interval}". Use format like "1h", "30m", "15m"`
      );
    }
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      reminderIntervals: intervals,
    },
    update: {
      reminderIntervals: intervals,
    },
  });

  logger.info({ guildId, intervals }, 'Reminder intervals updated');

  await interaction.editReply(`✅ Reminder intervals set to: **${intervals.join(', ')}**`);
}
