// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/event/create.ts
// Event creation handler

import { ChatInputCommandInteraction } from 'discord.js';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';
import { parseTime } from '../../utils/time.js';
import { CommandError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { createEventMessage } from '../../messages/eventMessage.js';
import { logAction } from '../../services/auditLog.js';
import { hasManagementPermissions } from '../../utils/permissions.js';
import { getUserDisplayName } from '../../utils/discord.js';
import { DiscordEventService } from '../../services/discordEvent.js';

const logger = getModuleLogger('event:create');
const prisma = getPrismaClient();

export async function handleCreate(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  // Check permissions
  const hasPermission = await hasManagementPermissions(interaction);
  if (!hasPermission) {
    throw new CommandError('You do not have permission to create events. Only administrators or users with the configured manager role can create events.');
  }

  const guildId = interaction.guild!.id;
  const title = interaction.options.getString('title', true).trim();
  const timeString = interaction.options.getString('time', true).trim();
  const templateName = interaction.options.getString('template');
  const channel = interaction.options.getChannel('channel') || interaction.channel!;
  const description = interaction.options.getString('description')?.trim();
  const maxParticipants = interaction.options.getInteger('max-participants');
  const duration = interaction.options.getInteger('duration');
  const requireApprovalOverride = interaction.options.getBoolean('require-approval');
  const createThreadOverride = interaction.options.getBoolean('create-thread');
  const allowNotesOverride = interaction.options.getBoolean('allow-notes');
  const allowedRolesInput = interaction.options.getString('allowed-roles');
  const benchOverflow = interaction.options.getBoolean('bench-overflow') ?? true; // Default to true
  const deadline = interaction.options.getInteger('deadline'); // Hours before event to close signups
  const createVoiceChannel = interaction.options.getBoolean('create-voice-channel') ?? false;
  const voiceChannelName = interaction.options.getString('voice-channel-name');
  const voiceChannelRestricted = interaction.options.getBoolean('voice-restricted') ?? false;
  const voiceChannelCreateBefore = interaction.options.getInteger('voice-create-before');
  const createDiscordEventOverride = interaction.options.getBoolean('create-discord-event');

  // Input validation
  if (title.length < 1 || title.length > 256) {
    throw new ValidationError('Event title must be between 1 and 256 characters');
  }
  if (description && description.length > 2000) {
    throw new ValidationError('Event description must be 2000 characters or less');
  }
  if (maxParticipants && (maxParticipants < 1 || maxParticipants > 1000)) {
    throw new ValidationError('Max participants must be between 1 and 1000');
  }
  if (duration && (duration < 15 || duration > 10080)) {
    throw new ValidationError('Duration must be between 15 minutes and 7 days');
  }

  // Ensure guild exists
  const guild = await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild!.name },
    update: { name: interaction.guild!.name },
  });

  // Check event limit for this guild
  const systemSettings = await prisma.systemSettings.findUnique({
    where: { id: 'system' },
  });
  
  if (systemSettings) {
    const eventCount = await prisma.event.count({
      where: {
        guildId,
        deletedAt: null,
        status: { in: ['scheduled', 'active'] },
      },
    });

    if (eventCount >= systemSettings.maxEventsPerGuild) {
      throw new ValidationError(
        `This server has reached the maximum limit of ${systemSettings.maxEventsPerGuild} active events. ` +
        `Please complete or delete some events before creating new ones.`
      );
    }
  }

  // Parse event time
  const startTime = parseTime(timeString, guild.timezone);
  if (!startTime || !startTime.isValid) {
    throw new ValidationError(`Invalid time format. Use DD.MM.YYYY HH:MM (e.g., "18.11.2025 18:30") or YYYY-MM-DD HH:MM (e.g., "2025-11-18 18:30")`);
  }

  // Get template if specified
  let template = null;
  let roleConfig = null;

  if (templateName) {
    template = await prisma.template.findUnique({
      where: { guildId_name: { guildId, name: templateName } },
    });

    if (!template) {
      throw new NotFoundError(`Template "${templateName}"`);
    }

    roleConfig = template.config;
  }

  // Check if channel requires approval or manual override
  const channelRequiresApproval = guild.approvalChannels?.includes(channel.id) || false;
  const requireApproval = requireApprovalOverride !== null ? requireApprovalOverride : channelRequiresApproval;

  // Check if thread should be created: channel in threadChannels OR explicit override
  const channelHasAutoThread = guild.threadChannels?.includes(channel.id) || false;
  const createThread = createThreadOverride !== null ? createThreadOverride : channelHasAutoThread;

  // Determine if notes are allowed: explicit override OR channel in noteChannels OR global setting
  let allowNotes: boolean | null = null;
  if (allowNotesOverride !== null) {
    // Explicit override provided
    allowNotes = allowNotesOverride;
  }
  // Otherwise leave as null to use guild default logic in runtime

  // Parse allowed roles
  let allowedRoles: string[] = [];
  if (allowedRolesInput && allowedRolesInput.toLowerCase().trim() !== 'all') {
    // Parse comma-separated role names
    const roleNames = allowedRolesInput.split(',').map(r => r.trim()).filter(r => r.length > 0);
    
    // Convert role names to IDs
    const guildRoles = await interaction.guild!.roles.fetch();
    for (const roleName of roleNames) {
      const role = guildRoles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) {
        throw new ValidationError(`Role "${roleName}" not found on this server`);
      }
      allowedRoles.push(role.id);
    }
  }
  // If allowedRolesInput is null or "all", allowedRoles stays empty (meaning all roles allowed)

  logger.debug({
    channelId: channel.id,
    channelRequiresApproval,
    requireApprovalOverride,
    finalRequireApproval: requireApproval,
    channelHasAutoThread,
    createThreadOverride,
    finalCreateThread: createThread,
    allowNotesOverride,
    finalAllowNotes: allowNotes,
    allowedRolesInput,
    allowedRoles,
    benchOverflow,
  }, 'Settings for event');

  // Create event
  const event = await prisma.event.create({
    data: {
      guildId,
      templateId: template?.id,
      channelId: channel.id,
      title,
      description,
      startTime: startTime.toJSDate(),
      duration,
      timezone: guild.timezone,
      maxParticipants,
      roleConfig: roleConfig as any,
      createdBy: interaction.user.id,
      status: 'scheduled',
      requireApproval,
      createThread,
      createVoiceChannel,
      voiceChannelName,
      voiceChannelRestricted,
      voiceChannelCreateBefore,
      allowNotes,
      allowedRoles,
      benchOverflow,
      deadline,
    },
  });

  logger.info({ eventId: event.id, title, guildId }, 'Event created');

  // Post event message to channel
  try {
    const eventChannel = await interaction.client.channels.fetch(channel.id);
    if (!eventChannel || !eventChannel.isTextBased() || eventChannel.isDMBased()) {
      throw new CommandError('Invalid channel');
    }

    const messageData = await createEventMessage(event);
    const message = await eventChannel.send(messageData);

    // Create thread for event discussion if enabled
    let threadId: string | undefined;
    if (createThread && eventChannel.isThread() === false && 'threads' in eventChannel) {
      try {
        const thread = await message.startThread({
          name: `💬 ${title}`,
          autoArchiveDuration: 1440, // 24 hours
        });
        threadId = thread.id;
        logger.info({ eventId: event.id, threadId }, 'Event thread created');
      } catch (threadError) {
        logger.warn({ error: threadError, eventId: event.id }, 'Failed to create thread');
      }
    }

    // Update event with message ID and thread ID
    await prisma.event.update({
      where: { id: event.id },
      data: {
        messageId: message.id,
        threadId,
      },
    });

    // Create native Discord event if enabled
    const shouldCreateDiscordEvent = createDiscordEventOverride !== null 
      ? createDiscordEventOverride 
      : guild.createNativeEvent;

    if (shouldCreateDiscordEvent) {
      try {
        const discordEventService = new DiscordEventService(interaction.client);
        await discordEventService.createDiscordEvent(event.id);
      } catch (discordEventError) {
        logger.warn({ error: discordEventError, eventId: event.id }, 'Failed to create Discord event');
      }
    }

    // Log action
    await logAction({
      guildId,
      eventId: event.id,
      action: 'create_event',
      userId: interaction.user.id,
      username: getUserDisplayName(interaction.user),
      details: { title, startTime: startTime.toISO() },
    });

    await interaction.editReply({
      content: `✅ Event **${title}** created successfully!\n${message.url}`,
    });
  } catch (error) {
    logger.error({ error, eventId: event.id }, 'Failed to post event message');
    throw new CommandError('Failed to post event message. Event was created but not posted.');
  }
}
