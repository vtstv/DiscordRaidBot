// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/embeds/statsEmbed.ts
// Statistics leaderboard embed generation

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import getPrismaClient from '../database/db.js';
import { getLeaderboard } from '../services/statistics.js';
import { getTranslator } from '../i18n/index.js';

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
  const { t } = await getTranslator(guildId);
  
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
    .setTitle(t('stats.leaderboardTitle'))
    .setDescription(t('stats.leaderboardSeparator'))
    .setTimestamp()
    .setFooter({ text: t('stats.leaderboardFooter', { minEvents: guild.statsMinEvents.toString() }) });

  if (leaderboard.length === 0) {
    embed.addFields({
      name: t('stats.noParticipants'),
      value: t('stats.noParticipantsDescription', { minEvents: guild.statsMinEvents.toString() }),
    });
  } else {
    const leaderboardText = leaderboard
      .map((stat, index) => {
        const rank = index + 1;
        const medal = rank <= 3 ? MEDAL_EMOJIS[index] : `${rank}️⃣`;
        const stars = rank <= 3 ? ` ${STAR_EMOJIS[index]}` : '';
        
        return `${medal} <@${stat.userId}>    ${t('stats.completedAndNoShows', { 
          completed: stat.totalEventsCompleted.toString(),
          noShows: stat.totalNoShows.toString() 
        })}${stars}`;
      })
      .join('\n');

    embed.addFields({
      name: '\u200B',
      value: leaderboardText,
    });

    embed.addFields({
      name: '\u200B',
      value: `📊 ${t('stats.scoringSystem')}`,
      inline: false,
    });
  }

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('stats_view_personal')
      .setLabel(t('stats.viewPersonalButton').replace('📊 ', ''))
      .setEmoji('📈')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('stats_refresh')
      .setLabel(t('stats.refreshButton').replace('🔄 ', ''))
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
  const { t } = await getTranslator(guildId);
  
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
    .setTitle(t('stats.personalStatsTitle'))
    .setTimestamp();

  if (!stats || !guild) {
    embed.setDescription(t('stats.noPersonalStats'));
    return embed;
  }

  const qualifies = stats.totalEventsCompleted >= guild.statsMinEvents;
  const rankText = stats.rank && qualifies ? t('stats.rankValue', { rank: stats.rank.toString() }) : t('stats.notRanked');

  embed.addFields(
    { name: t('stats.eventsCompleted'), value: `${stats.totalEventsCompleted}`, inline: true },
    { name: t('stats.noShows'), value: `${stats.totalNoShows}`, inline: true },
    { name: t('stats.score'), value: t('stats.scorePoints', { score: stats.score.toString() }), inline: true },
    { name: t('stats.rank'), value: rankText, inline: true },
    { name: '\u200B', value: '\u200B', inline: true },
    { name: '\u200B', value: '\u200B', inline: true }
  );

  if (!qualifies) {
    embed.setFooter({
      text: t('stats.qualifyMessage', { remaining: (guild.statsMinEvents - stats.totalEventsCompleted).toString() }),
    });
  }

  return embed;
}

/**
 * Create stats setup success embed
 */
export async function createStatsSetupEmbed(
  guildId: string,
  channelId: string,
  interval: string,
  autoRoleEnabled: boolean,
  roleId?: string
): Promise<EmbedBuilder> {
  const { t } = await getTranslator(guildId);
  
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(t('stats.setupTitle'))
    .addFields(
      { name: t('stats.statsChannel'), value: `<#${channelId}>`, inline: true },
      { name: t('stats.updateInterval'), value: t(`stats.${interval}`), inline: true },
      { name: t('stats.autoRole'), value: autoRoleEnabled ? t('stats.enabled') : t('stats.disabled'), inline: true }
    );

  if (autoRoleEnabled && roleId) {
    embed.addFields({ name: 'Top 10 Role', value: `<@&${roleId}>`, inline: false });
  }

  return embed;
}
