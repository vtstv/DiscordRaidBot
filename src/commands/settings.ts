// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/settings.ts
// Guild settings management (timezone, log channel, archive channel, etc.)

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';
import { CommandError, ValidationError } from '../utils/errors.js';
import { isValidTimezone } from '../utils/time.js';
import type { Command } from '../types/command.js';

const logger = getModuleLogger('settings-command');
const prisma = getPrismaClient();

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Manage server settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current server settings')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('language')
        .setDescription('Set the bot language for this server')
        .addStringOption(option =>
          option
            .setName('locale')
            .setDescription('Language to use')
            .setRequired(true)
            .addChoices(
              { name: 'English', value: 'en' },
              { name: 'Русский (Russian)', value: 'ru' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('timezone')
        .setDescription('Set the server timezone')
        .addStringOption(option =>
          option
            .setName('timezone')
            .setDescription('IANA timezone (e.g., America/New_York, Europe/London)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('log-channel')
        .setDescription('Set the audit log channel')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel for audit logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('archive-channel')
        .setDescription('Set the archive channel for completed events')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel for archived events')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reminders')
        .setDescription('Set reminder intervals')
        .addStringOption(option =>
          option
            .setName('intervals')
            .setDescription('Comma-separated intervals (e.g., "1h,30m,15m")')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('manager-role')
        .setDescription('Set role that can manage bot (create events, templates)')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Manager role (leave empty to require Administrator)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('approval-channels')
        .setDescription('Manage channels that require participant approval')
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Add or remove channel')
            .setRequired(true)
            .addChoices(
              { name: 'Add', value: 'add' },
              { name: 'Remove', value: 'remove' },
              { name: 'List', value: 'list' },
              { name: 'Clear', value: 'clear' }
            )
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to add/remove')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      throw new CommandError('This command can only be used in a server');
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'view':
        await handleView(interaction);
        break;
      case 'language':
        await handleLanguage(interaction);
        break;
      case 'manager-role':
        await handleManagerRole(interaction);
        break;
      case 'approval-channels':
        await handleApprovalChannels(interaction);
        break;
      case 'timezone':
        await handleTimezone(interaction);
        break;
      case 'log-channel':
        await handleLogChannel(interaction);
        break;
      case 'archive-channel':
        await handleArchiveChannel(interaction);
        break;
      case 'reminders':
        await handleReminders(interaction);
        break;
    }
  },
};

async function handleView(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;

  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
  });

  if (!guild) {
    await interaction.editReply('No settings configured yet. Settings will be created when you create your first event.');
    return;
  }

  const logChannel = guild.logChannelId ? `<#${guild.logChannelId}>` : 'Not set';
  const archiveChannel = guild.archiveChannelId ? `<#${guild.archiveChannelId}>` : 'Not set';
  const reminders = guild.reminderIntervals.join(', ');
  const locale = guild.locale || 'en';
  const languageName = locale === 'ru' ? 'Русский (Russian)' : 'English';

  await interaction.editReply(
    `**Server Settings**\n\n` +
    `🌐 **Language:** ${languageName}\n` +
    `🌍 **Timezone:** ${guild.timezone}\n` +
    `📋 **Log Channel:** ${logChannel}\n` +
    `📦 **Archive Channel:** ${archiveChannel}\n` +
    `⏰ **Reminder Intervals:** ${reminders}`
  );
}

async function handleLanguage(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const locale = interaction.options.getString('locale', true) as 'en' | 'ru';

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

  const languageName = locale === 'ru' ? 'Русский (Russian)' : 'English';
  
  logger.info({ guildId, locale }, 'Guild language updated');

  await interaction.editReply(`✅ Language set to **${languageName}**`);
}

async function handleTimezone(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const timezone = interaction.options.getString('timezone', true);

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

async function handleLogChannel(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const channel = interaction.options.getChannel('channel');

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      logChannelId: channel?.id || null,
    },
    update: {
      logChannelId: channel?.id || null,
    },
  });

  logger.info({ guildId, logChannelId: channel?.id }, 'Log channel updated');

  if (channel) {
    await interaction.editReply(`✅ Audit log channel set to ${channel}`);
  } else {
    await interaction.editReply('✅ Audit log channel disabled');
  }
}

async function handleArchiveChannel(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const channel = interaction.options.getChannel('channel');

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      archiveChannelId: channel?.id || null,
    },
    update: {
      archiveChannelId: channel?.id || null,
    },
  });

  logger.info({ guildId, archiveChannelId: channel?.id }, 'Archive channel updated');

  if (channel) {
    await interaction.editReply(`✅ Archive channel set to ${channel}`);
  } else {
    await interaction.editReply('✅ Archive channel disabled');
  }
}

async function handleReminders(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const intervalsString = interaction.options.getString('intervals', true);

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

async function handleManagerRole(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const role = interaction.options.getRole('role');

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
    await interaction.editReply(`✅ Bot manager role set to ${role}\\n\\nUsers with this role can create events and templates.`);
  } else {
    await interaction.editReply('✅ Manager role cleared.\\n\\nOnly **Administrators** can manage the bot now.');
  }
}

async function handleApprovalChannels(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const action = interaction.options.getString('action', true);
  const channel = interaction.options.getChannel('channel');

  // Get current guild settings
  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { approvalChannels: true },
  });

  let currentChannels = guild?.approvalChannels || [];

  switch (action) {
    case 'add':
      if (!channel) {
        throw new ValidationError('Please specify a channel to add');
      }
      if (currentChannels.includes(channel.id)) {
        await interaction.editReply(`❌ Channel ${channel} is already in the approval list.`);
        return;
      }
      currentChannels.push(channel.id);
      await prisma.guild.upsert({
        where: { id: guildId },
        create: {
          id: guildId,
          name: interaction.guild!.name,
          approvalChannels: currentChannels,
        },
        update: {
          approvalChannels: currentChannels,
        },
      });
      logger.info({ guildId, channelId: channel.id }, 'Approval channel added');
      await interaction.editReply(
        `✅ Approval required for ${channel}\\n\\n` +
        `Events posted in this channel will require creator approval before participants are confirmed.`
      );
      break;

    case 'remove':
      if (!channel) {
        throw new ValidationError('Please specify a channel to remove');
      }
      if (!currentChannels.includes(channel.id)) {
        await interaction.editReply(`❌ Channel ${channel} is not in the approval list.`);
        return;
      }
      currentChannels = currentChannels.filter((id: string) => id !== channel.id);
      await prisma.guild.update({
        where: { id: guildId },
        data: { approvalChannels: currentChannels },
      });
      logger.info({ guildId, channelId: channel.id }, 'Approval channel removed');
      await interaction.editReply(`✅ Approval no longer required for ${channel}`);
      break;

    case 'list':
      if (currentChannels.length === 0) {
        await interaction.editReply('📋 No approval channels configured.\\n\\nUse `/settings approval-channels action:Add` to add channels.');
        return;
      }
      const channelMentions = currentChannels.map((id: string) => `<#${id}>`).join(', ');
      await interaction.editReply(
        `📋 **Channels requiring participant approval:**\\n\\n${channelMentions}\\n\\n` +
        `Events in these channels require creator approval before participants are confirmed.`
      );
      break;

    case 'clear':
      if (currentChannels.length === 0) {
        await interaction.editReply('❌ No approval channels to clear.');
        return;
      }
      await prisma.guild.update({
        where: { id: guildId },
        data: { approvalChannels: [] },
      });
      logger.info({ guildId }, 'All approval channels cleared');
      await interaction.editReply('✅ All approval channel settings have been cleared.');
      break;
  }
}

export default command;
