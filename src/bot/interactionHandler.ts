// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/bot/interactionHandler.ts
// Handle Discord interactions (slash commands, buttons, selects)

import { 
  Interaction, 
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';
import { getModuleLogger } from '../utils/logger.js';
import { getCommand } from './commandLoader.js';
import { CommandError, PermissionError, ValidationError } from '../utils/errors.js';
import { canEditEvent } from '../utils/permissions.js';
import { getUserDisplayName } from '../utils/discord.js';

const logger = getModuleLogger('interactionHandler');

/**
 * Main interaction handler
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
      content: 'This command is not available.',
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
 * Handle autocomplete interactions
 */
async function handleAutocomplete(interaction: any): Promise<void> {
  const { commandName, options } = interaction;
  
  if (commandName === 'event') {
    const focusedOption = options.getFocused(true);
    
    if (focusedOption.name === 'template') {
      const guildId = interaction.guild?.id;
      if (!guildId) return;

      const prisma = (await import('../database/db.js')).default();
      const templates = await prisma.template.findMany({
        where: { guildId },
        select: { name: true },
        take: 25,
      });

      const filtered = templates
        .filter(t => t.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
        .slice(0, 25);

      await interaction.respond(
        filtered.map(t => ({ name: t.name, value: t.name }))
      );
    } else if (focusedOption.name === 'event-id') {
      const guildId = interaction.guild?.id;
      if (!guildId) return;

      const prisma = (await import('../database/db.js')).default();
      const events = await prisma.event.findMany({
        where: { 
          guildId,
          status: { in: ['scheduled', 'active'] }
        },
        select: { id: true, title: true },
        orderBy: { startTime: 'asc' },
        take: 25,
      });

      const filtered = events
        .filter(e => 
          e.title.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
          e.id.toLowerCase().startsWith(focusedOption.value.toLowerCase())
        )
        .slice(0, 25);

      await interaction.respond(
        filtered.map(e => ({ 
          name: `${e.title} (${e.id.substring(0, 8)})`, 
          value: e.id 
        }))
      );
    }
  }
}

/**
 * Handle button interactions
 */
async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const [action, ...params] = interaction.customId.split(':');

  logger.debug({ action, params, user: interaction.user.tag }, 'Button interaction');

  const { joinEvent, leaveEvent } = await import('../services/participation.js');

  switch (action) {
    case 'event_join':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        const result = await joinEvent({
          eventId,
          userId: interaction.user.id,
          username: getUserDisplayName(interaction.user),
        });

        const emoji = result.success ? '✅' : '❌';
        await interaction.editReply(`${emoji} ${result.message}`);
      } catch (error: any) {
        await interaction.editReply(`❌ ${error.message || 'Failed to join event'}`);
      }
      break;

    case 'event_join_role':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        const role = params[1];
        
        const result = await joinEvent({
          eventId,
          userId: interaction.user.id,
          username: getUserDisplayName(interaction.user),
          role,
        });

        const emoji = result.success ? '✅' : '❌';
        await interaction.editReply(`${emoji} ${result.message}`);
      } catch (error: any) {
        await interaction.editReply(`❌ ${error.message || 'Failed to join event'}`);
      }
      break;

    case 'event_leave':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        const result = await leaveEvent(eventId, interaction.user.id, getUserDisplayName(interaction.user));

        const emoji = result.success ? '✅' : '❌';
        await interaction.editReply(`${emoji} ${result.message}`);
      } catch (error: any) {
        await interaction.editReply(`❌ ${error.message || 'Failed to leave event'}`);
      }
      break;

    case 'event_approve':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        const getPrismaClient = (await import('../database/db.js')).default;
        const prisma = getPrismaClient();
        const member = interaction.member instanceof GuildMember ? interaction.member : undefined;
        
        // Check if user can approve
        const hasPermission = await canEditEvent(
          interaction.user.id,
          eventId,
          member
        );

        if (!hasPermission) {
          await interaction.editReply('❌ Only the event creator or administrators can approve participants.');
          break;
        }

        // Get pending participants
        const pendingParticipants = await prisma.participant.findMany({
          where: { eventId, status: 'pending' },
          select: { userId: true, username: true },
        });

        if (pendingParticipants.length === 0) {
          await interaction.editReply('❌ No pending participants to approve.');
          break;
        }

        // Create select menu for approval
        const { StringSelectMenuBuilder: SelectMenuBuilder, ActionRowBuilder } = await import('discord.js');
        
        const options = pendingParticipants.map((p: any) => ({
          label: p.username,
          value: p.userId,
          description: 'Click to approve',
        }));

        const selectMenu = new SelectMenuBuilder()
          .setCustomId(`approve_select:${eventId}`)
          .setPlaceholder('Select participants to approve')
          .setMinValues(1)
          .setMaxValues(Math.min(options.length, 25))
          .addOptions(options);

        const row = new ActionRowBuilder<any>().addComponents(selectMenu);

        await interaction.editReply({
          content: `✅ **Approve Participants** (${pendingParticipants.length} pending)\\n\\nSelect one or more participants to approve:`,
          components: [row],
        });
      } catch (error: any) {
        logger.error({ error, eventId: params[0] }, 'Failed to handle approve button');
        await interaction.editReply(`❌ ${error.message || 'Failed to process approval request'}`);
      }
      break;

    case 'event_edit':
      await handleEventEdit(interaction, params[0]);
      break;

    default:
      logger.warn({ customId: interaction.customId }, 'Unknown button interaction');
      await interaction.reply({
        content: 'This button is not configured.',
        ephemeral: true,
      });
  }
}

/**
 * Handle select menu interactions
 */
async function handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  const [action, ...params] = interaction.customId.split(':');

  logger.debug({ action, params, values: interaction.values, user: interaction.user.tag }, 'Select menu interaction');

  const { updateParticipantRole, approveParticipants } = await import('../services/participation.js');

  switch (action) {
    case 'approve_select':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        const selectedUserIds = interaction.values;
        
        const result = await approveParticipants(
          eventId,
          selectedUserIds,
          interaction.user.id
        );

        await interaction.editReply(result.message);
      } catch (error: any) {
        await interaction.editReply(`❌ ${error.message || 'Failed to approve participants'}`);
      }
      break;

    case 'event_role':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        const selectedRole = interaction.values[0];
        
        const result = await updateParticipantRole(
          eventId,
          interaction.user.id,
          getUserDisplayName(interaction.user),
          selectedRole
        );

        const emoji = result.success ? '✅' : '❌';
        await interaction.editReply(`${emoji} ${result.message}`);
      } catch (error: any) {
        await interaction.editReply(`❌ ${error.message || 'Failed to update role'}`);
      }
      break;

    default:
      logger.warn({ customId: interaction.customId }, 'Unknown select menu interaction');
      await interaction.reply({
        content: 'This menu is not configured.',
        ephemeral: true,
      });
  }
}

/**
 * Handle modal submit interactions
 */
async function handleModal(interaction: ModalSubmitInteraction): Promise<void> {
  logger.debug({ customId: interaction.customId, user: interaction.user.tag }, 'Modal submit interaction');

  const [action, ...params] = interaction.customId.split(':');

  if (action === 'event_edit') {
    await handleEventEditSubmit(interaction, params[0]);
    return;
  }

  await interaction.reply({
    content: 'Modal functionality coming soon!',
    ephemeral: true,
  });
}

/**
 * Show event edit modal
 */
async function handleEventEdit(interaction: ButtonInteraction, eventId: string): Promise<void> {
  const getPrismaClient = (await import('../database/db.js')).default;
  const prisma = getPrismaClient();
  const member = interaction.member instanceof GuildMember ? interaction.member : undefined;

  // Check permissions
  const hasPermission = await canEditEvent(
    interaction.user.id,
    eventId,
    member
  );
  
  if (!hasPermission) {
    await interaction.reply({
      content: '❌ You do not have permission to edit this event.',
      ephemeral: true,
    });
    return;
  }

  // Get event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    await interaction.reply({
      content: '❌ Event not found.',
      ephemeral: true,
    });
    return;
  }

  // Create modal
  const modal = new ModalBuilder()
    .setCustomId(`event_edit:${eventId}`)
    .setTitle('Edit Event');

  const titleInput = new TextInputBuilder()
    .setCustomId('title')
    .setLabel('Event Title')
    .setStyle(TextInputStyle.Short)
    .setValue(event.title)
    .setRequired(true)
    .setMaxLength(100);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('description')
    .setLabel('Description')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(event.description || '')
    .setRequired(false)
    .setMaxLength(1000);

  const timeInput = new TextInputBuilder()
      .setCustomId('startTime')
      .setLabel('Start Time (DD.MM.YYYY HH:MM)')
      .setStyle(TextInputStyle.Short)
    .setValue(event.startTime.toISOString().replace('T', ' ').slice(0, 16))
    .setRequired(false)
    .setMaxLength(20);

  const maxParticipantsInput = new TextInputBuilder()
    .setCustomId('maxParticipants')
    .setLabel('Max Participants (leave empty for unlimited)')
    .setStyle(TextInputStyle.Short)
    .setValue(event.maxParticipants?.toString() || '')
    .setRequired(false)
    .setMaxLength(4);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(maxParticipantsInput)
  );

  await interaction.showModal(modal);
}

/**
 * Handle event edit modal submission
 */
async function handleEventEditSubmit(interaction: ModalSubmitInteraction, eventId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const getPrismaClient = (await import('../database/db.js')).default;
  const prisma = getPrismaClient();
  const { updateEventMessage } = await import('../messages/eventMessage.js');
  const { logAction } = await import('../services/auditLog.js');
  const { parseTime } = await import('../utils/time.js');

  const title = interaction.fields.getTextInputValue('title');
  const description = interaction.fields.getTextInputValue('description') || null;
  const startTimeStr = interaction.fields.getTextInputValue('startTime');
  const maxParticipantsStr = interaction.fields.getTextInputValue('maxParticipants');
  const maxParticipants = maxParticipantsStr ? parseInt(maxParticipantsStr, 10) : null;

  // Get current event for timezone
  const currentEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!currentEvent) {
    await interaction.editReply('❌ Event not found.');
    return;
  }

  // Parse start time if provided
  let startTime: Date | undefined;
  if (startTimeStr) {
    try {
      const parsed = parseTime(startTimeStr, currentEvent.timezone);
      if (!parsed) {
        await interaction.editReply('❌ Invalid time format.');
        return;
      }
      startTime = parsed.toJSDate();
    } catch (error) {
      await interaction.editReply('❌ Invalid time format. Use DD.MM.YYYY HH:MM or YYYY-MM-DD HH:MM');
      return;
    }
  }

  // Validate
  if (maxParticipants !== null && (isNaN(maxParticipants) || maxParticipants < 1)) {
    await interaction.editReply('❌ Invalid max participants value.');
    return;
  }

  // Update event
  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description,
      ...(startTime && { startTime }),
      maxParticipants,
    },
  });

  // Update message
  await updateEventMessage(eventId);

  // Log action
  await logAction({
    guildId: event.guildId,
    eventId,
    action: 'edit_event',
    userId: interaction.user.id,
    username: getUserDisplayName(interaction.user),
    details: { title, description, maxParticipants },
  });

  await interaction.editReply('✅ Event updated successfully!');
}

/**
 * Handle interaction errors
 */
async function handleInteractionError(interaction: Interaction, error: unknown): Promise<void> {
  const err = error as any;
  const errorMessage = (error instanceof CommandError || error instanceof PermissionError || error instanceof ValidationError)
    ? err.message
    : 'An error occurred while processing your request.';

  logger.error({ 
    error: err, 
    message: err?.message, 
    stack: err?.stack,
    interactionType: interaction.type 
  }, 'Interaction error details');

  const replyOptions = {
    content: `❌ ${errorMessage}`,
    ephemeral: true,
  };

  try {
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyOptions);
      } else {
        await interaction.reply(replyOptions);
      }
    }
  } catch (replyError) {
    logger.error({ error: replyError }, 'Failed to send error message');
  }
}
