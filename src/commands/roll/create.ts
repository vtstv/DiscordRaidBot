// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/roll/create.ts

import { ChatInputCommandInteraction, ChannelType } from 'discord.js';
import db from '../../database/db.js';
import { logger } from '../../utils/logger.js';
import { RollGeneratorService } from '../../services/rollGenerator/index.js';
import { parseDuration } from '../../utils/time.js';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    if (!interaction.guild || !interaction.guildId || !interaction.member) {
      throw new Error('This command can only be used in a server');
    }

    // Get guild from database
    const guild = await db().guild.findUnique({
      where: { id: interaction.guildId },
    });

    if (!guild) {
      throw new Error('Guild not found in database');
    }

    // Check permissions (admin or manager role)
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const isAdmin = member.permissions.has('Administrator');
    const isManager = guild.managerRoleId && member.roles.cache.has(guild.managerRoleId);

    if (!isAdmin && !isManager) {
      return interaction.editReply({
        content: '❌ You need to be an administrator or have the manager role to create roll generators.',
      });
    }

    // Get options
    const title = interaction.options.getString('title', true);
    const description = interaction.options.getString('description');
    const maxRoll = interaction.options.getInteger('max-roll') ?? 100;
    const rollsPerUser = interaction.options.getInteger('rolls-per-user') ?? 1;
    const maxUsers = interaction.options.getInteger('max-users');
    const maxShown = interaction.options.getInteger('max-shown') ?? 10;
    const showUsernames = interaction.options.getBoolean('show-usernames') ?? true;
    const durationStr = interaction.options.getString('duration');
    const startDelayStr = interaction.options.getString('start-delay');
    const bulkRoll = interaction.options.getString('bulk-roll');
    const showDuplicates = interaction.options.getBoolean('show-duplicates') ?? false;
    const allowedRolesStr = interaction.options.getString('allowed-roles');
    const limitToVoiceChannel = interaction.options.getChannel('limit-to-voice');

    // Parse duration and start delay
    let duration: number | null = null;
    let startDelay: number | null = null;

    if (durationStr) {
      duration = parseDuration(durationStr);
      if (duration === null) {
        return interaction.editReply({
          content: '❌ Invalid duration format. Use format like "30m", "1h", "2h 30m"',
        });
      }
    }

    if (startDelayStr) {
      startDelay = parseDuration(startDelayStr);
      if (startDelay === null) {
        return interaction.editReply({
          content: '❌ Invalid start delay format. Use format like "5m", "10m", "1h"',
        });
      }
    }

    // Parse allowed roles
    const allowedRoles: string[] = [];
    if (allowedRolesStr) {
      const roleMatches = allowedRolesStr.match(/<@&(\d+)>/g);
      if (roleMatches) {
        roleMatches.forEach(match => {
          const roleId = match.match(/\d+/)?.[0];
          if (roleId) allowedRoles.push(roleId);
        });
      }
    }

    // Validate voice channel
    let limitToVoice: string | null = null;
    if (limitToVoiceChannel) {
      if (limitToVoiceChannel.type !== ChannelType.GuildVoice) {
        return interaction.editReply({
          content: '❌ The selected channel must be a voice channel.',
        });
      }
      limitToVoice = limitToVoiceChannel.id;
    }

    // Create roll generator in database
    const rollGenerator = await db().rollGenerator.create({
      data: {
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        createdBy: interaction.user.id,
        title,
        description,
        maxRoll,
        rollsPerUser,
        maxUsers,
        maxShown,
        showUsernames,
        duration,
        startDelay,
        bulkRoll,
        showDuplicates,
        allowedRoles,
        limitToVoice,
        status: startDelay ? 'pending' : 'active',
        startTime: startDelay ? new Date(Date.now() + startDelay * 1000) : new Date(),
        endTime: duration ? new Date(Date.now() + (startDelay ?? 0) * 1000 + duration * 1000) : null,
      },
    });

    logger.info({ rollGeneratorId: rollGenerator.id, guildId: interaction.guildId }, 'Roll generator created');

    // Create and send roll generator message
    const rollService = new RollGeneratorService(interaction.client);
    await rollService.createRollMessage(rollGenerator.id);

    await interaction.editReply({
      content: `✅ Roll generator created successfully! ${startDelay ? `It will open in ${startDelayStr}.` : ''}`,
    });

    // Schedule auto-close if duration is set
    if (duration) {
      rollService.scheduleAutoClose(rollGenerator.id, (startDelay ?? 0) + duration);
    }

    // Schedule auto-start if start delay is set
    if (startDelay) {
      rollService.scheduleAutoStart(rollGenerator.id, startDelay);
    }

  } catch (error) {
    logger.error({ err: error, module: 'roll-create' }, 'Failed to create roll generator');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await interaction.editReply({
      content: `❌ Failed to create roll generator: ${errorMessage}`,
    });
  }
}
