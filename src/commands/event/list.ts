// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/event/list.ts
// List events handler

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../database/db.js';

const prisma = getPrismaClient();

export async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const statusFilter = interaction.options.getString('status');

  const where: any = { guildId };
  if (statusFilter) {
    where.status = statusFilter;
  } else {
    // Default to showing active and scheduled events
    where.status = { in: ['scheduled', 'active'] };
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startTime: 'asc' },
    take: 10,
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  if (events.length === 0) {
    await interaction.editReply('No events found.');
    return;
  }

  const eventList = events.map((event: any, index: number) => {
    const participantCount = event._count.participants;
    const maxPart = event.maxParticipants ? `/${event.maxParticipants}` : '';
    return `${index + 1}. **${event.title}** - <t:${Math.floor(event.startTime.getTime() / 1000)}:F> (${participantCount}${maxPart} participants)`;
  }).join('\n');

  await interaction.editReply(`📅 **Upcoming Events**\n\n${eventList}`);
}
