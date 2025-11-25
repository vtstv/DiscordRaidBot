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
  } else if (commandName === 'template') {
    const focusedOption = options.getFocused(true);
    
    if (focusedOption.name === 'name') {
      const guildId = interaction.guild?.id;
      if (!guildId) return;

      const prisma = (await import('../database/db.js')).default();
      const templates = await prisma.template.findMany({
        where: { guildId },
        select: { name: true, description: true },
        orderBy: { name: 'asc' },
        take: 25,
      });

      const filtered = templates
        .filter(t => t.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
        .slice(0, 25);

      await interaction.respond(
        filtered.map(t => ({ 
          name: t.description ? `${t.name} - ${t.description.substring(0, 50)}` : t.name, 
          value: t.name 
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

  // Check event status for join/leave actions
  if (action === 'event_join' || action === 'event_join_role' || action === 'event_leave') {
    const eventId = params[0];
    const getPrismaClient = (await import('../database/db.js')).default;
    const prisma = getPrismaClient();
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { status: true, title: true },
    });

    if (!event) {
      await interaction.reply({ content: '❌ Event not found.', ephemeral: true });
      return;
    }

    if (event.status === 'active') {
      await interaction.reply({ 
        content: `❌ Registration is closed. Event "${event.title}" has already started.`, 
        ephemeral: true 
      });
      return;
    }

    if (event.status === 'completed') {
      await interaction.reply({ 
        content: `❌ Event "${event.title}" has already been completed.`, 
        ephemeral: true 
      });
      return;
    }

    if (event.status === 'cancelled') {
      await interaction.reply({ 
        content: `❌ Event "${event.title}" has been cancelled.`, 
        ephemeral: true 
      });
      return;
    }
  }

  switch (action) {
    case 'event_join':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        // Get user's roles from the guild member
        const member = await interaction.guild!.members.fetch(interaction.user.id);
        const userRoleIds = member.roles.cache.map(r => r.id);
        
        const result = await joinEvent({
          eventId,
          userId: interaction.user.id,
          username: getUserDisplayName(interaction.user),
          userRoleIds,
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
        // Get user's roles from the guild member
        const member = await interaction.guild!.members.fetch(interaction.user.id);
        const userRoleIds = member.roles.cache.map(r => r.id);
        
        const result = await joinEvent({
          eventId,
          userId: interaction.user.id,
          username: getUserDisplayName(interaction.user),
          role,
          userRoleIds,
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
          select: { userId: true, username: true, role: true },
        });

        if (pendingParticipants.length === 0) {
          await interaction.editReply('❌ No pending participants to approve.');
          break;
        }

        // Create buttons for approval
        const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = await import('discord.js');
        
        // Build participant list text
        let participantList = `✅ **Approve Participants** (${pendingParticipants.length} pending)\n\n`;
        participantList += pendingParticipants.map((p: any, i: number) => {
          const roleInfo = p.role ? ` [${p.role}]` : '';
          return `${i + 1}. <@${p.userId}>${roleInfo}`;
        }).join('\n');

        const components: any[] = [];

        // Add "Approve All" button
        const approveAllRow = new ActionRowBuilder<any>().addComponents(
          new ButtonBuilder()
            .setCustomId(`approve_all:${eventId}`)
            .setLabel(`Approve All (${pendingParticipants.length})`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
        );
        components.push(approveAllRow);

        // Add individual approve buttons (up to 20 participants, 4 per row)
        let currentRow: any = null;
        for (let i = 0; i < Math.min(pendingParticipants.length, 20); i++) {
          if (i % 4 === 0) {
            if (currentRow) components.push(currentRow);
            currentRow = new ActionRowBuilder<any>();
          }
          
          const p = pendingParticipants[i];
          currentRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`approve_user:${eventId}:${p.userId}`)
              .setLabel(`${i + 1}`)
              .setStyle(ButtonStyle.Primary)
          );
        }
        if (currentRow && currentRow.components.length > 0) {
          components.push(currentRow);
        }

        await interaction.editReply({
          content: participantList + '\n\n_Click a number to approve individual participant, or "Approve All" to approve everyone._',
          components,
        });
      } catch (error: any) {
        logger.error({ error, eventId: params[0] }, 'Failed to handle approve button');
        await interaction.editReply(`❌ ${error.message || 'Failed to process approval request'}`);
      }
      break;

    case 'approve_all':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        const getPrismaClient = (await import('../database/db.js')).default;
        const prisma = getPrismaClient();
        
        // Get all pending participants
        const pendingParticipants = await prisma.participant.findMany({
          where: { eventId, status: 'pending' },
          select: { userId: true },
        });

        if (pendingParticipants.length === 0) {
          await interaction.editReply('❌ No pending participants to approve.');
          break;
        }

        const userIds = pendingParticipants.map((p: any) => p.userId);
        const { approveParticipants } = await import('../services/participation.js');
        
        const result = await approveParticipants(
          eventId,
          userIds,
          interaction.user.id
        );

        await interaction.editReply(`✅ Approved ${result.approved} participant(s)!`);
      } catch (error: any) {
        logger.error({ error, eventId: params[0] }, 'Failed to approve all participants');
        await interaction.editReply(`❌ ${error.message || 'Failed to approve participants'}`);
      }
      break;

    case 'approve_user':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        const userId = params[1];
        
        const { approveParticipants } = await import('../services/participation.js');
        
        const result = await approveParticipants(
          eventId,
          [userId],
          interaction.user.id
        );

        if (result.approved > 0) {
          await interaction.editReply(`✅ Participant approved!`);
        } else {
          await interaction.editReply(`❌ Could not approve participant (may be full or already approved).`);
        }
      } catch (error: any) {
        logger.error({ error, eventId: params[0], userId: params[1] }, 'Failed to approve user');
        await interaction.editReply(`❌ ${error.message || 'Failed to approve participant'}`);
      }
      break;

    case 'event_promote':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        const getPrismaClient = (await import('../database/db.js')).default;
        const prisma = getPrismaClient();
        const member = interaction.member instanceof GuildMember ? interaction.member : undefined;
        
        // Check if user can promote
        const hasPermission = await canEditEvent(
          interaction.user.id,
          eventId,
          member
        );

        if (!hasPermission) {
          await interaction.editReply('❌ Only the event creator or administrators can promote participants.');
          break;
        }

        // Get waitlisted participants
        const waitlistedParticipants = await prisma.participant.findMany({
          where: { eventId, status: 'waitlist' },
          orderBy: { position: 'asc' },
          select: { userId: true, username: true, role: true, position: true },
        });

        if (waitlistedParticipants.length === 0) {
          await interaction.editReply('❌ No waitlisted participants to promote.');
          break;
        }

        // Create buttons for promotion
        const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = await import('discord.js');
        
        // Build participant list text
        let participantList = `⬆️ **Promote from Bench** (${waitlistedParticipants.length} on bench)\n\n`;
        participantList += waitlistedParticipants.map((p: any) => {
          const roleInfo = p.role ? ` [${p.role}]` : '';
          return `${p.position}. <@${p.userId}>${roleInfo}`;
        }).join('\n');

        const components: any[] = [];

        // Add individual promote buttons (up to 20 participants, 4 per row)
        let currentRow: any = null;
        for (let i = 0; i < Math.min(waitlistedParticipants.length, 20); i++) {
          if (i % 4 === 0) {
            if (currentRow) components.push(currentRow);
            currentRow = new ActionRowBuilder<any>();
          }
          
          const p = waitlistedParticipants[i];
          currentRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`promote_user:${eventId}:${p.userId}`)
              .setLabel(`${p.position}`)
              .setStyle(ButtonStyle.Primary)
          );
        }
        if (currentRow) components.push(currentRow);

        // Add "Promote Next" button at the end
        const promoteNextRow = new ActionRowBuilder<any>().addComponents(
          new ButtonBuilder()
            .setCustomId(`promote_next:${eventId}`)
            .setLabel('Promote Next in Queue')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⬆️')
        );
        components.push(promoteNextRow);

        await interaction.editReply({
          content: participantList,
          components,
        });
      } catch (error: any) {
        logger.error({ error, eventId: params[0] }, 'Failed to show promote menu');
        await interaction.editReply(`❌ ${error.message || 'Failed to show promote menu'}`);
      }
      break;

    case 'promote_user':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        const userId = params[1];
        
        const { promoteParticipant } = await import('../services/participation.js');
        
        const result = await promoteParticipant(
          eventId,
          userId,
          interaction.user.id
        );

        await interaction.editReply(`${result.success ? '✅' : '❌'} ${result.message}`);
      } catch (error: any) {
        logger.error({ error, eventId: params[0], userId: params[1] }, 'Failed to promote user');
        await interaction.editReply(`❌ ${error.message || 'Failed to promote participant'}`);
      }
      break;

    case 'promote_next':
      await interaction.deferReply({ ephemeral: true });
      try {
        const eventId = params[0];
        
        const { promoteNext } = await import('../services/participation.js');
        
        const result = await promoteNext(
          eventId,
          interaction.user.id
        );

        await interaction.editReply(`${result.success ? '✅' : '❌'} ${result.message}`);
      } catch (error: any) {
        logger.error({ error, eventId: params[0] }, 'Failed to promote next');
        await interaction.editReply(`❌ ${error.message || 'Failed to promote next participant'}`);
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

  const { updateParticipantRole } = await import('../services/participation.js');

  switch (action) {
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
