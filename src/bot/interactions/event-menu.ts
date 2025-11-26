// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Event management menu - shown when user clicks "Edit Event" button

import { 
  ButtonInteraction, 
  GuildMember, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';
import { getModuleLogger } from '../../utils/logger.js';
import { canEditEvent } from '../../utils/permissions.js';
import getPrismaClient from '../../database/db.js';

const logger = getModuleLogger('event-menu');

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
 * Show ephemeral menu with options based on user permissions
 * - For participants: View Details, Edit Note
 * - For creators/admins: View Details, Edit Note, Edit Event
 */
export async function handleEventMenu(interaction: ButtonInteraction, eventId: string): Promise<void> {
  const prisma = getPrismaClient();
  const member = interaction.member instanceof GuildMember ? interaction.member : undefined;

  // Get event data
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      channelId: true,
      allowNotes: true,
      guild: {
        select: {
          allowParticipantNotes: true,
          participantNoteMaxLength: true,
          noteChannels: true,
        },
      },
    },
  });

  if (!event) {
    await interaction.reply({
      content: '❌ Event not found.',
      ephemeral: true,
    });
    return;
  }

  // Check if user is a participant
  const participant = await prisma.participant.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: interaction.user.id,
      },
    },
    select: {
      id: true,
      userId: true,
      username: true,
      role: true,
      spec: true,
      status: true,
      position: true,
      note: true,
      joinedAt: true,
    },
  });

  // Check if user can edit event (creator or admin)
  const canEdit = await canEditEvent(interaction.user.id, eventId, member);

  // Check if notes are allowed for this event
  const notesAllowed = areNotesAllowed(
    event.channelId,
    event.allowNotes,
    event.guild.allowParticipantNotes,
    event.guild.noteChannels
  );

  // Build menu embed with participant details
  const embed = new EmbedBuilder()
    .setTitle(`⚙️ ${event.title} - Options`)
    .setColor(0x5865F2)
    .setTimestamp();

  if (participant) {
    // Show participant details immediately
    embed.setDescription('Your Sign-Up Details');
    embed.addFields(
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
  } else {
    embed.setDescription('You are not currently signed up for this event.');
  }

  // Build buttons
  const buttons: ButtonBuilder[] = [];

  // Note button (available to participants if notes are enabled)
  if (participant && notesAllowed) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`event_edit_note:${eventId}`)
        .setLabel('📝 Note')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  // Edit Event button (available to creator/admin)
  if (canEdit) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`event_edit:${eventId}`)
        .setLabel('⚙️ Edit Event')
        .setStyle(ButtonStyle.Success)
    );
  }

  // If no buttons available, show info message
  if (buttons.length === 0) {
    await interaction.reply({
      content: '❌ No options available. You must be signed up to access participant options.',
      ephemeral: true,
    });
    return;
  }

  // Send ephemeral message with menu
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttons.slice(i, i + 5)
      )
    );
  }

  await interaction.reply({
    embeds: [embed],
    components: rows,
    ephemeral: true,
  });

  logger.debug(
    { eventId, userId: interaction.user.id, isParticipant: !!participant, canEdit },
    'Event menu displayed'
  );
}
