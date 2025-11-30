// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/roll.ts

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll generator commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new roll generator')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Title to display on the roll generator message')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Description to display on the roll generator message')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('max-roll')
            .setDescription('Maximum roll value (default: 100)')
            .setMinValue(1)
            .setMaxValue(10000)
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('rolls-per-user')
            .setDescription('How many times each user can roll (default: 1)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('max-users')
            .setDescription('Maximum number of users allowed to roll')
            .setMinValue(1)
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('max-shown')
            .setDescription('Maximum number of rolls shown on the message (default: 10)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('show-usernames')
            .setDescription('Show Discord usernames on the roll generator (default: true)')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('duration')
            .setDescription('Time before generator closes (e.g., "30m", "1h", "2h 30m")')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('start-delay')
            .setDescription('Delay before opening generator (e.g., "5m", "10m")')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('bulk-roll')
            .setDescription('Mention roles or provide event ID for bulk roll')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('show-duplicates')
            .setDescription('Show all rolls from each user or only their highest roll (default: false)')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('allowed-roles')
            .setDescription('Mention the roles permitted to roll (space-separated)')
            .setRequired(false)
        )
        .addChannelOption(option =>
          option
            .setName('limit-to-voice')
            .setDescription('Only users in this voice channel can roll')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Close an active roll generator')
        .addStringOption(option =>
          option
            .setName('generator-id')
            .setDescription('ID of the roll generator to close')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all active roll generators in this server')
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    // Dynamic import based on subcommand
    const handler = await import(`./roll/${subcommand}.js`);
    return handler.execute(interaction);
  },
};

export default command;
