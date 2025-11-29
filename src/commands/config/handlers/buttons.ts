// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Button interaction handler for config command

import { showMainMenu } from '../menus/main.js';
import { showLocaleMenu } from '../menus/locale.js';
import { showAutomationMenu, showVoiceMenu, showChannelsMenu, showPermissionsMenu, showStatisticsMenu } from '../menus/others.js';

export async function handleConfigButton(interaction: any): Promise<void> {
  const customId = interaction.customId;

  if (customId === 'config_back_main') {
    await showMainMenu(interaction);
  } else if (customId === 'config_back_locale') {
    await showLocaleMenu(interaction);
  } else if (customId === 'config_back_automation') {
    await showAutomationMenu(interaction);
  } else if (customId === 'config_back_voice') {
    await showVoiceMenu(interaction);
  } else if (customId === 'config_back_channels') {
    await showChannelsMenu(interaction);
  } else if (customId === 'config_back_permissions') {
    await showPermissionsMenu(interaction);
  } else if (customId === 'config_back_statistics') {
    await showStatisticsMenu(interaction);
  } else if (customId === 'config_close') {
    await interaction.update({ content: 'Configuration menu closed.', embeds: [], components: [] });
  }
}
