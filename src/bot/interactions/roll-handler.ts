// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/bot/interactions/roll-handler.ts

import { 
  ButtonInteraction, 
  ModalBuilder, 
  ModalSubmitInteraction,
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ModalActionRowComponentBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { RollGeneratorService } from '../../services/rollGenerator/index.js';
import db from '../../database/db.js';
import { logger } from '../../utils/logger.js';

export async function handleRollButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  const [action, subAction, rollGeneratorId] = interaction.customId.split('_');

  if (action !== 'roll') return;

  try {
    if (subAction === 'do') {
      await handleRollDo(interaction, rollGeneratorId);
    } else if (subAction === 'edit') {
      await handleRollEdit(interaction, rollGeneratorId);
    } else if (subAction === 'close') {
      await handleRollClose(interaction, rollGeneratorId);
    }
  } catch (error) {
    logger.error({ err: error, customId: interaction.customId }, 'Error handling roll button interaction');
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while processing your request.',
        ephemeral: true,
      });
    }
  }
}

async function handleRollDo(interaction: ButtonInteraction, rollGeneratorId: string): Promise<void> {
  const rollService = new RollGeneratorService(interaction.client);
  
  const result = await rollService.handleRoll(
    rollGeneratorId,
    interaction.user.id,
    interaction.user.displayName || interaction.user.username
  );

  await interaction.reply({
    content: result.success ? `🎲 ${result.message}` : `❌ ${result.message}`,
    ephemeral: true,
  });

  // Update message if roll was successful
  if (result.success) {
    await rollService.updateRollMessage(rollGeneratorId);
  }
}

async function handleRollEdit(interaction: ButtonInteraction, rollGeneratorId: string): Promise<void> {
  // Show ephemeral message with edit options
  await interaction.reply({
    content: '⚙️ **Edit Options**\nChoose what you want to edit:',
    ephemeral: true,
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`roll_edittitle_${rollGeneratorId}`)
            .setLabel('Edit Title')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`roll_editdesc_${rollGeneratorId}`)
            .setLabel('Edit Description')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`roll_toggleusername_${rollGeneratorId}`)
            .setLabel('Toggle Usernames')
            .setStyle(ButtonStyle.Secondary)
        ),
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`roll_editmaxshown_${rollGeneratorId}`)
            .setLabel('Amount Displayed')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`roll_close_${rollGeneratorId}`)
            .setLabel('Close Roll Generator')
            .setStyle(ButtonStyle.Danger)
        ),
    ],
  });
}

async function handleRollClose(interaction: ButtonInteraction, rollGeneratorId: string): Promise<void> {
  const rollGenerator = await db().rollGenerator.findUnique({
    where: { id: rollGeneratorId },
  });

  if (!rollGenerator) {
    await interaction.reply({
      content: '❌ Roll generator not found.',
      ephemeral: true,
    });
    return;
  }

  // Check if user is creator, admin, or manager
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: '❌ This command can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const isCreator = rollGenerator.createdBy === interaction.user.id;
  const isAdmin = member.permissions.has('Administrator');
  
  const guild = await db().guild.findUnique({
    where: { id: interaction.guildId! },
  });
  const isManager = guild?.managerRoleId && member.roles.cache.has(guild.managerRoleId);

  if (!isCreator && !isAdmin && !isManager) {
    await interaction.reply({
      content: '❌ Only the creator, administrators, or managers can close this roll generator.',
      ephemeral: true,
    });
    return;
  }

  const rollService = new RollGeneratorService(interaction.client);
  await rollService.closeRollGenerator(rollGeneratorId);

  await interaction.reply({
    content: '✅ Roll generator closed successfully!',
    ephemeral: true,
  });
}

// Handle edit subactions (title, description, etc.)
export async function handleRollEditInteraction(interaction: ButtonInteraction): Promise<void> {
  const [action, subAction, rollGeneratorId] = interaction.customId.split('_');

  if (action !== 'roll') return;

  const rollGenerator = await db().rollGenerator.findUnique({
    where: { id: rollGeneratorId },
  });

  if (!rollGenerator) {
    await interaction.reply({
      content: '❌ Roll generator not found.',
      ephemeral: true,
    });
    return;
  }

  // Check permissions
  const member = await interaction.guild!.members.fetch(interaction.user.id);
  const isCreator = rollGenerator.createdBy === interaction.user.id;
  const isAdmin = member.permissions.has('Administrator');
  
  const guild = await db().guild.findUnique({
    where: { id: interaction.guildId! },
  });
  const isManager = guild?.managerRoleId && member.roles.cache.has(guild.managerRoleId);

  if (!isCreator && !isAdmin && !isManager) {
    await interaction.reply({
      content: '❌ Only the creator can edit this roll generator.',
      ephemeral: true,
    });
    return;
  }

  if (subAction === 'edittitle') {
    const modal = new ModalBuilder()
      .setCustomId(`roll_modaltitle_${rollGeneratorId}`)
      .setTitle('Edit Title');

    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setValue(rollGenerator.title)
      .setRequired(true)
      .setMaxLength(100);

    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(titleInput)
    );

    await interaction.showModal(modal);
  } else if (subAction === 'editdesc') {
    const modal = new ModalBuilder()
      .setCustomId(`roll_modaldesc_${rollGeneratorId}`)
      .setTitle('Edit Description');

    const descInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Description')
      .setStyle(TextInputStyle.Paragraph)
      .setValue(rollGenerator.description || '')
      .setRequired(false)
      .setMaxLength(500);

    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(descInput)
    );

    await interaction.showModal(modal);
  } else if (subAction === 'toggleusername') {
    await db().rollGenerator.update({
      where: { id: rollGeneratorId },
      data: {
        showUsernames: !rollGenerator.showUsernames,
      },
    });

    const rollService = new RollGeneratorService(interaction.client);
    await rollService.updateRollMessage(rollGeneratorId);

    await interaction.reply({
      content: `✅ Usernames are now ${!rollGenerator.showUsernames ? 'shown' : 'hidden'}.`,
      ephemeral: true,
    });
  } else if (subAction === 'editmaxshown') {
    const modal = new ModalBuilder()
      .setCustomId(`roll_modalmaxshown_${rollGeneratorId}`)
      .setTitle('Amount of Users Displayed');

    const maxShownInput = new TextInputBuilder()
      .setCustomId('maxshown')
      .setLabel('Number of rolls to show')
      .setStyle(TextInputStyle.Short)
      .setValue(rollGenerator.maxShown.toString())
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(3);

    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(maxShownInput)
    );

    await interaction.showModal(modal);
  }
}

// Handle modal submissions
export async function handleRollModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  const [action, subAction, rollGeneratorId] = interaction.customId.split('_');

  if (action !== 'roll') return;

  const rollService = new RollGeneratorService(interaction.client);

  if (subAction === 'modaltitle') {
    const title = interaction.fields.getTextInputValue('title');
    
    await db().rollGenerator.update({
      where: { id: rollGeneratorId },
      data: { title },
    });

    await rollService.updateRollMessage(rollGeneratorId);

    await interaction.reply({
      content: '✅ Title updated successfully!',
      ephemeral: true,
    });
  } else if (subAction === 'modaldesc') {
    const description = interaction.fields.getTextInputValue('description') || null;
    
    await db().rollGenerator.update({
      where: { id: rollGeneratorId },
      data: { description },
    });

    await rollService.updateRollMessage(rollGeneratorId);

    await interaction.reply({
      content: '✅ Description updated successfully!',
      ephemeral: true,
    });
  } else if (subAction === 'modalmaxshown') {
    const maxShownStr = interaction.fields.getTextInputValue('maxshown');
    const maxShown = parseInt(maxShownStr, 10);

    if (isNaN(maxShown) || maxShown < 1) {
      await interaction.reply({
        content: '❌ Please enter a valid number (minimum 1).',
        ephemeral: true,
      });
      return;
    }

    await db().rollGenerator.update({
      where: { id: rollGeneratorId },
      data: { maxShown },
    });

    await rollService.updateRollMessage(rollGeneratorId);

    await interaction.reply({
      content: `✅ Now showing top ${maxShown} rolls.`,
      ephemeral: true,
    });
  }
}
