// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/bot/commandLoader.ts
// Dynamic command loader for slash commands

import { Collection } from 'discord.js';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getModuleLogger } from '../utils/logger.js';
import type { Command } from '../types/command.js';

const logger = getModuleLogger('commandLoader');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = new Collection<string, Command>();

/**
 * Load all command modules from the commands directory
 */
export async function loadCommands(): Promise<void> {
  try {
    const commandsPath = join(__dirname, '..', 'commands');
    logger.debug({ path: commandsPath }, 'Loading commands from directory');

    const commandFiles = await readdir(commandsPath);
    const tsFiles = commandFiles.filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    logger.debug({ count: tsFiles.length }, 'Found command files');

    for (const file of tsFiles) {
      const filePath = join(commandsPath, file);
      logger.debug({ file }, 'Loading command file');

      try {
        const commandModule = await import(filePath);
        const command: Command = commandModule.default;

        if (!command || !command.data || !command.execute) {
          logger.warn({ file }, 'Invalid command module - missing data or execute');
          continue;
        }

        commands.set(command.data.name, command);
        logger.info({ name: command.data.name }, 'Loaded command');
      } catch (error) {
        logger.error({ error, file }, 'Failed to load command file');
      }
    }

    logger.info({ count: commands.size }, 'Commands loaded successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to load commands');
    throw error;
  }
}

/**
 * Get a command by name
 */
export function getCommand(name: string): Command | undefined {
  return commands.get(name);
}

/**
 * Get all loaded commands
 */
export function getCommands(): Collection<string, Command> {
  return commands;
}
