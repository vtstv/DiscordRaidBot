// Copyright (c) 2025 Murr (https://github.com/vtstv)
// View current server settings

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../../database/db.js';

export async function handleView(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const prisma = getPrismaClient();

  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
  });

  if (!guild) {
    await interaction.editReply('No settings configured yet. Settings will be created when you create your first event.');
    return;
  }

  const logChannel = guild.logChannelId ? `<#${guild.logChannelId}>` : 'Not set';
  const archiveChannel = guild.archiveChannelId ? `<#${guild.archiveChannelId}>` : 'Not set';
  const reminders = guild.reminderIntervals.join(', ');
  const locale = guild.locale || 'en';
  const languageNames: Record<string, string> = {
    en: 'English',
    ru: 'Русский (Russian)',
    de: 'Deutsch (German)'
  };
  const languageName = languageNames[locale] || 'English';

  // Auto-delete setting
  const autoDeleteText = guild.autoDeleteHours 
    ? `${guild.autoDeleteHours} hour(s) after archiving`
    : 'Disabled';

  // Thread channels
  const threadChannelsText = guild.threadChannels.length > 0
    ? guild.threadChannels.map(id => `<#${id}>`).join(', ')
    : 'None configured';

  // DM reminders
  const dmRemindersText = guild.dmRemindersEnabled ? 'Enabled ✅' : 'Disabled ❌';

  await interaction.editReply(
    `**Server Settings**\n\n` +
    `🌐 **Language:** ${languageName}\n` +
    `🌍 **Timezone:** ${guild.timezone}\n` +
    `📋 **Log Channel:** ${logChannel}\n` +
    `📦 **Archive Channel:** ${archiveChannel}\n` +
    `⏰ **Reminder Intervals:** ${reminders}\n` +
    `📬 **DM Reminders:** ${dmRemindersText}\n` +
    `🗑️ **Auto-delete messages:** ${autoDeleteText}\n` +
    `💬 **Auto-create threads in:** ${threadChannelsText}`
  );
}
