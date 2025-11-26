// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/types/command.ts
// Type definitions for slash commands

import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  AutocompleteInteraction 
} from 'discord.js';

/**
 * Command interface
 */
export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}
