// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/bot/prefixCommandHandler.ts
// Handle prefix-based text commands (e.g., $event create, #template list)

import { Message } from 'discord.js';
import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';

const logger = getModuleLogger('prefixCommands');
const prisma = getPrismaClient();

const DEFAULT_PREFIX = '!';

/**
 * Get configured command prefix for guild
 */
export async function getCommandPrefix(guildId: string): Promise<string> {
  try {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { commandPrefix: true },
    });
    return guild?.commandPrefix || DEFAULT_PREFIX;
  } catch (error) {
    logger.error({ error, guildId }, 'Failed to get command prefix');
    return DEFAULT_PREFIX;
  }
}

/**
 * Set command prefix for guild
 */
export async function setCommandPrefix(guildId: string, guildName: string, prefix: string): Promise<void> {
  // Validate prefix (1-3 characters, no spaces or alphanumeric only)
  if (!/^[!@#$%^&*\-_=+|\\:;]{1,3}$/.test(prefix)) {
    throw new Error('Prefix must be 1-3 special characters (e.g., !, $, #, **, etc.)');
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: guildName,
      commandPrefix: prefix,
    },
    update: {
      commandPrefix: prefix,
    },
  });

  logger.info({ guildId, prefix }, 'Command prefix updated');
}

/**
 * Handle text-based prefix commands
 */
export async function handlePrefixCommand(message: Message): Promise<void> {
  // Ignore bots and DMs
  if (message.author.bot || !message.guild) {
    return;
  }

  const guildId = message.guild.id;
  const prefix = await getCommandPrefix(guildId);

  // Check if message starts with prefix
  if (!message.content.startsWith(prefix)) {
    return;
  }

  // Parse command
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) {
    return;
  }

  logger.debug({ 
    commandName, 
    args, 
    userId: message.author.id, 
    guildId 
  }, 'Processing prefix command');

  try {
    switch (commandName) {
      case 'help':
        await handleHelp(message, prefix);
        break;
      case 'prefix':
        await handlePrefixChange(message, args, prefix);
        break;
      case 'event':
        await handleEventCommand(message, args);
        break;
      case 'template':
        await handleTemplateCommand(message, args);
        break;
      case 'settings':
        await handleSettingsCommand(message, args);
        break;
      default:
        // Unknown command - ignore silently
        break;
    }
  } catch (error: any) {
    logger.error({ error, commandName, guildId }, 'Prefix command error');
    await message.reply(`❌ Error: ${error.message || 'Command failed'}`);
  }
}

/**
 * Show help message
 */
async function handleHelp(message: Message, prefix: string): Promise<void> {
  const helpText = `
**📖 Bot Commands Help**

**Prefix Commands** (current prefix: \`${prefix}\`)

\`${prefix}help\` - Show this help message
\`${prefix}prefix <symbol>\` - Change command prefix (admin only)
\`${prefix}event list\` - List all active events
\`${prefix}template list\` - List all templates

**Slash Commands** (recommended)
Use \`/event\`, \`/template\`, \`/settings\` for full functionality

**Note**: Prefix commands have limited functionality compared to slash commands. 
For creating events and templates, please use slash commands (type \`/\`).
  `.trim();

  await message.reply(helpText);
}

/**
 * Change command prefix
 */
async function handlePrefixChange(message: Message, args: string[], currentPrefix: string): Promise<void> {
  // Check admin permissions
  if (!message.member?.permissions.has('Administrator')) {
    await message.reply('❌ Only administrators can change the command prefix.');
    return;
  }

  if (args.length === 0) {
    await message.reply(`Current command prefix is: \`${currentPrefix}\`\n\nUsage: \`${currentPrefix}prefix <symbol>\`\nExamples: \`${currentPrefix}prefix $\`, \`${currentPrefix}prefix #\`, \`${currentPrefix}prefix !!\``);
    return;
  }

  const newPrefix = args[0];

  try {
    await setCommandPrefix(message.guild!.id, message.guild!.name, newPrefix);
    await message.reply(`✅ Command prefix changed to: \`${newPrefix}\`\n\nYou can now use commands like: \`${newPrefix}event list\`, \`${newPrefix}help\``);
  } catch (error: any) {
    await message.reply(`❌ ${error.message}`);
  }
}

/**
 * Handle event commands
 */
async function handleEventCommand(message: Message, args: string[]): Promise<void> {
  const subcommand = args[0]?.toLowerCase();

  if (!subcommand || subcommand === 'list') {
    // List events
    const events = await prisma.event.findMany({
      where: {
        guildId: message.guild!.id,
        status: { in: ['scheduled', 'active'] },
      },
      orderBy: { startTime: 'asc' },
      take: 10,
      select: {
        id: true,
        title: true,
        startTime: true,
        _count: {
          select: { participants: true },
        },
      },
    });

    if (events.length === 0) {
      await message.reply('📅 No active events found.\n\nCreate an event with `/event create`');
      return;
    }

    let response = '**📅 Active Events**\n\n';
    for (const event of events) {
      const date = new Date(event.startTime).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      response += `• **${event.title}** - ${date} (${event._count.participants} participants)\n`;
      response += `  _ID: \`${event.id.substring(0, 8)}\`_\n`;
    }

    response += `\n_Use slash command \`/event create\` to create new events_`;
    await message.reply(response);
  } else {
    await message.reply(`ℹ️ For creating and managing events, please use slash commands:\n\`/event create\` - Create new event\n\`/event edit\` - Edit event\n\`/event delete\` - Delete event`);
  }
}

/**
 * Handle template commands
 */
async function handleTemplateCommand(message: Message, args: string[]): Promise<void> {
  const subcommand = args[0]?.toLowerCase();

  if (!subcommand || subcommand === 'list') {
    // List templates
    const templates = await prisma.template.findMany({
      where: { guildId: message.guild!.id },
      orderBy: { name: 'asc' },
      select: {
        name: true,
        description: true,
      },
    });

    if (templates.length === 0) {
      await message.reply('📋 No templates found.\n\nCreate a template with `/template create`');
      return;
    }

    let response = '**📋 Available Templates**\n\n';
    for (const template of templates) {
      response += `• **${template.name}**`;
      if (template.description) {
        response += ` - ${template.description}`;
      }
      response += '\n';
    }

    response += `\n_Use slash command \`/template create\` to create new templates_`;
    await message.reply(response);
  } else {
    await message.reply(`ℹ️ For creating and managing templates, please use slash commands:\n\`/template create\` - Create new template\n\`/template edit\` - Edit template\n\`/template delete\` - Delete template`);
  }
}

/**
 * Handle settings commands
 */
async function handleSettingsCommand(message: Message, _args: string[]): Promise<void> {
  const guild = await prisma.guild.findUnique({
    where: { id: message.guild!.id },
  });

  if (!guild) {
    await message.reply('⚙️ No settings configured yet.\n\nUse `/settings` slash command to configure the bot.');
    return;
  }

  const prefix = guild.commandPrefix || DEFAULT_PREFIX;
  const logChannel = guild.logChannelId ? `<#${guild.logChannelId}>` : 'Not set';
  const archiveChannel = guild.archiveChannelId ? `<#${guild.archiveChannelId}>` : 'Not set';
  const managerRole = guild.managerRoleId ? `<@&${guild.managerRoleId}>` : 'Not set';
  const locale = guild.locale || 'en';

  const response = `
**⚙️ Server Settings**

**Command Prefix:** \`${prefix}\`
**Language:** ${locale === 'ru' ? 'Русский' : 'English'}
**Timezone:** ${guild.timezone}
**Manager Role:** ${managerRole}
**Log Channel:** ${logChannel}
**Archive Channel:** ${archiveChannel}

_Use \`/settings\` slash command to change these settings_
  `.trim();

  await message.reply(response);
}
