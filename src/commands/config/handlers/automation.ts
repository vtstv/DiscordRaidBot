// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Automation handlers

import { StringSelectMenuInteraction } from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { showAutomationMenu } from '../menus/others.js';

const prisma = getPrismaClient();

export async function handleAutomationAction(interaction: StringSelectMenuInteraction, value: string): Promise<void> {
  if (value === 'dm_reminders') {
    const guild = await prisma.guild.findUnique({ where: { id: interaction.guild!.id } });
    const newValue = !(guild as any)?.dmRemindersEnabled;
    await prisma.guild.update({
      where: { id: interaction.guild!.id },
      data: { dmRemindersEnabled: newValue },
    });
    await interaction.reply({ content: `✅ DM Reminders ${newValue ? 'enabled' : 'disabled'}`, ephemeral: true });
    await showAutomationMenu(interaction);
  } else {
    await interaction.update({ 
      content: `Action "${value}" requires modal input (not yet implemented in beta).`, 
      components: [] 
    });
  }
}
