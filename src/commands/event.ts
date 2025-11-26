// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/event.ts
// Event management commands (create, edit, delete, list)

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
} from 'discord.js';
import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';
import { parseTime } from '../utils/time.js';
import { CommandError, NotFoundError, ValidationError } from '../utils/errors.js';
import { createEventMessage, updateEventMessage } from '../messages/eventMessage.js';
import { logAction } from '../services/auditLog.js';
import { hasManagementPermissions } from '../utils/permissions.js';
import { getUserDisplayName } from '../utils/discord.js';
import type { Command } from '../types/command.js';

const logger = getModuleLogger('event-command');
const prisma = getPrismaClient();

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage events')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new event')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Event title')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('time')
            .setDescription('Event start time (DD.MM.YYYY HH:MM or YYYY-MM-DD HH:MM)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('template')
            .setDescription('Template to use')
            .setRequired(false)
            .setAutocomplete(true)
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to post event (default: current channel)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Event description')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('max-participants')
            .setDescription('Maximum number of participants')
            .setMinValue(1)
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('duration')
            .setDescription('Event duration in minutes')
            .setMinValue(15)
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('require-approval')
            .setDescription('Require creator approval for participants (overrides channel settings)')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('create-thread')
            .setDescription('Create discussion thread for this event (overrides channel settings)')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('allow-notes')
            .setDescription('Allow participant notes for this event (overrides server settings)')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('allowed-roles')
            .setDescription('Roles allowed to sign up (comma-separated names or "all" for everyone)')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('bench-overflow')
            .setDescription('Bench users without allowed roles (true) or deny signup (false)')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('deadline')
            .setDescription('Hours before event start to close signups (negative = after start)')
            .setMinValue(-168) // Max 7 days after
            .setMaxValue(168)  // Max 7 days before
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List upcoming events')
        .addStringOption(option =>
          option
            .setName('status')
            .setDescription('Filter by status')
            .addChoices(
              { name: 'Scheduled', value: 'scheduled' },
              { name: 'Active', value: 'active' },
              { name: 'Completed', value: 'completed' },
              { name: 'Cancelled', value: 'cancelled' }
            )
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('cancel')
        .setDescription('Cancel an event')
        .addStringOption(option =>
          option
            .setName('event-id')
            .setDescription('Event ID')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-user')
        .setDescription('Add a user to an event (admin/creator only)')
        .addStringOption(option =>
          option
            .setName('event-id')
            .setDescription('Event ID')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to add to the event')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('role')
            .setDescription('Role/class for the user')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('spec')
            .setDescription('Specialization for the user')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-user')
        .setDescription('Remove a user from an event (admin/creator only)')
        .addStringOption(option =>
          option
            .setName('event-id')
            .setDescription('Event ID')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to remove from the event')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      throw new CommandError('This command can only be used in a server');
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'create':
        await handleCreate(interaction);
        break;
      case 'list':
        await handleList(interaction);
        break;
      case 'cancel':
        await handleCancel(interaction);
        break;
      case 'add-user':
        await handleAddUser(interaction);
        break;
      case 'remove-user':
        await handleRemoveUser(interaction);
        break;
    }
  },
};

async function handleCreate(interaction: ChatInputCommandInteraction): Promise<void> {
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

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
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

async function handleCancel(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guild!.id;
  const eventId = interaction.options.getString('event-id', true);

  const event = await prisma.event.findFirst({
    where: { id: eventId, guildId },
  });

  if (!event) {
    throw new NotFoundError('Event');
  }

  // Update event status
  await prisma.event.update({
    where: { id: eventId },
    data: { status: 'cancelled' },
  });

  // Update event message
  await updateEventMessage(event.id);

  // Log action
  await logAction({
    guildId,
    eventId: event.id,
    action: 'cancel_event',
    userId: interaction.user.id,
    username: getUserDisplayName(interaction.user),
    details: { title: event.title },
  });

  logger.info({ eventId, guildId }, 'Event cancelled');

  await interaction.editReply(`✅ Event **${event.title}** has been cancelled.`);
}

async function handleAddUser(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guild!.id;
  const eventId = interaction.options.getString('event-id', true);
  const targetUser = interaction.options.getUser('user', true);
  const role = interaction.options.getString('role');
  const spec = interaction.options.getString('spec');

  // Check permissions
  const hasPermission = await hasManagementPermissions(interaction);
  
  // Also check if user is event creator
  const event = await prisma.event.findFirst({
    where: { id: eventId, guildId },
    include: { guild: true },
  });

  if (!event) {
    throw new NotFoundError('Event');
  }

  const isCreator = event.createdBy === interaction.user.id;

  if (!hasPermission && !isCreator) {
    throw new CommandError('You do not have permission to add users to this event. Only the event creator, administrators, or users with the manager role can add users.');
  }

  // Check if user is already a participant
  const existingParticipant = await prisma.participant.findUnique({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: targetUser.id,
      },
    },
  });

  if (existingParticipant) {
    await interaction.editReply(`❌ ${targetUser.username} is already participating in this event.`);
    return;
  }

  // Add user to event
  await prisma.participant.create({
    data: {
      eventId: event.id,
      userId: targetUser.id,
      username: targetUser.username,
      role: role || undefined,
      spec: spec || undefined,
      status: 'confirmed',
    },
  });

  // Update event message
  await updateEventMessage(event.id);

  // Log action
  await logAction({
    guildId,
    eventId: event.id,
    action: 'add_user',
    userId: interaction.user.id,
    username: getUserDisplayName(interaction.user),
    details: {
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
      role,
      spec,
    },
  });

  logger.info(
    { eventId, guildId, targetUserId: targetUser.id },
    'User added to event by admin/creator'
  );

  await interaction.editReply(
    `✅ Added **${targetUser.username}** to event **${event.title}**${role ? ` as ${role}` : ''}${spec ? ` (${spec})` : ''}.`
  );
}

async function handleRemoveUser(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guild!.id;
  const eventId = interaction.options.getString('event-id', true);
  const targetUser = interaction.options.getUser('user', true);

  // Check permissions
  const hasPermission = await hasManagementPermissions(interaction);
  
  // Also check if user is event creator
  const event = await prisma.event.findFirst({
    where: { id: eventId, guildId },
  });

  if (!event) {
    throw new NotFoundError('Event');
  }

  const isCreator = event.createdBy === interaction.user.id;

  if (!hasPermission && !isCreator) {
    throw new CommandError('You do not have permission to remove users from this event. Only the event creator, administrators, or users with the manager role can remove users.');
  }

  // Check if user is a participant
  const participant = await prisma.participant.findUnique({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: targetUser.id,
      },
    },
  });

  if (!participant) {
    await interaction.editReply(`❌ ${targetUser.username} is not participating in this event.`);
    return;
  }

  // Remove user from event
  await prisma.participant.delete({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: targetUser.id,
      },
    },
  });

  // Update event message
  await updateEventMessage(event.id);

  // Log action
  await logAction({
    guildId,
    eventId: event.id,
    action: 'remove_user',
    userId: interaction.user.id,
    username: getUserDisplayName(interaction.user),
    details: {
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
    },
  });

  logger.info(
    { eventId, guildId, targetUserId: targetUser.id },
    'User removed from event by admin/creator'
  );

  await interaction.editReply(
    `✅ Removed **${targetUser.username}** from event **${event.title}**.`
  );
}

export default command;
