// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Voice channel settings handlers for /config

import { StringSelectMenuInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { showVoiceMenu } from '../menus/others.js';

const logger = getModuleLogger('config:voice');
const prisma = getPrismaClient();

export async function handleVoiceAction(interaction: StringSelectMenuInteraction, value: string): Promise<void> {
  const guildId = interaction.guild!.id;

  if (value === 'category') {
    // Show channel select menu for category selection
    const row = new ActionRowBuilder<ChannelSelectMenuBuilder>()
      .addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId('config_select_voice_category')
          .setPlaceholder('Select a category for voice channels...')
          .addChannelTypes(ChannelType.GuildCategory)
      );

    await interaction.update({
      content: '📁 **Select Voice Category**\n\nChoose a Discord category where temporary voice channels will be created:',
      embeds: [],
      components: [row],
    });
  } else if (value === 'duration') {
    // Show modal for duration input
    const modal = new ModalBuilder()
      .setCustomId('config_modal_voice_duration')
      .setTitle('Voice Channel Duration');

    const input = new TextInputBuilder()
      .setCustomId('duration')
      .setLabel('Minutes to keep channel AFTER event ends')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('120')
      .setMinLength(1)
      .setMaxLength(5)
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } else if (value === 'create_before') {
    // Show modal for create before input
    const modal = new ModalBuilder()
      .setCustomId('config_modal_voice_create_before')
      .setTitle('Voice Channel Creation Time');

    const input = new TextInputBuilder()
      .setCustomId('create_before')
      .setLabel('Minutes BEFORE event to create channel')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('60')
      .setMinLength(1)
      .setMaxLength(5)
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    modal.addComponents(row);

    await interaction.showModal(modal);
  }
}

export async function handleVoiceCategory(interaction: any): Promise<void> {
  const guildId = interaction.guild!.id;
  const categoryId = interaction.values[0];

  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild!.name, voiceChannelCategoryId: categoryId },
    update: { voiceChannelCategoryId: categoryId },
  });

  logger.info({ guildId, categoryId }, 'Voice channel category updated');

  // Return to voice menu
  await showVoiceMenu(interaction);
}

export async function handleVoiceDuration(interaction: any): Promise<void> {
  const guildId = interaction.guild!.id;
  const durationStr = interaction.fields.getTextInputValue('duration');
  const duration = parseInt(durationStr, 10);

  if (isNaN(duration) || duration < 0 || duration > 10080) {
    await interaction.reply({
      content: '❌ Invalid duration. Must be between 0 and 10080 minutes (7 days).',
      ephemeral: true,
    });
    return;
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild!.name, voiceChannelDuration: duration },
    update: { voiceChannelDuration: duration },
  });

  logger.info({ guildId, duration }, 'Voice channel duration updated');

  await interaction.reply({
    content: `✅ Voice channel duration set to **${duration} minutes** after event ends.`,
    ephemeral: true,
  });
}

export async function handleVoiceCreateBefore(interaction: any): Promise<void> {
  const guildId = interaction.guild!.id;
  const createBeforeStr = interaction.fields.getTextInputValue('create_before');
  const createBefore = parseInt(createBeforeStr, 10);

  if (isNaN(createBefore) || createBefore < 5 || createBefore > 1440) {
    await interaction.reply({
      content: '❌ Invalid time. Must be between 5 and 1440 minutes (24 hours).',
      ephemeral: true,
    });
    return;
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild!.name, voiceChannelCreateBefore: createBefore },
    update: { voiceChannelCreateBefore: createBefore },
  });

  logger.info({ guildId, createBefore }, 'Voice channel create before time updated');

  await interaction.reply({
    content: `✅ Voice channels will be created **${createBefore} minutes** before event starts.`,
    ephemeral: true,
  });
}
