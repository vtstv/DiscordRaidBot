// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Notes handlers

import { 
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
} from 'discord.js';
import getPrismaClient from '../../../database/db.js';

const prisma = getPrismaClient();

export async function handleNotesAction(
  interaction: StringSelectMenuInteraction, 
  value: string
): Promise<void> {
  const guildId = interaction.guild!.id;

  switch (value) {
    case 'toggle_notes':
      await handleToggleNotes(interaction);
      break;
    
    case 'note_length':
      await showNoteLengthModal(interaction);
      break;
    
    case 'toggle_view_online':
      await handleToggleViewOnline(interaction);
      break;
  }
}

async function handleToggleNotes(interaction: StringSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const newValue = !guild?.allowParticipantNotes;

  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild!.name, allowParticipantNotes: newValue },
    update: { allowParticipantNotes: newValue },
  });

  const { showNotesMenu } = await import('../menus/others.js');
  await showNotesMenu(interaction);
}

async function showNoteLengthModal(interaction: StringSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const modal = new ModalBuilder()
    .setCustomId('config_modal_note_length')
    .setTitle('Set Max Note Length');

  const input = new TextInputBuilder()
    .setCustomId('note_length')
    .setLabel('Maximum characters (10-500)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(3)
    .setValue(String((guild as any)?.participantNoteMaxLength || 30));

  const row = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function handleToggleViewOnline(interaction: StringSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const guild = await prisma.guild.findUnique({ where: { id: guildId } });

  const newValue = !((guild as any)?.showViewOnlineButton !== false);

  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild!.name, showViewOnlineButton: newValue },
    update: { showViewOnlineButton: newValue },
  });

  const { showNotesMenu } = await import('../menus/others.js');
  await showNotesMenu(interaction);
}

export async function handleNoteLengthModal(interaction: any): Promise<void> {
  const guildId = interaction.guild!.id;
  const value = interaction.fields.getTextInputValue('note_length');
  const length = parseInt(value, 10);

  if (isNaN(length) || length < 10 || length > 500) {
    await interaction.reply({
      content: '❌ Invalid length. Please enter a number between 10 and 500.',
      ephemeral: true,
    });
    return;
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild!.name, participantNoteMaxLength: length },
    update: { participantNoteMaxLength: length },
  });

  await interaction.reply({
    content: `✅ Max note length set to ${length} characters.`,
    ephemeral: true,
  });
}
