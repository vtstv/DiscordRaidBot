// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Autocomplete interaction handlers

import { AutocompleteInteraction } from 'discord.js';
import { getModuleLogger } from '../../utils/logger.js';
import { getCommand } from '../commandLoader.js';
import getPrismaClient from '../../database/db.js';

const logger = getModuleLogger('autocomplete');

export async function handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const { commandName } = interaction;
  
  // Try to get command and use its autocomplete handler
  const command = getCommand(commandName);
  if (command?.autocomplete) {
    try {
      await command.autocomplete(interaction);
      return;
    } catch (error) {
      logger.error({ error, commandName }, 'Error in command autocomplete handler');
      await interaction.respond([]);
      return;
    }
  }
  
  // Fallback to legacy event autocomplete
  if (commandName === 'event') {
    await handleEventAutocomplete(interaction);
  } else if (commandName === 'template') {
    await handleTemplateAutocomplete(interaction);
  }
}

async function handleEventAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedOption = interaction.options.getFocused(true);
  
  if (focusedOption.name === 'template') {
    const guildId = interaction.guild?.id;
    if (!guildId) return;

    const prisma = getPrismaClient();
    const templates = await prisma.template.findMany({
      where: { guildId },
      select: { name: true },
      take: 25,
    });

    const filtered = templates
      .filter(t => t.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(
      filtered.map(t => ({ name: t.name, value: t.name }))
    );
  } else if (focusedOption.name === 'event-id') {
    const guildId = interaction.guild?.id;
    if (!guildId) return;

    const prisma = getPrismaClient();
    const events = await prisma.event.findMany({
      where: { 
        guildId,
        status: { in: ['scheduled', 'active'] }
      },
      select: { id: true, title: true },
      orderBy: { startTime: 'asc' },
      take: 25,
    });

    const filtered = events
      .filter(e => 
        e.title.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
        e.id.toLowerCase().startsWith(focusedOption.value.toLowerCase())
      )
      .slice(0, 25);

    await interaction.respond(
      filtered.map(e => ({ 
        name: `${e.title} (${e.id.substring(0, 8)})`, 
        value: e.id 
      }))
    );
  }
}

async function handleTemplateAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedOption = interaction.options.getFocused(true);
  
  if (focusedOption.name === 'name') {
    const guildId = interaction.guild?.id;
    if (!guildId) return;

    const prisma = getPrismaClient();
    const templates = await prisma.template.findMany({
      where: { guildId },
      select: { name: true, description: true },
      orderBy: { name: 'asc' },
      take: 25,
    });

    const filtered = templates
      .filter(t => t.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(
      filtered.map(t => ({ 
        name: t.description ? `${t.name} - ${t.description.substring(0, 50)}` : t.name, 
        value: t.name 
      }))
    );
  }
}
