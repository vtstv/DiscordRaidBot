// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/embeds/statsEmbed.ts
// Statistics leaderboard embed generation

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import getPrismaClient from '../database/db.js';
import { getLeaderboard } from '../services/statistics.js';

const prisma = getPrismaClient();

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];
const STAR_EMOJIS = ['⭐⭐⭐', '⭐⭐', '⭐'];

/**
 * Create leaderboard embed
 */
export async function createStatsEmbed(guildId: string, topN: number = 10): Promise<{
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
}> {
  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { statsMinEvents: true },
  });

  if (!guild) {
    throw new Error('Guild not found');
  }

  const leaderboard = await getLeaderboard(guildId, topN);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🏆 Event Participation Leaderboard')
    .setDescription('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    .setTimestamp()
    .setFooter({ text: `Min. ${guild.statsMinEvents} events to qualify • Last updated` });

  if (leaderboard.length === 0) {
    embed.addFields({
      name: 'No participants yet',
      value: `Participate in at least ${guild.statsMinEvents} events to appear on the leaderboard!`,
    });
  } else {
    const leaderboardText = leaderboard
      .map((stat, index) => {
        const rank = index + 1;
        const medal = rank <= 3 ? MEDAL_EMOJIS[index] : `${rank}️⃣`;
        const stars = rank <= 3 ? ` ${STAR_EMOJIS[index]}` : '';
        
        return `${medal} <@${stat.userId}>    **${stat.totalEventsCompleted}** completed • ${stat.totalNoShows} no-shows${stars}`;
      })
      .join('\n');

    embed.addFields({
      name: '\u200B',
      value: leaderboardText,
    });

    embed.addFields({
      name: '\u200B',
      value: `📊 Scoring: +3 per completed event, -2 per no-show`,
      inline: false,
    });
  }

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('stats_view_personal')
      .setLabel('My Stats')
      .setEmoji('📈')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('stats_refresh')
      .setLabel('Refresh')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embed,
    components: [buttons],
  };
}

/**
 * Create personal stats embed (ephemeral)
 */
export async function createPersonalStatsEmbed(userId: string, guildId: string): Promise<EmbedBuilder> {
  const stats = await prisma.participantStatistics.findUnique({
    where: {
      userId_guildId: { userId, guildId },
    },
  });

  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { statsMinEvents: true },
  });

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('📈 Your Event Statistics')
    .setTimestamp();

  if (!stats || !guild) {
    embed.setDescription('You haven\'t participated in any events yet!');
    return embed;
  }

  const qualifies = stats.totalEventsCompleted >= guild.statsMinEvents;
  const rankText = stats.rank && qualifies ? `#${stats.rank}` : 'Not ranked';

  embed.addFields(
    { name: 'Events Completed', value: `${stats.totalEventsCompleted}`, inline: true },
    { name: 'No-Shows', value: `${stats.totalNoShows}`, inline: true },
    { name: 'Score', value: `${stats.score} points`, inline: true },
    { name: 'Rank', value: rankText, inline: true },
    { name: '\u200B', value: '\u200B', inline: true },
    { name: '\u200B', value: '\u200B', inline: true }
  );

  if (!qualifies) {
    embed.setFooter({
      text: `Complete ${guild.statsMinEvents - stats.totalEventsCompleted} more events to qualify for ranking!`,
    });
  }

  return embed;
}

/**
 * Create stats setup success embed
 */
export function createStatsSetupEmbed(
  channelId: string,
  interval: string,
  autoRoleEnabled: boolean,
  roleId?: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('✅ Statistics System Configured')
    .addFields(
      { name: 'Stats Channel', value: `<#${channelId}>`, inline: true },
      { name: 'Update Interval', value: interval, inline: true },
      { name: 'Auto-Roles', value: autoRoleEnabled ? 'Enabled' : 'Disabled', inline: true }
    );

  if (autoRoleEnabled && roleId) {
    embed.addFields({ name: 'Top 10 Role', value: `<@&${roleId}>`, inline: false });
  }

  return embed;
}
