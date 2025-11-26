// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Participant note management

import { 
  ButtonInteraction, 
  ModalSubmitInteraction,
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  EmbedBuilder
} from 'discord.js';
import { getModuleLogger } from '../../utils/logger.js';
import getPrismaClient from '../../database/db.js';
import { logAction } from '../../services/auditLog.js';
import { getUserDisplayName } from '../../utils/discord.js';

const logger = getModuleLogger('participant-note');

/**
 * Check if notes are allowed for event based on guild and event settings
 */
function areNotesAllowed(
  eventChannelId: string,
  eventAllowNotes: boolean | null,
  guildAllowNotes: boolean,
  guildNoteChannels: string[]
): boolean {
  // If event explicitly disallows notes, return false
  if (eventAllowNotes === false) return false;
  
  // If event explicitly allows notes, check channel list
  if (eventAllowNotes === true) {
    // Empty list = all channels
    if (guildNoteChannels.length === 0) return true;
    return guildNoteChannels.includes(eventChannelId);
  }
  
  // Event setting is null, use guild default
  if (!guildAllowNotes) return false;
  
  // Empty list = all channels
  if (guildNoteChannels.length === 0) return true;
  return guildNoteChannels.includes(eventChannelId);
}

/**
 * Show participant's sign-up details
 */
export async function handleViewDetails(interaction: ButtonInteraction, eventId: string): Promise<void> {
  const prisma = getPrismaClient();

  // Get participant data
  const participant = await prisma.participant.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: interaction.user.id,
      },
    },
    include: {
      event: {
        select: {
          title: true,
          startTime: true,
        },
      },
    },
  });

  if (!participant) {
    await interaction.reply({
      content: '❌ You are not signed up for this event.',
      ephemeral: true,
    });
    return;
  }

  // Build details embed
  const embed = new EmbedBuilder()
    .setTitle('📋 Your Sign-Up Details')
    .setColor(0x5865F2)
    .addFields(
      { name: 'Event', value: participant.event.title, inline: false },
      { name: 'Status', value: participant.status, inline: true },
      { name: 'Joined At', value: `<t:${Math.floor(participant.joinedAt.getTime() / 1000)}:R>`, inline: true }
    );

  if (participant.role) {
    embed.addFields({ name: 'Role', value: participant.role, inline: true });
  }

  if (participant.spec) {
    embed.addFields({ name: 'Spec', value: participant.spec, inline: true });
  }

  if (participant.note) {
    embed.addFields({ name: 'Your Note', value: participant.note, inline: false });
  }

  if (participant.position) {
    embed.addFields({ name: 'Position', value: `#${participant.position}`, inline: true });
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });

  logger.debug({ eventId, userId: interaction.user.id }, 'Participant viewed their details');
}

/**
 * Show modal for editing participant note
 */
export async function handleEditNote(interaction: ButtonInteraction, eventId: string): Promise<void> {
  const prisma = getPrismaClient();

  // Get participant and event settings
  const participant = await prisma.participant.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: interaction.user.id,
      },
    },
    include: {
      event: {
        select: {
          channelId: true,
          allowNotes: true,
          guild: {
            select: {
              participantNoteMaxLength: true,
              allowParticipantNotes: true,
              noteChannels: true,
            },
          },
        },
      },
    },
  });

  if (!participant) {
    await interaction.reply({
      content: '❌ You are not signed up for this event.',
      ephemeral: true,
    });
    return;
  }

  // Check if notes are allowed
  const notesAllowed = areNotesAllowed(
    participant.event.channelId,
    participant.event.allowNotes,
    participant.event.guild.allowParticipantNotes,
    participant.event.guild.noteChannels
  );
  
  if (!notesAllowed) {
    await interaction.reply({
      content: '❌ Notes are not allowed for this event.',
      ephemeral: true,
    });
    return;
  }

  const maxLength = participant.event.guild.participantNoteMaxLength;

  // Create modal
  const modal = new ModalBuilder()
    .setCustomId(`participant_edit_note:${eventId}`)
    .setTitle('Edit Your Note');

  const noteInput = new TextInputBuilder()
    .setCustomId('note')
    .setLabel(`Your Note (max ${maxLength} characters)`)
    .setStyle(TextInputStyle.Short)
    .setValue(participant.note || '')
    .setRequired(false)
    .setMaxLength(maxLength);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput)
  );

  await interaction.showModal(modal);

  logger.debug({ eventId, userId: interaction.user.id }, 'Edit note modal shown');
}

/**
 * Handle note edit submission
 */
export async function handleEditNoteSubmit(
  interaction: ModalSubmitInteraction, 
  eventId: string
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const prisma = getPrismaClient();
  const note = interaction.fields.getTextInputValue('note').trim();

  // Verify participant exists
  const participant = await prisma.participant.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: interaction.user.id,
      },
    },
    include: {
      event: {
        select: {
          channelId: true,
          guildId: true,
          allowNotes: true,
          guild: {
            select: {
              participantNoteMaxLength: true,
              allowParticipantNotes: true,
              noteChannels: true,
            },
          },
        },
      },
    },
  });

  if (!participant) {
    await interaction.editReply('❌ You are not signed up for this event.');
    return;
  }

  // Check if notes are allowed
  const notesAllowed = areNotesAllowed(
    participant.event.channelId,
    participant.event.allowNotes,
    participant.event.guild.allowParticipantNotes,
    participant.event.guild.noteChannels
  );
  
  if (!notesAllowed) {
    await interaction.editReply('❌ Notes are not allowed for this event.');
    return;
  }

  // Validate length
  const maxLength = participant.event.guild.participantNoteMaxLength;
  if (note.length > maxLength) {
    await interaction.editReply(`❌ Note must be ${maxLength} characters or less.`);
    return;
  }

  try {
    // Update participant note
    await prisma.participant.update({
      where: {
        eventId_userId: {
          eventId,
          userId: interaction.user.id,
        },
      },
      data: {
        note: note || null,
      },
    });

    // Update event message to show new note
    const { updateEventMessage } = await import('../../messages/eventMessage.js');
    await updateEventMessage(eventId);

    // Log action
    await logAction({
      guildId: participant.event.guildId,
      eventId,
      action: 'edit_participant_note',
      userId: interaction.user.id,
      username: getUserDisplayName(interaction.user),
      details: {
        note: note || '(removed)',
      },
    });

    logger.info({ eventId, userId: interaction.user.id }, 'Participant note updated');

    await interaction.editReply(
      note 
        ? `✅ Your note has been updated: "${note}"`
        : '✅ Your note has been removed.'
    );

  } catch (error: any) {
    logger.error({ error, eventId, userId: interaction.user.id }, 'Failed to update note');
    await interaction.editReply(`❌ ${error.message || 'Failed to update note'}`);
  }
}
