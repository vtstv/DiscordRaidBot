// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Advanced settings (approval channels, auto-delete, thread channels)

import { ChatInputCommandInteraction, TextChannel } from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { ValidationError } from '../../../utils/errors.js';

const logger = getModuleLogger('settings-advanced');

export async function handleApprovalChannels(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const action = interaction.options.getString('action', true);
  const channel = interaction.options.getChannel('channel');
  const prisma = getPrismaClient();

  // Get current guild settings
  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { approvalChannels: true },
  });

  let currentChannels = guild?.approvalChannels || [];

  switch (action) {
    case 'add':
      if (!channel) {
        throw new ValidationError('Please specify a channel to add');
      }
      if (currentChannels.includes(channel.id)) {
        await interaction.editReply(`❌ Channel ${channel} is already in the approval list.`);
        return;
      }
      currentChannels.push(channel.id);
      await prisma.guild.upsert({
        where: { id: guildId },
        create: {
          id: guildId,
          name: interaction.guild!.name,
          approvalChannels: currentChannels,
        },
        update: {
          approvalChannels: currentChannels,
        },
      });
      logger.info({ guildId, channelId: channel.id }, 'Approval channel added');
      await interaction.editReply(
        `✅ Approval required for ${channel}\n\n` +
        `Events posted in this channel will require creator approval before participants are confirmed.`
      );
      break;

    case 'remove':
      if (!channel) {
        throw new ValidationError('Please specify a channel to remove');
      }
      if (!currentChannels.includes(channel.id)) {
        await interaction.editReply(`❌ Channel ${channel} is not in the approval list.`);
        return;
      }
      currentChannels = currentChannels.filter((id: string) => id !== channel.id);
      await prisma.guild.update({
        where: { id: guildId },
        data: { approvalChannels: currentChannels },
      });
      logger.info({ guildId, channelId: channel.id }, 'Approval channel removed');
      await interaction.editReply(`✅ Approval no longer required for ${channel}`);
      break;

    case 'list':
      if (currentChannels.length === 0) {
        await interaction.editReply('📋 No approval channels configured.\n\nUse `/settings approval-channels action:Add` to add channels.');
        return;
      }
      const channelMentions = currentChannels.map((id: string) => `<#${id}>`).join(', ');
      await interaction.editReply(
        `📋 **Channels requiring participant approval:**\n\n${channelMentions}\n\n` +
        `Events in these channels require creator approval before participants are confirmed.`
      );
      break;

    case 'clear':
      if (currentChannels.length === 0) {
        await interaction.editReply('❌ No approval channels to clear.');
        return;
      }
      await prisma.guild.update({
        where: { id: guildId },
        data: { approvalChannels: [] },
      });
      logger.info({ guildId }, 'All approval channels cleared');
      await interaction.editReply('✅ All approval channel settings have been cleared.');
      break;
  }
}

export async function handleAutoDelete(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const hours = interaction.options.getInteger('hours');
  const prisma = getPrismaClient();

  // hours === null means disable auto-delete
  // hours === 0 means disable auto-delete
  // hours > 0 means enable with that value
  const autoDeleteHours = (hours === null || hours === 0) ? null : hours;

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      autoDeleteHours,
    },
    update: {
      autoDeleteHours,
    },
  });

  logger.info({ guildId, autoDeleteHours }, 'Auto-delete hours updated');

  if (autoDeleteHours === null) {
    await interaction.editReply(
      '✅ **Auto-delete disabled**\n\n' +
      'Archived event messages will remain in channels permanently.'
    );
  } else {
    await interaction.editReply(
      `✅ **Auto-delete enabled: ${autoDeleteHours} hours**\n\n` +
      `Event messages will be automatically deleted ${autoDeleteHours} hour(s) after archiving.\n\n` +
      `Note: Events are archived 1 hour after their start time.`
    );
  }
}

export async function handleThreadChannels(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const action = interaction.options.getString('action', true);
  const channel = interaction.options.getChannel('channel') as TextChannel | null;
  const prisma = getPrismaClient();

  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { threadChannels: true },
  });

  let currentChannels = guild?.threadChannels || [];

  switch (action) {
    case 'add':
      if (!channel) {
        throw new ValidationError('Please specify a channel to add');
      }
      if (currentChannels.includes(channel.id)) {
        await interaction.editReply(`❌ Channel ${channel} already has auto-thread creation enabled.`);
        return;
      }
      currentChannels.push(channel.id);
      await prisma.guild.upsert({
        where: { id: guildId },
        create: {
          id: guildId,
          name: interaction.guild!.name,
          threadChannels: currentChannels,
        },
        update: {
          threadChannels: currentChannels,
        },
      });
      logger.info({ guildId, channelId: channel.id }, 'Thread channel added');
      await interaction.editReply(
        `✅ Auto-thread creation enabled for ${channel}\n\n` +
        `Events posted in this channel will automatically create discussion threads.`
      );
      break;

    case 'remove':
      if (!channel) {
        throw new ValidationError('Please specify a channel to remove');
      }
      if (!currentChannels.includes(channel.id)) {
        await interaction.editReply(`❌ Channel ${channel} does not have auto-thread creation enabled.`);
        return;
      }
      currentChannels = currentChannels.filter((id: string) => id !== channel.id);
      await prisma.guild.update({
        where: { id: guildId },
        data: { threadChannels: currentChannels },
      });
      logger.info({ guildId, channelId: channel.id }, 'Thread channel removed');
      await interaction.editReply(`✅ Auto-thread creation disabled for ${channel}`);
      break;

    case 'list':
      if (currentChannels.length === 0) {
        await interaction.editReply(
          '📋 No channels configured for auto-thread creation.\n\n' +
          'Use `/settings thread-channels action:Add` to enable auto-threads for specific channels.\n\n' +
          'Note: You can also enable threads per-event when creating an event.'
        );
        return;
      }
      const channelMentions = currentChannels.map((id: string) => `<#${id}>`).join(', ');
      await interaction.editReply(
        `📋 **Channels with auto-thread creation:**\n\n${channelMentions}\n\n` +
        `Events in these channels will automatically create discussion threads.`
      );
      break;

    case 'clear':
      if (currentChannels.length === 0) {
        await interaction.editReply('❌ No thread channels to clear.');
        return;
      }
      await prisma.guild.update({
        where: { id: guildId },
        data: { threadChannels: [] },
      });
      logger.info({ guildId }, 'All thread channels cleared');
      await interaction.editReply('✅ All thread channel settings have been cleared.');
      break;
  }
}

export async function handleNoteChannels(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const action = interaction.options.getString('action', true);
  const channel = interaction.options.getChannel('channel') as TextChannel | null;
  const prisma = getPrismaClient();

  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { noteChannels: true, allowParticipantNotes: true },
  });

  let currentChannels = guild?.noteChannels || [];
  const globalNotesEnabled = guild?.allowParticipantNotes ?? true;

  switch (action) {
    case 'add':
      if (!channel) {
        throw new ValidationError('Please specify a channel to add');
      }
      if (currentChannels.includes(channel.id)) {
        await interaction.editReply(`❌ Channel ${channel} already has participant notes enabled.`);
        return;
      }
      currentChannels.push(channel.id);
      await prisma.guild.upsert({
        where: { id: guildId },
        create: {
          id: guildId,
          name: interaction.guild!.name,
          noteChannels: currentChannels,
        },
        update: {
          noteChannels: currentChannels,
        },
      });
      logger.info({ guildId, channelId: channel.id }, 'Note channel added');
      await interaction.editReply(
        `✅ Participant notes enabled for ${channel}\n\n` +
        `Participants can add notes when signing up for events in this channel.`
      );
      break;

    case 'remove':
      if (!channel) {
        throw new ValidationError('Please specify a channel to remove');
      }
      if (!currentChannels.includes(channel.id)) {
        await interaction.editReply(`❌ Channel ${channel} does not have participant notes enabled.`);
        return;
      }
      currentChannels = currentChannels.filter((id: string) => id !== channel.id);
      await prisma.guild.update({
        where: { id: guildId },
        data: { noteChannels: currentChannels },
      });
      logger.info({ guildId, channelId: channel.id }, 'Note channel removed');
      await interaction.editReply(`✅ Participant notes disabled for ${channel}`);
      break;

    case 'list':
      if (currentChannels.length === 0) {
        const status = globalNotesEnabled 
          ? '✅ Participant notes are **enabled globally** (all channels)\n\n'
          : '❌ Participant notes are **disabled globally**\n\n';
        await interaction.editReply(
          `📋 **Participant Notes Configuration**\n\n${status}` +
          'Use `/settings note-channels action:Add` to enable notes for specific channels.\n\n' +
          'Note: Event creators can override this setting when creating an event.'
        );
        return;
      }
      const channelMentions = currentChannels.map((id: string) => `<#${id}>`).join(', ');
      const globalStatus = globalNotesEnabled
        ? 'If a channel is not in this list, global setting (enabled) applies.'
        : 'Notes are only enabled in channels listed below.';
      await interaction.editReply(
        `📋 **Channels with participant notes enabled:**\n\n${channelMentions}\n\n${globalStatus}`
      );
      break;

    case 'clear':
      if (currentChannels.length === 0) {
        await interaction.editReply('❌ No note channels to clear.');
        return;
      }
      await prisma.guild.update({
        where: { id: guildId },
        data: { noteChannels: [] },
      });
      logger.info({ guildId }, 'All note channels cleared');
      const newStatus = globalNotesEnabled
        ? 'Participant notes are now enabled for **all channels** (global setting).'
        : 'Participant notes are now disabled for all channels (use event override to enable).';
      await interaction.editReply(`✅ All note channel settings have been cleared.\n\n${newStatus}`);
      break;
  }
}

export async function handleDMReminders(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const enabled = interaction.options.getBoolean('enabled', true);
  const prisma = getPrismaClient();

  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: interaction.guild!.name,
      dmRemindersEnabled: enabled,
    },
    update: {
      dmRemindersEnabled: enabled,
    },
  });

  logger.info({ guildId, enabled }, 'DM reminders setting updated');

  const status = enabled ? 'enabled ✅' : 'disabled ❌';
  await interaction.editReply(
    `DM reminders are now **${status}**\n\n` +
    (enabled
      ? '📬 Confirmed participants will receive direct messages before events start.\n' +
        '⚠️ Note: Users with DMs disabled will not receive reminders.'
      : '📭 Participants will only see reminders in the event channel.')
  );
}
