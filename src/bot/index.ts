// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/bot/index.ts
// Main bot entry point with full initialization

import { Client, GatewayIntentBits, Events, REST, Routes } from 'discord.js';
import { config } from '../config/env.js';
import { getModuleLogger } from '../utils/logger.js';
import { connectDatabase, disconnectDatabase } from '../database/db.js';
import { loadCommands, getCommands } from './commandLoader.js';
import { handleInteraction } from './interactionHandler.js';
import { startScheduler, stopScheduler } from '../scheduler/eventScheduler.js';

const logger = getModuleLogger('bot');

let client: Client | null = null;

/**
 * Initialize and start the Discord bot
 */
export async function startBot(): Promise<void> {
  try {
    logger.info('Starting Discord Raid Bot...');

    // Connect to database
    await connectDatabase();

    // Create Discord client
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        // MessageContent is a privileged intent - only needed if reading message content
        // For slash commands and interactions, we don't need this
      ],
    });

    // Load slash commands
    await loadCommands();
    logger.info(`Loaded ${getCommands().size} commands`);

    // Register event handlers
    client.once(Events.ClientReady, handleReady);
    client.on(Events.InteractionCreate, handleInteraction);
    client.on(Events.Error, handleError);

    // Login to Discord
    await client.login(config.DISCORD_TOKEN);

  } catch (error: any) {
    logger.error({ 
      error,
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      name: error?.name
    }, 'Failed to start bot');
    await shutdown();
    process.exit(1);
  }
}

/**
 * Handle bot ready event
 */
async function handleReady(readyClient: Client<true>): Promise<void> {
  logger.info(`Bot ready! Logged in as ${readyClient.user.tag}`);
  logger.info(`Serving ${readyClient.guilds.cache.size} guilds`);

  // Register slash commands globally
  await registerCommands(readyClient);

  // Start scheduler
  startScheduler();
  logger.info('Event scheduler started');
}

/**
 * Register slash commands with Discord
 */
async function registerCommands(_client: Client<true>): Promise<void> {
  try {
    logger.info('Registering slash commands...');

    const commands = Array.from(getCommands().values()).map(cmd => cmd.data.toJSON());
    
    const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationCommands(config.DISCORD_CLIENT_ID),
      { body: commands }
    );

    logger.info(`Successfully registered ${commands.length} slash commands`);
  } catch (error) {
    logger.error({ error }, 'Failed to register commands');
    throw error;
  }
}

/**
 * Handle Discord client errors
 */
function handleError(error: Error): void {
  logger.error({ error }, 'Discord client error');
}

/**
 * Gracefully shutdown the bot
 */
export async function shutdown(): Promise<void> {
  logger.info('Shutting down bot...');

  stopScheduler();

  if (client) {
    client.destroy();
    client = null;
  }

  await disconnectDatabase();
  logger.info('Bot shutdown complete');
}

/**
 * Get the Discord client instance
 */
export function getClient(): Client | null {
  return client;
}

// Handle process signals for graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal');
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal');
  await shutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  shutdown().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
});

// Entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startBot().catch((error) => {
    logger.fatal({ error }, 'Fatal error during startup');
    process.exit(1);
  });
}
