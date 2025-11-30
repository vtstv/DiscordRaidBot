// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/event.ts
// Event management commands - refactored with modular handlers

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
} from 'discord.js';
import { CommandError } from '../utils/errors.js';
import type { Command } from '../types/command.js';

// Import handlers
import { handleCreate } from './event/create.js';
import { handleList } from './event/list.js';
import { handleCancel } from './event/cancel.js';
import { handleAddUser } from './event/add-user.js';
import { handleRemoveUser } from './event/remove-user.js';
import { handleExtendVoice } from './event/extend-voice.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage events')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new event')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Event title')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('time')
            .setDescription('Event start time (DD.MM.YYYY HH:MM or YYYY-MM-DD HH:MM)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('template')
            .setDescription('Template to use')
            .setRequired(false)
            .setAutocomplete(true)
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to post event (default: current channel)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Event description')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('max-participants')
            .setDescription('Maximum number of participants')
            .setMinValue(1)
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('duration')
            .setDescription('Event duration in minutes')
            .setMinValue(15)
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('require-approval')
            .setDescription('Require creator approval for participants (overrides channel settings)')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('create-thread')
            .setDescription('Create discussion thread for this event (overrides channel settings)')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('allow-notes')
            .setDescription('Allow participant notes for this event (overrides server settings)')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('allowed-roles')
            .setDescription('Roles allowed to sign up (comma-separated names or "all" for everyone)')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('bench-overflow')
            .setDescription('Bench users without allowed roles (true) or deny signup (false)')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('deadline')
            .setDescription('Hours before event start to close signups (negative = after start)')
            .setMinValue(-168) // Max 7 days after
            .setMaxValue(168)  // Max 7 days before
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('create-voice-channel')
            .setDescription('Create a temporary voice channel for this event')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('voice-channel-name')
            .setDescription('Custom name for the voice channel (default: event title)')
            .setMaxLength(50)
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('voice-restricted')
            .setDescription('Restrict voice channel to participants only')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('voice-create-before')
            .setDescription('Minutes before event to create voice channel (overrides server default)')
            .setMinValue(5)
            .setMaxValue(1440)
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('create-discord-event')
            .setDescription('Create native Discord scheduled event (overrides server settings)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List upcoming events')
        .addStringOption(option =>
          option
            .setName('status')
            .setDescription('Filter by status')
            .addChoices(
              { name: 'Scheduled', value: 'scheduled' },
              { name: 'Active', value: 'active' },
              { name: 'Completed', value: 'completed' },
              { name: 'Cancelled', value: 'cancelled' }
            )
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('cancel')
        .setDescription('Cancel an event')
        .addStringOption(option =>
          option
            .setName('event-id')
            .setDescription('Event ID')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-user')
        .setDescription('Add a user to an event (admin/creator only)')
        .addStringOption(option =>
          option
            .setName('event-id')
            .setDescription('Event ID')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to add to the event')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('role')
            .setDescription('Role/class for the user')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('spec')
            .setDescription('Specialization for the user')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-user')
        .setDescription('Remove a user from an event (admin/creator only)')
        .addStringOption(option =>
          option
            .setName('event-id')
            .setDescription('Event ID')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to remove from the event')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('extend-voice')
        .setDescription('Extend voice channel duration for an event')
        .addStringOption(option =>
          option
            .setName('event-id')
            .setDescription('Event ID')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption(option =>
          option
            .setName('minutes')
            .setDescription('Minutes to extend (1-1440)')
            .setMinValue(1)
            .setMaxValue(1440)
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      throw new CommandError('This command can only be used in a server');
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'create':
        await handleCreate(interaction);
        break;
      case 'list':
        await handleList(interaction);
        break;
      case 'cancel':
        await handleCancel(interaction);
        break;
      case 'add-user':
        await handleAddUser(interaction);
        break;
      case 'remove-user':
        await handleRemoveUser(interaction);
        break;
      case 'extend-voice':
        await handleExtendVoice(interaction);
        break;
    }
  },
};

export default command;
