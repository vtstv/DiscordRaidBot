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

const logger = getModuleLogger('interactionHandler');

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
      await handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModal(interaction);
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
  } catch (error) {
    logger.error({ error, command: interaction.commandName }, 'Command execution failed');
    throw error;
  }
}

/**
 * Handle select menu interactions
 */
async function handleSelectMenu(interaction: any): Promise<void> {
  const [action, ...params] = interaction.customId.split(':');

  logger.debug({ action, params, user: interaction.user.tag }, 'Select menu interaction');

  try {
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
