// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Select menu interaction handler for config command

import { StringSelectMenuInteraction } from 'discord.js';
import { showMainMenu } from '../menus/main.js';
import { showLocaleMenu } from '../menus/locale.js';
import { showAutomationMenu, showVoiceMenu, showChannelsMenu, showViewAll, showPermissionsMenu, showStatisticsMenu } from '../menus/others.js';
import { handleLanguageSelect, handleTimezoneSelect } from './locale.js';
import { handleAutomationAction } from './automation.js';
import { handleVoiceAction } from './voice.js';
import { handleChannelsAction } from './channels.js';
import { handlePermissionsAction } from './permissions.js';
import { handleStatisticsAction } from './statistics.js';
import getPrismaClient from '../../../database/db.js';

const prisma = getPrismaClient();

export async function handleConfigSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  const [action] = interaction.customId.split('_');
  
  if (action !== 'config') return;

  const value = interaction.values[0];

  switch (interaction.customId) {
    case 'config_main_menu':
      await handleMainMenuSelect(interaction, value);
      break;

    case 'config_set_language':
      await handleLanguageSelect(interaction, value);
      break;

    case 'config_set_timezone':
      await handleTimezoneSelect(interaction, value);
      break;

    case 'config_automation_action':
      await handleAutomationAction(interaction, value);
      break;

    case 'config_voice_action':
      await handleVoiceAction(interaction, value);
      break;

    case 'config_channels_action':
      await handleChannelsAction(interaction, value);
      break;

    case 'config_permissions_action':
      await handlePermissionsAction(interaction, value);
      break;

    case 'config_statistics_action':
      await handleStatisticsAction(interaction, value);
      break;

    case 'config_set_stats_interval':
      const { handleStatsIntervalSelect } = await import('./statistics.js');
      await handleStatsIntervalSelect(interaction);
      break;
  }
}

async function handleMainMenuSelect(interaction: StringSelectMenuInteraction, value: string): Promise<void> {
  switch (value) {
    case 'locale':
      await showLocaleMenu(interaction);
      break;
    case 'automation':
      await showAutomationMenu(interaction);
      break;
    case 'voice':
      await showVoiceMenu(interaction);
      break;
    case 'channels':
      await showChannelsMenu(interaction);
      break;
    case 'permissions':
      await showPermissionsMenu(interaction);
      break;
    case 'statistics':
      await showStatisticsMenu(interaction);
      break;
    case 'view_all':
      await showViewAll(interaction);
      break;
    default:
      await interaction.update({ 
        content: `❌ Unknown category: "${value}". Please try again.`, 
        components: [] 
      });
  }
}
