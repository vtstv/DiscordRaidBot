// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Interactive settings configuration - main command

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { CommandError } from '../../utils/errors.js';
import type { Command } from '../../types/command.js';
import { showMainMenu } from './menus/main.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('[BETA] Interactive configuration menu for server settings'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      throw new CommandError('This command can only be used in a server');
    }

    // Check if user is administrator
    const member = interaction.member as any;
    if (!member?.permissions?.has(PermissionFlagsBits.Administrator)) {
      throw new CommandError('You must be an administrator to use this command.');
    }

    await showMainMenu(interaction);
  },
};

export default command;
export { handleConfigSelectMenu } from './handlers/select-menu.js';
export { handleConfigButton } from './handlers/buttons.js';
