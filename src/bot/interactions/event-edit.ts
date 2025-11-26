// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Event edit interaction handlers

import { ButtonInteraction, ModalSubmitInteraction, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { getModuleLogger } from '../../utils/logger.js';
import { canEditEvent } from '../../utils/permissions.js';
import getPrismaClient from '../../database/db.js';

const logger = getModuleLogger('event-edit');

export async function handleEventEdit(interaction: ButtonInteraction, eventId: string): Promise<void> {
  const prisma = getPrismaClient();
  const member = interaction.member instanceof GuildMember ? interaction.member : undefined;

  const hasPermission = await canEditEvent(interaction.user.id, eventId, member);
  
  if (!hasPermission) {
    await interaction.reply({
      content: '❌ You do not have permission to edit this event.',
      ephemeral: true,
    });
    return;
  }

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

export async function handleEventEditSubmit(interaction: ModalSubmitInteraction, eventId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const prisma = getPrismaClient();
  const member = interaction.member instanceof GuildMember ? interaction.member : undefined;

  const hasPermission = await canEditEvent(interaction.user.id, eventId, member);
  
  if (!hasPermission) {
    await interaction.editReply('❌ You do not have permission to edit this event.');
    return;
  }

  const title = interaction.fields.getTextInputValue('title');
  const description = interaction.fields.getTextInputValue('description');
  const startTimeStr = interaction.fields.getTextInputValue('startTime');
  const maxParticipantsStr = interaction.fields.getTextInputValue('maxParticipants');

  try {
    const updateData: any = { title, description };

    if (startTimeStr.trim()) {
      const startTime = new Date(startTimeStr);
      if (isNaN(startTime.getTime())) {
        await interaction.editReply('❌ Invalid date format. Use DD.MM.YYYY HH:MM');
        return;
      }
      updateData.startTime = startTime;
    }

    if (maxParticipantsStr.trim()) {
      const maxParticipants = parseInt(maxParticipantsStr);
      if (isNaN(maxParticipants) || maxParticipants < 1) {
        await interaction.editReply('❌ Max participants must be a positive number.');
        return;
      }
      updateData.maxParticipants = maxParticipants;
    } else {
      updateData.maxParticipants = null;
    }

    await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    const { updateEventMessage } = await import('../../messages/eventMessage.js');
    await updateEventMessage(eventId);

    await interaction.editReply('✅ Event updated successfully!');
  } catch (error: any) {
    logger.error({ error, eventId }, 'Failed to update event');
    await interaction.editReply(`❌ ${error.message || 'Failed to update event'}`);
  }
}
