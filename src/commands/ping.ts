// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/ping.ts
// Simple ping command for testing

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and responsiveness'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sent = await interaction.reply({
      content: 'Pinging...',
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply(
      `🏓 Pong!\n` +
      `📡 Latency: ${latency}ms\n` +
      `💓 API Latency: ${apiLatency}ms`
    );
  },
};

export default command;
