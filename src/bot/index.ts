// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/bot/index.ts
// Main bot entry point with full initialization

import { Client, GatewayIntentBits, Events, REST, Routes } from 'discord.js';
import { config } from '../config/env.js';
import { getModuleLogger } from '../utils/logger.js';
import { connectDatabase, disconnectDatabase } from '../database/db.js';
import { loadCommands, getCommands } from './commandLoader.js';
import { handleInteraction } from './interactionHandler.js';
import { handlePrefixCommand } from './prefixCommandHandler.js';
import { startScheduler, stopScheduler } from '../scheduler/eventScheduler.js';
import { startStatsScheduler, stopStatsScheduler } from '../scheduler/statsScheduler.js';

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
        // MessageContent is a privileged intent - enable in Discord Developer Portal
        // Required for prefix commands (!event, $template, etc.)
        // If not enabled, only slash commands will work
        ...(process.env.ENABLE_PREFIX_COMMANDS === 'true' ? [GatewayIntentBits.MessageContent] : []),
      ],
    });

    // Load slash commands
    await loadCommands();
    logger.info(`Loaded ${getCommands().size} commands`);

    // Register event handlers
    client.once(Events.ClientReady, handleReady);
    client.on(Events.InteractionCreate, handleInteraction);
    client.on(Events.GuildCreate, handleGuildCreate);
    client.on(Events.GuildUpdate, handleGuildUpdate);
    
    // Prefix commands - only if MessageContent intent is enabled
    if (process.env.ENABLE_PREFIX_COMMANDS === 'true') {
      client.on(Events.MessageCreate, handlePrefixCommand);
      logger.info('Prefix commands enabled');
    }
    
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
 * Handle guild join - update guild info in database
 */
async function handleGuildCreate(guild: any): Promise<void> {
  logger.info({ guildId: guild.id, guildName: guild.name }, 'Bot joined guild');
  
  try {
    const prisma = (await import('../database/db.js')).default();
    await prisma.guild.upsert({
      where: { id: guild.id },
      create: {
        id: guild.id,
        name: guild.name,
      },
      update: {
        name: guild.name,
      },
    });
    logger.info({ guildId: guild.id }, 'Guild info updated in database');
  } catch (error) {
    logger.error({ error, guildId: guild.id }, 'Failed to update guild info');
  }
}

/**
 * Handle guild update - update guild name in database
 */
async function handleGuildUpdate(_oldGuild: any, newGuild: any): Promise<void> {
  try {
    const prisma = (await import('../database/db.js')).default();
    await prisma.guild.update({
      where: { id: newGuild.id },
      data: {
        name: newGuild.name,
      },
    });
    logger.info({ guildId: newGuild.id, newName: newGuild.name }, 'Guild name updated');
  } catch (error) {
    logger.error({ error, guildId: newGuild.id }, 'Failed to update guild name');
  }
}

/**
 * Sync all current guilds to database on startup
 */
async function syncGuilds(client: Client<true>): Promise<void> {
  try {
    logger.info('Syncing guilds to database...');
    const prisma = (await import('../database/db.js')).default();
    
    const guilds = Array.from(client.guilds.cache.values());
    let synced = 0;
    
    for (const guild of guilds) {
      try {
        await prisma.guild.upsert({
          where: { id: guild.id },
          create: {
            id: guild.id,
            name: guild.name,
          },
          update: {
            name: guild.name,
          },
        });
        synced++;
      } catch (error) {
        logger.error({ error, guildId: guild.id, guildName: guild.name }, 'Failed to sync guild');
      }
    }
    
    logger.info(`Synced ${synced}/${guilds.length} guilds to database`);
  } catch (error) {
    logger.error({ error }, 'Failed to sync guilds');
  }
}

/**
 * Handle bot ready event
 */
async function handleReady(client: Client): Promise<void> {
  const readyClient = client as Client<true>;
  logger.info(`Bot ready! Logged in as ${readyClient.user.tag}`);
  logger.info(`Serving ${readyClient.guilds.cache.size} guilds`);

  // Sync all current guilds to database
  await syncGuilds(readyClient);

  // Register slash commands globally
  await registerCommands(readyClient);

  // Start scheduler
  startScheduler();
  logger.info('Event scheduler started');

  // Start stats scheduler
  startStatsScheduler();
  logger.info('Stats scheduler started');
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
  stopStatsScheduler();

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
