// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Guild settings management - modular version

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  AutocompleteInteraction,
} from 'discord.js';
import { getModuleLogger } from '../../utils/logger.js';
import { CommandError } from '../../utils/errors.js';
import type { Command } from '../../types/command.js';
import { COMMON_TIMEZONES, getCurrentTime } from './constants.js';
import { handleView } from './handlers/view.js';
import { handleLanguage, handleTimezone } from './handlers/locale.js';
import { handleLogChannel, handleArchiveChannel } from './handlers/channels.js';
import { handleReminders } from './handlers/reminders.js';
import { handleManagerRole, handlePrefix } from './handlers/roles.js';
import { handleApprovalChannels, handleAutoDelete, handleThreadChannels } from './handlers/advanced.js';

const logger = getModuleLogger('settings-command');

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
              { name: 'Русский (Russian)', value: 'ru' },
              { name: 'Deutsch (German)', value: 'de' }
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
            .setDescription('Select timezone from list or type IANA timezone')
            .setRequired(true)
            .setAutocomplete(true)
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
    }
  },

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === 'timezone') {
      const value = focusedOption.value.toLowerCase();
      
      // Filter timezones based on user input
      const filtered = COMMON_TIMEZONES.filter(tz =>
        tz.name.toLowerCase().includes(value) ||
        tz.value.toLowerCase().includes(value)
      ).slice(0, 25); // Discord limit

      await interaction.respond(
        filtered.map(tz => ({
          name: `${tz.name} | Current time: ${getCurrentTime(tz.value)}`,
          value: tz.value,
        }))
      );
    }
  },
};

export default command;
