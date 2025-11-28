// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Button interaction handler for config command

import { showMainMenu } from '../menus/main.js';

export async function handleConfigButton(interaction: any): Promise<void> {
  const customId = interaction.customId;

  if (customId === 'config_back_main') {
    await showMainMenu(interaction);
  } else if (customId === 'config_close') {
    await interaction.update({ content: 'Configuration menu closed.', embeds: [], components: [] });
  }
}
