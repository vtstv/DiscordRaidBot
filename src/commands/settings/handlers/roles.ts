// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Role and prefix settings

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';

const logger = getModuleLogger('settings-roles');

export async function handleManagerRole(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const role = interaction.options.getRole('role');
  const prisma = getPrismaClient();

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      managerRoleId: role?.id || null,
    },
    update: {
      managerRoleId: role?.id || null,
    },
  });

  logger.info({ guildId, managerRoleId: role?.id }, 'Manager role updated');

  if (role) {
    await interaction.editReply(`✅ Bot manager role set to ${role}\n\nUsers with this role can create events and templates.`);
  } else {
    await interaction.editReply('✅ Manager role cleared.\n\nOnly **Administrators** can manage the bot now.');
  }
}

export async function handlePrefix(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const prefix = interaction.options.getString('prefix');
  const prisma = getPrismaClient();

  if (!prefix) {
    // Show current prefix
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { commandPrefix: true },
    });

    const currentPrefix = guild?.commandPrefix || '!';
    await interaction.editReply(
      `**Current command prefix:** \`${currentPrefix}\`\n\n` +
      `**Usage:** \`/settings prefix <symbol>\`\n` +
      `**Examples:** \`$\`, \`#\`, \`!!\`, \`**\`\n\n` +
      `**Available commands:**\n` +
      `\`${currentPrefix}help\` - Show help\n` +
      `\`${currentPrefix}event list\` - List events\n` +
      `\`${currentPrefix}template list\` - List templates\n` +
      `\`${currentPrefix}settings\` - View settings`
    );
    return;
  }

  // Validate prefix
  if (!/^[!@#$%^&*\-_=+|\\:;]{1,3}$/.test(prefix)) {
    await interaction.editReply('❌ Prefix must be 1-3 special characters (e.g., !, $, #, **, etc.)');
    return;
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      commandPrefix: prefix,
    },
    update: {
      commandPrefix: prefix,
    },
  });

  logger.info({ guildId, prefix }, 'Command prefix updated');

  await interaction.editReply(
    `✅ Command prefix changed to: \`${prefix}\`\n\n` +
    `**You can now use:**\n` +
    `\`${prefix}help\` - Show help\n` +
    `\`${prefix}event list\` - List events\n` +
    `\`${prefix}template list\` - List templates\n` +
    `\`${prefix}settings\` - View settings`
  );
}
