// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/rollGenerator/rollEmbed.ts

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { RollGenerator, RollResult } from '@prisma/client';
import { config } from '../../config/env.js';

type RollGeneratorWithRolls = RollGenerator & {
  rolls: RollResult[];
};

export function createRollEmbed(rollGenerator: RollGeneratorWithRolls, rolls: RollResult[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`🎲 ${rollGenerator.title}`)
    .setColor(rollGenerator.status === 'closed' ? 0x95A5A6 : 0x5865F2)
    .setTimestamp();

  if (rollGenerator.description) {
    embed.setDescription(rollGenerator.description);
  }

  // Status field
  let statusText = '';
  if (rollGenerator.status === 'pending') {
    statusText = '⏳ **Pending** - Will open soon';
  } else if (rollGenerator.status === 'active') {
    statusText = '✅ **Active** - Roll now!';
  } else {
    statusText = '🔒 **Closed**';
  }
  embed.addFields({ name: 'Status', value: statusText, inline: true });

  // Roll range field
  embed.addFields({
    name: 'Roll Range',
    value: `1 - ${rollGenerator.maxRoll}`,
    inline: true,
  });

  // Total rolls field
  const uniqueUsers = new Set(rolls.map(r => r.userId));
  embed.addFields({
    name: 'Participants',
    value: `${uniqueUsers.size} user${uniqueUsers.size !== 1 ? 's' : ''} (${rolls.length} roll${rolls.length !== 1 ? 's' : ''})`,
    inline: true,
  });

  // Show results
  if (rolls.length > 0) {
    let resultsText = '';
    const displayRolls = rollGenerator.showDuplicates 
      ? rolls.slice(0, rollGenerator.maxShown)
      : getUniqueHighestRolls(rolls).slice(0, rollGenerator.maxShown);

    displayRolls.forEach((roll, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      const userDisplay = rollGenerator.showUsernames 
        ? `<@${roll.userId}>` 
        : `User #${roll.userId.slice(-4)}`;
      resultsText += `${medal} **${roll.rollValue}** - ${userDisplay}\n`;
    });

    if (rolls.length > rollGenerator.maxShown) {
      resultsText += `\n_... and ${rolls.length - rollGenerator.maxShown} more roll${rolls.length - rollGenerator.maxShown !== 1 ? 's' : ''}_`;
    }

    embed.addFields({
      name: rollGenerator.showDuplicates ? 'All Rolls' : 'Top Rolls',
      value: resultsText || 'No rolls yet',
      inline: false,
    });
  } else {
    embed.addFields({
      name: 'Results',
      value: '_No rolls yet - be the first!_',
      inline: false,
    });
  }

  // Show limits
  if (rollGenerator.maxUsers) {
    const progress = Math.min((uniqueUsers.size / rollGenerator.maxUsers) * 100, 100);
    embed.addFields({
      name: 'Capacity',
      value: `${uniqueUsers.size}/${rollGenerator.maxUsers} users (${progress.toFixed(0)}%)`,
      inline: true,
    });
  }

  if (rollGenerator.rollsPerUser > 1) {
    embed.addFields({
      name: 'Rolls per User',
      value: `${rollGenerator.rollsPerUser}`,
      inline: true,
    });
  }

  // Show time info
  if (rollGenerator.endTime && rollGenerator.status === 'active') {
    const timeLeft = rollGenerator.endTime.getTime() - Date.now();
    if (timeLeft > 0) {
      const minutes = Math.floor(timeLeft / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let timeString = '';
      if (days > 0) timeString = `${days}d ${hours % 24}h`;
      else if (hours > 0) timeString = `${hours}h ${minutes % 60}m`;
      else timeString = `${minutes}m`;

      embed.addFields({
        name: 'Time Remaining',
        value: timeString,
        inline: true,
      });
    }
  }

  if (rollGenerator.status === 'closed') {
    embed.setFooter({ text: 'This roll generator is closed' });
  }

  return embed;
}

export function createRollComponents(rollGenerator: RollGenerator): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  // First row: Roll button, Web View, Settings (edit), Close
  const row1 = new ActionRowBuilder<ButtonBuilder>();

  // Roll button (disabled if closed or pending)
  const rollButton = new ButtonBuilder()
    .setCustomId(`roll_do_${rollGenerator.id}`)
    .setLabel(`🎲 Roll the dice! (1-${rollGenerator.maxRoll})`)
    .setStyle(ButtonStyle.Primary)
    .setDisabled(rollGenerator.status !== 'active');

  row1.addComponents(rollButton);

  // View Online button
  const viewOnlineButton = new ButtonBuilder()
    .setLabel('View Online')
    .setStyle(ButtonStyle.Link)
    .setURL(`${config.WEB_BASE_URL}/roll/${rollGenerator.id}`);

  row1.addComponents(viewOnlineButton);

  // Settings button (only for creator or admins)
  const settingsButton = new ButtonBuilder()
    .setCustomId(`roll_edit_${rollGenerator.id}`)
    .setLabel('⚙️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(rollGenerator.status === 'closed');

  row1.addComponents(settingsButton);

  rows.push(row1);

  return rows;
}

/**
 * Get unique highest rolls per user
 */
function getUniqueHighestRolls(rolls: RollResult[]): RollResult[] {
  const userBestRolls = new Map<string, RollResult>();

  for (const roll of rolls) {
    const existing = userBestRolls.get(roll.userId);
    if (!existing || roll.rollValue > existing.rollValue) {
      userBestRolls.set(roll.userId, roll);
    }
  }

  return Array.from(userBestRolls.values()).sort((a, b) => b.rollValue - a.rollValue);
}
