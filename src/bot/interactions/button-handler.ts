// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Button interaction router

import { ButtonInteraction } from 'discord.js';
import { getModuleLogger } from '../../utils/logger.js';
import { 
  handleEventSignup,
  handleJoin,
  handleLeave,
  handleApprove,
  handleApproveAll,
  handleApproveUser,
  handlePromote,
  handlePromoteUser,
  handlePromoteNext
} from './event-signup.js';
import { handleEventEdit } from './event-edit.js';
import { handleStatsViewPersonal, handleStatsRefresh } from './stats.js';
import getPrismaClient from '../../database/db.js';

const logger = getModuleLogger('button-handler');

export async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const [action, ...params] = interaction.customId.split(':');

  logger.debug({ action, params, user: interaction.user.tag }, 'Button interaction');

  try {
    // Stats buttons
    if (action === 'stats_view_personal') {
      await handleStatsViewPersonal(interaction);
      return;
    }

    if (action === 'stats_refresh') {
      await handleStatsRefresh(interaction);
      return;
    }

    // Event participation buttons
    if (action.startsWith('event_')) {
      const eventId = params[0];
      
      // Check event status for join/leave actions
      if (action === 'event_join' || action === 'event_join_role' || action === 'event_leave') {
        const prisma = getPrismaClient();
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: { status: true },
        });

        if (!event) {
          await interaction.reply({
            content: '❌ Event not found.',
            ephemeral: true,
          });
          return;
        }

        if (event.status === 'completed') {
          await interaction.reply({
            content: '❌ This event has already been completed.',
            ephemeral: true,
          });
          return;
        }

        if (event.status === 'cancelled') {
          await interaction.reply({
            content: '❌ This event has been cancelled.',
            ephemeral: true,
          });
          return;
        }
      }

      // Route to specific handlers
      switch (action) {
        case 'event_signup':
          await handleEventSignup(interaction, eventId);
          break;
        case 'event_join':
          await handleJoin(interaction, eventId);
          break;
        case 'event_join_role':
          await handleJoin(interaction, eventId, params[1]);
          break;
        case 'event_leave':
          await handleLeave(interaction, eventId);
          break;
        case 'event_approve':
          await handleApprove(interaction, eventId);
          break;
        case 'approve_all':
          await handleApproveAll(interaction, eventId);
          break;
        case 'approve_user':
          await handleApproveUser(interaction, eventId, params[1]);
          break;
        case 'event_promote':
          await handlePromote(interaction, eventId);
          break;
        case 'promote_user':
          await handlePromoteUser(interaction, eventId, params[1]);
          break;
        case 'promote_next':
          await handlePromoteNext(interaction, eventId);
          break;
        case 'event_edit':
          await handleEventEdit(interaction, eventId);
          break;
        default:
          logger.warn({ customId: interaction.customId }, 'Unknown event button action');
          await interaction.reply({
            content: '❌ Unknown button action.',
            ephemeral: true,
          });
      }
      return;
    }

    // Unknown button
    logger.warn({ customId: interaction.customId }, 'Unknown button interaction');
    await interaction.reply({
      content: '❌ Unknown button interaction.',
      ephemeral: true,
    });

  } catch (error) {
    logger.error({ error, customId: interaction.customId }, 'Button interaction error');
    
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
