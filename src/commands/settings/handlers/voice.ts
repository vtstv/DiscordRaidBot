// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Voice channel settings handlers

import { ChatInputCommandInteraction, ChannelType } from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { ValidationError } from '../../../utils/errors.js';

const logger = getModuleLogger('settings-voice');

export async function handleVoiceCategory(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const category = interaction.options.getChannel('category');
  const prisma = getPrismaClient();

  if (!category) {
    // Show current category
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { voiceChannelCategoryId: true },
    });

    const currentCategory = guild?.voiceChannelCategoryId 
      ? `<#${guild.voiceChannelCategoryId}>` 
      : 'Not set';

    await interaction.editReply(
      `**Voice Channel Category**\n\n` +
      `Current category: ${currentCategory}\n\n` +
      `Use \`/settings voice-category category:<category>\` to set a category.`
    );
    return;
  }

  if (category.type !== ChannelType.GuildCategory) {
    throw new ValidationError('Please select a category, not a channel');
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      voiceChannelCategoryId: category.id,
    },
    update: {
      voiceChannelCategoryId: category.id,
    },
  });

  logger.info({ guildId, categoryId: category.id }, 'Voice channel category updated');

  await interaction.editReply(
    `✅ Voice channel category set to **${category.name}**\n\n` +
    `Temporary voice channels for events will be created in this category.`
  );
}

export async function handleVoiceDuration(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const minutes = interaction.options.getInteger('minutes', true);
  const prisma = getPrismaClient();

  if (minutes < 0 || minutes > 1440) {
    throw new ValidationError('Duration must be between 0 and 1440 minutes (24 hours)');
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      voiceChannelDuration: minutes,
    },
    update: {
      voiceChannelDuration: minutes,
    },
  });

  logger.info({ guildId, minutes }, 'Voice channel duration updated');

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const timeStr = hours > 0 
    ? `${hours} hour${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} min` : ''}`.trim()
    : `${mins} minute${mins > 1 ? 's' : ''}`;

  await interaction.editReply(
    `✅ Voice channel duration set to **${timeStr}** after event ends\n\n` +
    `Voice channels will be automatically deleted ${timeStr} after the event finishes.`
  );
}

export async function handleVoiceCreateBefore(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const minutes = interaction.options.getInteger('minutes', true);
  const prisma = getPrismaClient();

  if (minutes < 0 || minutes > 1440) {
    throw new ValidationError('Time must be between 0 and 1440 minutes (24 hours)');
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      voiceChannelCreateBefore: minutes,
    },
    update: {
      voiceChannelCreateBefore: minutes,
    },
  });

  logger.info({ guildId, minutes }, 'Voice channel create-before time updated');

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const timeStr = hours > 0 
    ? `${hours} hour${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} min` : ''}`.trim()
    : `${mins} minute${mins > 1 ? 's' : ''}`;

  await interaction.editReply(
    `✅ Voice channels will be created **${timeStr}** before event starts\n\n` +
    `This gives participants time to join the voice channel before the event begins.`
  );
}
