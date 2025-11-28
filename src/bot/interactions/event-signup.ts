// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Event signup and participation handlers

import { ButtonInteraction, GuildMember, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getModuleLogger } from '../../utils/logger.js';
import { canEditEvent } from '../../utils/permissions.js';
import { getUserDisplayName } from '../../utils/discord.js';
import { joinEvent, leaveEvent, approveParticipants, promoteParticipant, promoteNext } from '../../services/participation.js';
import getPrismaClient from '../../database/db.js';

const logger = getModuleLogger('event-signup');

/**
 * Main router for event signup interactions
 */
export async function handleEventSignup(interaction: ButtonInteraction, eventId: string): Promise<void> {
  const [action, ...params] = interaction.customId.split(':');

  switch (action) {
    case 'event_signup':
      await showSignupOptions(interaction, eventId);
      break;
    default:
      logger.warn({ customId: interaction.customId }, 'Unknown signup action');
      await interaction.reply({ content: '❌ Unknown action.', ephemeral: true });
  }
}

/**
 * Show signup options for an event
 */
async function showSignupOptions(interaction: ButtonInteraction, eventId: string): Promise<void> {
  await interaction.reply({
    content: 'Please use the buttons below to sign up for this event.',
    ephemeral: true,
  });
}

/**
 * Handle joining an event (exported for button-handler)
 */
export async function handleJoin(interaction: ButtonInteraction, eventId: string, role?: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  try {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const userRoleIds = member.roles.cache.map(r => r.id);

    const result = await joinEvent({
      eventId,
      userId: interaction.user.id,
      username: getUserDisplayName(interaction.user),
      role: role || 'participant',
      userRoleIds,
    });

    const emoji = result.success ? '✅' : '❌';
    await interaction.editReply(`${emoji} ${result.message}`);
  } catch (error: any) {
    logger.error({ error, eventId, userId: interaction.user.id }, 'Failed to join event');
    await interaction.editReply(`❌ ${error.message || 'Failed to join event'}`);
  }
}

/**
 * Handle leaving an event (exported for button-handler)
 */
export async function handleLeave(interaction: ButtonInteraction, eventId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  try {
    const result = await leaveEvent(eventId, interaction.user.id, getUserDisplayName(interaction.user));

    const emoji = result.success ? '✅' : '❌';
    await interaction.editReply(`${emoji} ${result.message}`);
  } catch (error: any) {
    logger.error({ error, eventId, userId: interaction.user.id }, 'Failed to leave event');
    await interaction.editReply(`❌ ${error.message || 'Failed to leave event'}`);
  }
}

/**
 * Show pending participants for approval (exported for button-handler)
 */
export async function handleApprove(interaction: ButtonInteraction, eventId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const prisma = getPrismaClient();
  const member = interaction.member instanceof GuildMember ? interaction.member : undefined;
  
  try {
    // Check if user can approve
    const hasPermission = await canEditEvent(interaction.user.id, eventId, member);

    if (!hasPermission) {
      await interaction.editReply('❌ Only the event creator or administrators can approve participants.');
      return;
    }

    // Get pending participants
    const pendingParticipants = await prisma.participant.findMany({
      where: { eventId, status: 'pending' },
      select: { userId: true, username: true, role: true },
    });

    if (pendingParticipants.length === 0) {
      await interaction.editReply('❌ No pending participants to approve.');
      return;
    }

    // Build participant list text
    let participantList = `✅ **Approve Participants** (${pendingParticipants.length} pending)\n\n`;
    participantList += pendingParticipants.map((p: any, i: number) => {
      const roleInfo = p.role ? ` [${p.role}]` : '';
      return `${i + 1}. <@${p.userId}>${roleInfo}`;
    }).join('\n');

    const components: any[] = [];

    // Add "Approve All" button
    const approveAllRow = new ActionRowBuilder<any>().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve_all:${eventId}`)
        .setLabel(`Approve All (${pendingParticipants.length})`)
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
    );
    components.push(approveAllRow);

    // Add individual approval buttons (max 25 buttons across 5 rows)
    for (let i = 0; i < Math.min(pendingParticipants.length, 20); i += 4) {
      const row = new ActionRowBuilder<any>();
      
      for (let j = i; j < Math.min(i + 4, pendingParticipants.length, 20); j++) {
        const p = pendingParticipants[j];
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`approve_user:${eventId}:${p.userId}`)
            .setLabel(`${j + 1}. ${p.username}`)
            .setStyle(ButtonStyle.Primary)
        );
      }
      
      components.push(row);
    }

    await interaction.editReply({
      content: participantList,
      components,
    });
  } catch (error: any) {
    logger.error({ error, eventId }, 'Failed to load pending participants');
    await interaction.editReply(`❌ ${error.message || 'Failed to load pending participants'}`);
  }
}

/**
 * Approve all pending participants (exported for button-handler)
 */
export async function handleApproveAll(interaction: ButtonInteraction, eventId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const member = interaction.member instanceof GuildMember ? interaction.member : undefined;
  
  try {
    const hasPermission = await canEditEvent(interaction.user.id, eventId, member);
    if (!hasPermission) {
      await interaction.editReply('❌ Only the event creator or administrators can approve participants.');
      return;
    }

    const prisma = getPrismaClient();
    const pendingUserIds = await prisma.participant.findMany({
      where: { eventId, status: 'pending' },
      select: { userId: true },
    });
    
    const result = await approveParticipants(eventId, pendingUserIds.map(p => p.userId), interaction.user.id);
    
    const emoji = result.success ? '✅' : '❌';
    await interaction.editReply(`${emoji} ${result.message}`);
  } catch (error: any) {
    logger.error({ error, eventId }, 'Failed to approve all participants');
    await interaction.editReply(`❌ ${error.message || 'Failed to approve all participants'}`);
  }
}

/**
 * Approve specific user (exported for button-handler)
 */
export async function handleApproveUser(interaction: ButtonInteraction, eventId: string, userId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const member = interaction.member instanceof GuildMember ? interaction.member : undefined;
  
  try {
    const hasPermission = await canEditEvent(interaction.user.id, eventId, member);
    if (!hasPermission) {
      await interaction.editReply('❌ Only the event creator or administrators can approve participants.');
      return;
    }

    const result = await approveParticipants(eventId, [userId], interaction.user.id);
    
    const emoji = result.success ? '✅' : '❌';
    await interaction.editReply(`${emoji} ${result.message}`);
  } catch (error: any) {
    logger.error({ error, eventId, userId }, 'Failed to approve user');
    await interaction.editReply(`❌ ${error.message || 'Failed to approve user'}`);
  }
}

/**
 * Show waitlist for promotion (exported for button-handler)
 */
export async function handlePromote(interaction: ButtonInteraction, eventId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const prisma = getPrismaClient();
  const member = interaction.member instanceof GuildMember ? interaction.member : undefined;
  
  try {
    const hasPermission = await canEditEvent(interaction.user.id, eventId, member);
    if (!hasPermission) {
      await interaction.editReply('❌ Only the event creator or administrators can promote participants.');
      return;
    }

    // Get participants from waitlist and pending approval
    const promotable = await prisma.participant.findMany({
      where: { 
        eventId, 
        status: { in: ['waitlist', 'pending'] }
      },
      select: { userId: true, username: true, role: true, status: true },
      orderBy: { joinedAt: 'asc' },
    });

    if (promotable.length === 0) {
      await interaction.editReply('❌ No participants in waitlist or pending approval.');
      return;
    }

    // Separate by status
    const waitlisted = promotable.filter(p => p.status === 'waitlist');
    const pending = promotable.filter(p => p.status === 'pending');

    // Build text
    let text = `⏫ **Promote Participants**\n\n`;
    
    if (pending.length > 0) {
      text += `**Pending Approval** (${pending.length}):\n`;
      text += pending.map((p: any, i: number) => {
        const roleInfo = p.role ? ` [${p.role}]` : '';
        return `${i + 1}. <@${p.userId}>${roleInfo}`;
      }).join('\n');
      text += '\n\n';
    }

    if (waitlisted.length > 0) {
      text += `**Waitlist / Bench** (${waitlisted.length}):\n`;
      text += waitlisted.map((p: any, i: number) => {
        const roleInfo = p.role ? ` [${p.role}]` : '';
        return `${i + 1}. <@${p.userId}>${roleInfo}`;
      }).join('\n');
    }

    const components: any[] = [];

    // Add "Promote Next" button
    const promoteNextRow = new ActionRowBuilder<any>().addComponents(
      new ButtonBuilder()
        .setCustomId(`promote_next:${eventId}`)
        .setLabel('Promote Next')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⏫')
    );
    components.push(promoteNextRow);

    // Add individual promotion buttons
    for (let i = 0; i < Math.min(promotable.length, 20); i += 4) {
      const row = new ActionRowBuilder<any>();
      
      for (let j = i; j < Math.min(i + 4, promotable.length, 20); j++) {
        const p = promotable[j];
        const emoji = p.status === 'pending' ? '⏳' : '📋';
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`promote_user:${eventId}:${p.userId}`)
            .setLabel(`${j + 1}. ${p.username}`)
            .setStyle(p.status === 'pending' ? ButtonStyle.Secondary : ButtonStyle.Primary)
            .setEmoji(emoji)
        );
      }
      
      components.push(row);
    }

    await interaction.editReply({
      content: text,
      components,
    });
  } catch (error: any) {
    logger.error({ error, eventId }, 'Failed to load waitlist');
    await interaction.editReply(`❌ ${error.message || 'Failed to load waitlist'}`);
  }
}

/**
 * Promote specific user from waitlist (exported for button-handler)
 */
export async function handlePromoteUser(interaction: ButtonInteraction, eventId: string, userId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const member = interaction.member instanceof GuildMember ? interaction.member : undefined;
  
  try {
    const hasPermission = await canEditEvent(interaction.user.id, eventId, member);
    if (!hasPermission) {
      await interaction.editReply('❌ Only the event creator or administrators can promote participants.');
      return;
    }

    const result = await promoteParticipant(eventId, userId, interaction.user.id);
    
    const emoji = result.success ? '✅' : '❌';
    await interaction.editReply(`${emoji} ${result.message}`);
  } catch (error: any) {
    logger.error({ error, eventId, userId }, 'Failed to promote user');
    await interaction.editReply(`❌ ${error.message || 'Failed to promote user'}`);
  }
}

/**
 * Promote next person from waitlist (exported for button-handler)
 */
export async function handlePromoteNext(interaction: ButtonInteraction, eventId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const member = interaction.member instanceof GuildMember ? interaction.member : undefined;
  
  try {
    const hasPermission = await canEditEvent(interaction.user.id, eventId, member);
    if (!hasPermission) {
      await interaction.editReply('❌ Only the event creator or administrators can promote participants.');
      return;
    }

    const result = await promoteNext(eventId, interaction.user.id);
    
    const emoji = result.success ? '✅' : '❌';
    await interaction.editReply(`${emoji} ${result.message}`);
  } catch (error: any) {
    logger.error({ error, eventId }, 'Failed to promote next participant');
    await interaction.editReply(`❌ ${error.message || 'Failed to promote next participant'}`);
  }
}
