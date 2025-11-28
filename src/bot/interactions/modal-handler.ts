// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Modal submit interaction handlers

import { ModalSubmitInteraction } from 'discord.js';
import { getModuleLogger } from '../../utils/logger.js';
import { handleEventEditSubmit } from './event-edit.js';
import { handleEditNoteSubmit } from './participant-note.js';

const logger = getModuleLogger('modal-handler');

export async function handleModal(interaction: ModalSubmitInteraction): Promise<void> {
  const [action, ...params] = interaction.customId.split(':');

  logger.debug({ action, params, user: interaction.user.tag }, 'Modal submit interaction');

  try {
    // Config modals (use underscores)
    if (interaction.customId.startsWith('config_modal_')) {
      await handleConfigModal(interaction);
      return;
    }

    switch (action) {
      case 'event_edit':
        await handleEventEditSubmit(interaction, params[0]);
        break;
      
      case 'participant_edit_note':
        await handleEditNoteSubmit(interaction, params[0]);
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

async function handleConfigModal(interaction: ModalSubmitInteraction): Promise<void> {
  const customId = interaction.customId;

  if (customId === 'config_modal_voice_duration') {
    const { handleVoiceDuration } = await import('../../commands/config/handlers/voice.js');
    await handleVoiceDuration(interaction);
  } else if (customId === 'config_modal_voice_create_before') {
    const { handleVoiceCreateBefore } = await import('../../commands/config/handlers/voice.js');
    await handleVoiceCreateBefore(interaction);
  } else if (
    customId === 'config_modal_reminders' ||
    customId === 'config_modal_auto_delete' ||
    customId === 'config_modal_log_retention'
  ) {
    const { handleAutomationModal } = await import('../../commands/config/handlers/automation.js');
    await handleAutomationModal(interaction);
  } else if (customId === 'config_modal_command_prefix') {
    const { handlePermissionsModal } = await import('../../commands/config/handlers/permissions.js');
    await handlePermissionsModal(interaction);
  } else if (customId === 'config_modal_stats_min_events') {
    const { handleStatisticsModal } = await import('../../commands/config/handlers/statistics.js');
    await handleStatisticsModal(interaction);
  }
}
