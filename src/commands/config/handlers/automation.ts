// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Automation handlers

import { 
  StringSelectMenuInteraction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  ModalSubmitInteraction
} from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { showAutomationMenu } from '../menus/others.js';

const prisma = getPrismaClient();

export async function handleAutomationAction(
  interaction: StringSelectMenuInteraction, 
  value: string
): Promise<void> {
  if (value === 'dm_reminders') {
    const guild = await prisma.guild.findUnique({ where: { id: interaction.guild!.id } });
    const newValue = !guild?.dmRemindersEnabled;
    
    await prisma.guild.update({
      where: { id: interaction.guild!.id },
      data: { dmRemindersEnabled: newValue },
    });
    
    await interaction.reply({ 
      content: `✅ DM Reminders ${newValue ? 'enabled' : 'disabled'}`, 
      ephemeral: true 
    });
    await showAutomationMenu(interaction);
    return;
  }

  // Other actions need modals
  const modal = new ModalBuilder();
  
  switch (value) {
    case 'reminders':
      modal
        .setCustomId('config_modal_reminders')
        .setTitle('Set Reminder Intervals');
      
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('intervals')
            .setLabel('Reminder Intervals')
            .setPlaceholder('e.g., 1d, 6h, 1h, 15m')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
      break;

    case 'auto_delete':
      modal
        .setCustomId('config_modal_auto_delete')
        .setTitle('Set Auto-delete Timer');
      
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('hours')
            .setLabel('Hours after archiving (0 to disable)')
            .setPlaceholder('e.g., 24')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
      break;

    case 'log_retention':
      modal
        .setCustomId('config_modal_log_retention')
        .setTitle('Set Log Retention');
      
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('days')
            .setLabel('Days to keep logs (1-365)')
            .setPlaceholder('e.g., 90')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
      break;
  }

  await interaction.showModal(modal);
}

export async function handleAutomationModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const guildId = interaction.guild!.id;

  try {
    switch (interaction.customId) {
      case 'config_modal_reminders': {
        const intervalsText = interaction.fields.getTextInputValue('intervals');
        const intervals = intervalsText.split(',').map(s => s.trim()).filter(Boolean);
        
        // Validate format (basic check for time units)
        const validPattern = /^\d+[wdhm]$/;
        const allValid = intervals.every(interval => validPattern.test(interval));
        
        if (!allValid) {
          await interaction.reply({
            content: '❌ Invalid format! Use time units: w (weeks), d (days), h (hours), m (minutes)\nExample: 1d, 6h, 1h, 15m',
            ephemeral: true
          });
          return;
        }

        await prisma.guild.update({
          where: { id: guildId },
          data: { reminderIntervals: intervals },
        });

        await interaction.reply({
          content: `✅ Reminder intervals set to: ${intervals.join(', ')}`,
          ephemeral: true
        });
        break;
      }

      case 'config_modal_auto_delete': {
        const hoursText = interaction.fields.getTextInputValue('hours');
        const hours = parseInt(hoursText, 10);

        if (isNaN(hours) || hours < 0 || hours > 720) {
          await interaction.reply({
            content: '❌ Invalid value! Enter a number between 0 and 720 (0 = disabled)',
            ephemeral: true
          });
          return;
        }

        await prisma.guild.update({
          where: { id: guildId },
          data: { autoDeleteHours: hours || null },
        });

        await interaction.reply({
          content: hours > 0 
            ? `✅ Auto-delete set to ${hours} hours after archiving`
            : '✅ Auto-delete disabled',
          ephemeral: true
        });
        break;
      }

      case 'config_modal_log_retention': {
        const daysText = interaction.fields.getTextInputValue('days');
        const days = parseInt(daysText, 10);

        if (isNaN(days) || days < 1 || days > 365) {
          await interaction.reply({
            content: '❌ Invalid value! Enter a number between 1 and 365 days',
            ephemeral: true
          });
          return;
        }

        await prisma.guild.update({
          where: { id: guildId },
          data: { logRetentionDays: days },
        });

        await interaction.reply({
          content: `✅ Log retention set to ${days} days`,
          ephemeral: true
        });
        break;
      }
    }
  } catch (error) {
    console.error('Error in automation modal:', error);
    await interaction.reply({
      content: '❌ Failed to save settings. Please try again.',
      ephemeral: true
    });
  }
}

