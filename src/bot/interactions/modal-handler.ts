// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Modal submit interaction handlers

import { ModalSubmitInteraction } from 'discord.js';
import { getModuleLogger } from '../../utils/logger.js';
import { handleEventEditSubmit } from './event-edit.js';

const logger = getModuleLogger('modal-handler');

export async function handleModal(interaction: ModalSubmitInteraction): Promise<void> {
  const [action, ...params] = interaction.customId.split(':');

  logger.debug({ action, params, user: interaction.user.tag }, 'Modal submit interaction');

  try {
    switch (action) {
      case 'event_edit':
        await handleEventEditSubmit(interaction, params[0]);
        break;

      default:
        logger.warn({ customId: interaction.customId }, 'Unknown modal interaction');
        await interaction.reply({
          content: '❌ Unknown modal interaction.',
          ephemeral: true,
        });
    }
  } catch (error) {
    logger.error({ error, customId: interaction.customId }, 'Modal interaction error');
    
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
