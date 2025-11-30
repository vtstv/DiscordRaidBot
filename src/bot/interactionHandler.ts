// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Main interaction handler - delegates to modular handlers

import { 
  Interaction, 
  ChatInputCommandInteraction,
} from 'discord.js';
import { getModuleLogger } from '../utils/logger.js';
import { getCommand } from './commandLoader.js';
import { CommandError, PermissionError, ValidationError } from '../utils/errors.js';
import { handleButton } from './interactions/button-handler.js';
import { handleAutocomplete } from './interactions/autocomplete-handler.js';
import { handleModal } from './interactions/modal-handler.js';
import { handleRollButtonInteraction, handleRollEditInteraction, handleRollModalSubmit } from './interactions/roll-handler.js';
import getPrismaClient from '../database/db.js';
import { config } from '../config/env.js';

const logger = getModuleLogger('interactionHandler');
const prisma = getPrismaClient();

/**
 * Main interaction handler - routes to appropriate sub-handlers
 */
export async function handleInteraction(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
    } else if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction);
    } else if (interaction.isButton()) {
      // Check if it's a roll button
      if (interaction.customId.startsWith('roll_')) {
        const [action, subAction] = interaction.customId.split('_');
        if (['do', 'edit', 'close'].includes(subAction)) {
          await handleRollButtonInteraction(interaction);
        } else if (['edittitle', 'editdesc', 'toggleusername', 'editmaxshown'].includes(subAction)) {
          await handleRollEditInteraction(interaction);
        }
      } else {
        await handleButton(interaction);
      }
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
    } else if (interaction.isChannelSelectMenu()) {
      await handleChannelSelectMenu(interaction);
    } else if (interaction.isRoleSelectMenu()) {
      await handleRoleSelectMenu(interaction);
    } else if (interaction.isModalSubmit()) {
      // Check if it's a roll modal
      if (interaction.customId.startsWith('roll_modal')) {
        await handleRollModalSubmit(interaction);
      } else {
        await handleModal(interaction);
      }
    }
  } catch (error) {
    logger.error({ error, interactionType: interaction.type }, 'Error handling interaction');
    await handleInteractionError(interaction, error);
  }
}

/**
 * Handle slash command interactions
 */
async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const command = getCommand(interaction.commandName);

  if (!command) {
    logger.warn({ commandName: interaction.commandName }, 'Unknown command');
    await interaction.reply({
      content: `❌ Unknown command: ${interaction.commandName}`,
      ephemeral: true,
    });
    return;
  }

  // Check maintenance mode (except for ping command and bot admins)
  if (interaction.commandName !== 'ping') {
    try {
      const systemSettings = await prisma.systemSettings.findUnique({
        where: { id: 'system' },
      });

      if (systemSettings?.maintenanceMode) {
        // Allow bot admins to bypass maintenance mode
        const adminIds = config.ADMIN_USER_IDS.split(',').map(id => id.trim()).filter(Boolean);
        const isBotAdmin = adminIds.includes(interaction.user.id);
        
        if (!isBotAdmin) {
          logger.info(
            {
              command: interaction.commandName,
              user: interaction.user.tag,
              guild: interaction.guild?.name,
            },
            'Command blocked: Maintenance mode active'
          );
          
          await interaction.reply({
            content: '🔧 **Maintenance Mode**\n\nThe bot is currently under maintenance. Please try again later.',
            ephemeral: true,
          });
          return;
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to check maintenance mode');
      // Continue execution if check fails (fail-open)
    }
  }

  logger.info(
    {
      command: interaction.commandName,
      user: interaction.user.tag,
      guild: interaction.guild?.name,
    },
    'Executing command'
  );

  try {
    await command.execute(interaction);
    
    // Log analytics if enabled
    try {
      const systemSettings = await prisma.systemSettings.findUnique({
        where: { id: 'system' },
      });

      if (systemSettings?.enableAnalytics) {
        // Log command usage to database for analytics
        await prisma.logEntry.create({
          data: {
            guildId: interaction.guildId || 'DM',
            action: 'COMMAND_EXECUTED',
            userId: interaction.user.id,
            username: interaction.user.tag,
            details: JSON.stringify({
              command: interaction.commandName,
              options: interaction.options.data.map(opt => ({
                name: opt.name,
                type: opt.type,
                value: typeof opt.value === 'string' ? opt.value : String(opt.value),
              })),
            }),
          },
        });
      }
    } catch (analyticsError) {
      // Don't fail command execution if analytics logging fails
      logger.debug({ error: analyticsError }, 'Failed to log analytics');
    }
  } catch (error) {
    logger.error({ error, command: interaction.commandName }, 'Command execution failed');
    throw error;
  }
}

/**
 * Handle select menu interactions
 */
async function handleSelectMenu(interaction: any): Promise<void> {
  const customId = interaction.customId;
  const [action, ...params] = customId.split(':');

  logger.debug({ customId, action, params, user: interaction.user.tag }, 'Select menu interaction');

  try {
    // Config menu (uses underscores instead of colons)
    if (customId.startsWith('config_')) {
      const { handleConfigSelectMenu } = await import('../commands/config.js');
      await handleConfigSelectMenu(interaction);
      return;
    }

    switch (action) {
      case 'event_role':
        await handleEventRoleSelect(interaction, params[0]);
        break;

      default:
        logger.warn({ customId: interaction.customId }, 'Unknown select menu interaction');
        await interaction.reply({
          content: '❌ Unknown select menu interaction.',
          ephemeral: true,
        });
    }
  } catch (error) {
    logger.error({ error, customId: interaction.customId }, 'Select menu interaction error');
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    if (interaction.deferred) {
      await interaction.editReply(`❌ ${errorMessage}`);
    } else if (!interaction.replied) {
      await interaction.reply({
        content: `❌ ${errorMessage}`,
        ephemeral: true,
      });
    }
  }
}

/**
 * Handle channel select menu interactions
 */
async function handleChannelSelectMenu(interaction: any): Promise<void> {
  const customId = interaction.customId;
  
  logger.debug({ customId, user: interaction.user.tag }, 'Channel select menu interaction');

  try {
    // Config voice category selection
    if (customId === 'config_select_voice_category') {
      const { handleVoiceCategory } = await import('../commands/config/handlers/voice.js');
      await handleVoiceCategory(interaction);
      return;
    }

    // Config channel selection (log/archive)
    if (customId.startsWith('config_set_channel_')) {
      const { handleChannelSelect } = await import('../commands/config/handlers/channels.js');
      const channelType = customId.replace('config_set_channel_', '');
      await handleChannelSelect(interaction, channelType);
      return;
    }

    // Config multi-channel selection (thread/note/approval)
    if (customId.startsWith('config_set_channels_')) {
      const { handleMultiChannelSelect } = await import('../commands/config/handlers/channels.js');
      const channelType = customId.replace('config_set_channels_', '');
      await handleMultiChannelSelect(interaction, channelType);
      return;
    }

    // Statistics stats channel selection
    if (customId === 'config_set_stats_channel') {
      const { handleStatsChannelSelect } = await import('../commands/config/handlers/statistics.js');
      await handleStatsChannelSelect(interaction);
      return;
    }

    logger.warn({ customId }, 'Unknown channel select menu interaction');
    await interaction.reply({
      content: '❌ Unknown channel select menu interaction.',
      ephemeral: true,
    });
  } catch (error) {
    logger.error({ error, customId }, 'Channel select menu interaction error');
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    if (interaction.deferred) {
      await interaction.editReply(`❌ ${errorMessage}`);
    } else if (!interaction.replied) {
      await interaction.reply({
        content: `❌ ${errorMessage}`,
        ephemeral: true,
      });
    }
  }
}

/**
 * Handle role select menu interactions
 */
async function handleRoleSelectMenu(interaction: any): Promise<void> {
  const customId = interaction.customId;
  
  logger.debug({ customId, user: interaction.user.tag }, 'Role select menu interaction');

  try {
    // Permissions manager role
    if (customId === 'config_set_manager_role') {
      const { handleManagerRoleSelect } = await import('../commands/config/handlers/permissions.js');
      await handleManagerRoleSelect(interaction);
      return;
    }

    // Permissions dashboard roles
    if (customId === 'config_set_dashboard_roles') {
      const { handleDashboardRolesSelect } = await import('../commands/config/handlers/permissions.js');
      await handleDashboardRolesSelect(interaction);
      return;
    }

    // Statistics top 10 role
    if (customId === 'config_set_top10_role') {
      const { handleTop10RoleSelect } = await import('../commands/config/handlers/statistics.js');
      await handleTop10RoleSelect(interaction);
      return;
    }

    logger.warn({ customId }, 'Unknown role select menu interaction');
    await interaction.reply({
      content: '❌ Unknown role select menu interaction.',
      ephemeral: true,
    });
  } catch (error) {
    logger.error({ error, customId }, 'Role select menu interaction error');
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    if (interaction.deferred) {
      await interaction.editReply(`❌ ${errorMessage}`);
    } else if (!interaction.replied) {
      await interaction.reply({
        content: `❌ ${errorMessage}`,
        ephemeral: true,
      });
    }
  }
}

/**
 * Handle event role selection
 */
async function handleEventRoleSelect(interaction: any, eventId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const selectedRole = interaction.values[0];
  const { getUserDisplayName } = await import('../utils/discord.js');
  const { joinEvent } = await import('../services/participation.js');

  try {
    // Get user's roles from the guild member
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const userRoleIds = member.roles.cache.map((r: any) => r.id);

    const result = await joinEvent({
      eventId,
      userId: interaction.user.id,
      username: getUserDisplayName(interaction.user),
      role: selectedRole,
      userRoleIds,
    });

    const emoji = result.success ? '✅' : '❌';
    await interaction.editReply(`${emoji} ${result.message}`);
  } catch (error: any) {
    await interaction.editReply(`❌ ${error.message || 'Failed to join event'}`);
  }
}

/**
 * Handle interaction errors
 */
async function handleInteractionError(interaction: Interaction, error: unknown): Promise<void> {
  let message = '❌ An unexpected error occurred.';

  if (error instanceof CommandError) {
    message = `❌ ${error.message}`;
  } else if (error instanceof PermissionError) {
    message = `❌ Permission denied: ${error.message}`;
  } else if (error instanceof ValidationError) {
    message = `❌ Validation error: ${error.message}`;
  } else if (error instanceof Error) {
    message = `❌ Error: ${error.message}`;
  }

  try {
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(message);
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    }
  } catch (replyError) {
    logger.error({ error: replyError }, 'Failed to send error message to user');
  }
}
