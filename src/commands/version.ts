// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Version command - display bot version and system information

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { Command } from '../types/command.js';
import { BOT_VERSION } from '../config/version.js';
import os from 'os';
import process from 'process';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('version')
    .setDescription('Display bot version and system information'),

  async execute(interaction: ChatInputCommandInteraction) {
    const uptime = process.uptime();
    const uptimeFormatted = formatUptime(uptime);
    
    // Get process memory (RSS = Resident Set Size)
    const rss = Math.round(process.memoryUsage().rss / 1024 / 1024);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🤖 Bot Version Information')
      .addFields(
        { 
          name: '📦 Version', 
          value: `**v${BOT_VERSION}**`, 
          inline: true 
        },
        { 
          name: '⏱️ Uptime', 
          value: uptimeFormatted, 
          inline: true 
        },
        { 
          name: '💾 Memory Usage', 
          value: `${rss} MB`, 
          inline: true 
        },
        { 
          name: '📊 Platform', 
          value: `${os.type()} ${os.release()}`, 
          inline: true 
        },
        { 
          name: '🟢 Node.js', 
          value: process.version, 
          inline: true 
        },
        { 
          name: '⚙️ Environment', 
          value: process.env.NODE_ENV || 'development', 
          inline: true 
        },
      )
      .setFooter({ 
        text: `Bot ID: ${interaction.client.user.id}` 
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.length > 0 ? parts.join(' ') : 'Just started';
}

export default command;
