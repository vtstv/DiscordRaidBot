// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/settings.ts
// Guild settings management (timezone, log channel, archive channel, etc.)

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
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
        .setName('prefix')
        .setDescription('Set command prefix for text commands')
        .addStringOption(option =>
          option
            .setName('prefix')
            .setDescription('Command prefix (e.g., !, $, #, **)')
            .setRequired(false)
            .setMinLength(1)
            .setMaxLength(3)
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
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('auto-delete')
        .setDescription('Set hours after archiving to auto-delete event messages')
        .addIntegerOption(option =>
          option
            .setName('hours')
            .setDescription('Hours after archiving (0 or empty = never delete)')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(720) // Max 30 days
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('thread-channels')
        .setDescription('Manage channels where threads are auto-created for events')
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

    // Check if user is administrator
    const member = interaction.member as any;
    if (!member?.permissions?.has(PermissionFlagsBits.Administrator)) {
      throw new CommandError('You must be an administrator to use this command.');
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
      case 'prefix':
        await handlePrefix(interaction);
        break;
      case 'approval-channels':
        await handleApprovalChannels(interaction);
        break;
      case 'auto-delete':
        await handleAutoDelete(interaction);
        break;
      case 'thread-channels':
        await handleThreadChannels(interaction);
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

  // Auto-delete setting
  const autoDeleteText = guild.autoDeleteHours 
    ? `${guild.autoDeleteHours} hour(s) after archiving`
    : 'Disabled';

  // Thread channels
  const threadChannelsText = guild.threadChannels.length > 0
    ? guild.threadChannels.map(id => `<#${id}>`).join(', ')
    : 'None configured';

  await interaction.editReply(
    `**Server Settings**\n\n` +
    `🌐 **Language:** ${languageName}\n` +
    `🌍 **Timezone:** ${guild.timezone}\n` +
    `📋 **Log Channel:** ${logChannel}\n` +
    `📦 **Archive Channel:** ${archiveChannel}\n` +
    `⏰ **Reminder Intervals:** ${reminders}\n` +
    `🗑️ **Auto-delete messages:** ${autoDeleteText}\n` +
    `💬 **Auto-create threads in:** ${threadChannelsText}`
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
    await interaction.editReply(`✅ Bot manager role set to ${role}\n\nUsers with this role can create events and templates.`);
  } else {
    await interaction.editReply('✅ Manager role cleared.\n\nOnly **Administrators** can manage the bot now.');
  }
}

async function handlePrefix(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const prefix = interaction.options.getString('prefix');

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
        `✅ Approval required for ${channel}\n\n` +
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
        await interaction.editReply('📋 No approval channels configured.\n\nUse `/settings approval-channels action:Add` to add channels.');
        return;
      }
      const channelMentions = currentChannels.map((id: string) => `<#${id}>`).join(', ');
      await interaction.editReply(
        `📋 **Channels requiring participant approval:**\n\n${channelMentions}\n\n` +
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

async function handleAutoDelete(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const hours = interaction.options.getInteger('hours');

  // hours === null means disable auto-delete
  // hours === 0 means disable auto-delete
  // hours > 0 means enable with that value
  const autoDeleteHours = (hours === null || hours === 0) ? null : hours;

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      autoDeleteHours,
    },
    update: {
      autoDeleteHours,
    },
  });

  logger.info({ guildId, autoDeleteHours }, 'Auto-delete hours updated');

  if (autoDeleteHours === null) {
    await interaction.editReply(
      '✅ **Auto-delete disabled**\n\n' +
      'Archived event messages will remain in channels permanently.'
    );
  } else {
    await interaction.editReply(
      `✅ **Auto-delete enabled: ${autoDeleteHours} hours**\n\n` +
      `Event messages will be automatically deleted ${autoDeleteHours} hour(s) after archiving.\n\n` +
      `Note: Events are archived 1 hour after their start time.`
    );
  }
}

async function handleThreadChannels(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const action = interaction.options.getString('action', true);
  const channel = interaction.options.getChannel('channel') as TextChannel | null;

  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { threadChannels: true },
  });

  let currentChannels = guild?.threadChannels || [];

  switch (action) {
    case 'add':
      if (!channel) {
        throw new ValidationError('Please specify a channel to add');
      }
      if (currentChannels.includes(channel.id)) {
        await interaction.editReply(`❌ Channel ${channel} already has auto-thread creation enabled.`);
        return;
      }
      currentChannels.push(channel.id);
      await prisma.guild.upsert({
        where: { id: guildId },
        create: {
          id: guildId,
          name: interaction.guild!.name,
          threadChannels: currentChannels,
        },
        update: {
          threadChannels: currentChannels,
        },
      });
      logger.info({ guildId, channelId: channel.id }, 'Thread channel added');
      await interaction.editReply(
        `✅ Auto-thread creation enabled for ${channel}\n\n` +
        `Events posted in this channel will automatically create discussion threads.`
      );
      break;

    case 'remove':
      if (!channel) {
        throw new ValidationError('Please specify a channel to remove');
      }
      if (!currentChannels.includes(channel.id)) {
        await interaction.editReply(`❌ Channel ${channel} does not have auto-thread creation enabled.`);
        return;
      }
      currentChannels = currentChannels.filter((id: string) => id !== channel.id);
      await prisma.guild.update({
        where: { id: guildId },
        data: { threadChannels: currentChannels },
      });
      logger.info({ guildId, channelId: channel.id }, 'Thread channel removed');
      await interaction.editReply(`✅ Auto-thread creation disabled for ${channel}`);
      break;

    case 'list':
      if (currentChannels.length === 0) {
        await interaction.editReply(
          '📋 No channels configured for auto-thread creation.\n\n' +
          'Use `/settings thread-channels action:Add` to enable auto-threads for specific channels.\n\n' +
          'Note: You can also enable threads per-event when creating an event.'
        );
        return;
      }
      const channelMentions = currentChannels.map((id: string) => `<#${id}>`).join(', ');
      await interaction.editReply(
        `📋 **Channels with auto-thread creation:**\n\n${channelMentions}\n\n` +
        `Events in these channels will automatically create discussion threads.`
      );
      break;

    case 'clear':
      if (currentChannels.length === 0) {
        await interaction.editReply('❌ No thread channels to clear.');
        return;
      }
      await prisma.guild.update({
        where: { id: guildId },
        data: { threadChannels: [] },
      });
      logger.info({ guildId }, 'All thread channels cleared');
      await interaction.editReply('✅ All thread channel settings have been cleared.');
      break;
  }
}

export default command;
