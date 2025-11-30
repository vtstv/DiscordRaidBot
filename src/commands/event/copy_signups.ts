import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  GuildMember,
} from 'discord.js';
import db from '../../database/db';
import { logger } from '../../utils/logger';
import { sendEventToChannel } from '../../messages/sendEventToChannel.js';
import { logAction } from '../../services/auditLog.js';

export async function handleEventCopySignups(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const sourceEventId = interaction.options.getString('source-event-id', true);
  const targetEventId = interaction.options.getString('target-event-id', true);
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const username = interaction.user.tag;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch both events
    const sourceEvent = await db().event.findFirst({
      where: { id: sourceEventId, guildId },
      include: { participants: true },
    });

    if (!sourceEvent) {
      await interaction.editReply({
        content: `❌ Source event \`${sourceEventId}\` not found.`,
      });
      return;
    }

    const targetEvent = await db().event.findFirst({
      where: { id: targetEventId, guildId },
      include: { participants: true },
    });

    if (!targetEvent) {
      await interaction.editReply({
        content: `❌ Target event \`${targetEventId}\` not found.`,
      });
      return;
    }

    // Permission check
    const member = interaction.member as GuildMember;
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
    const guild = await db().guild.findUnique({
      where: { id: guildId },
      select: { managerRoleId: true },
    });
    const isManager =
      guild?.managerRoleId &&
      member.roles.cache.has(guild.managerRoleId);

    if (!isAdmin && !isManager) {
      await interaction.editReply({
        content: '❌ You need Administrator or Manager role to copy signups.',
      });
      return;
    }

    // Cannot copy to/from archived events
    if (sourceEvent.status === 'archived') {
      await interaction.editReply({
        content: '❌ Cannot copy signups from an archived event.',
      });
      return;
    }

    if (targetEvent.status === 'archived') {
      await interaction.editReply({
        content: '❌ Cannot copy signups to an archived event.',
      });
      return;
    }

    // Copy participants
    const sourceParticipants = sourceEvent.participants;

    if (sourceParticipants.length === 0) {
      await interaction.editReply({
        content: '⚠️ Source event has no participants to copy.',
      });
      return;
    }

    let copied = 0;
    let skipped = 0;

    for (const participant of sourceParticipants) {
      // Check if user already signed up to target event
      const exists = targetEvent.participants.some(
        (p) => p.userId === participant.userId
      );

      if (exists) {
        skipped++;
        continue;
      }

      // Create participant in target event
      await db().participant.create({
        data: {
          eventId: targetEvent.id,
          userId: participant.userId,
          username: participant.username,
          role: participant.role,
          spec: participant.spec,
          notes: participant.notes,
          status: participant.status,
        },
      });

      copied++;
    }

    // Log action
    await logAction({
      guildId,
      eventId: targetEvent.id,
      userId,
      username,
      action: 'signups_copied',
      details: {
        sourceEventId: sourceEvent.id,
        sourceEventTitle: sourceEvent.title,
        targetEventTitle: targetEvent.title,
        copied,
        skipped,
      },
    });

    // Update target event message with new participants
    if (copied > 0) {
      await sendEventToChannel(targetEvent.id);
    }

    logger.info(
      `[EVENT COPY_SIGNUPS] ${username} copied ${copied} signups from ${sourceEvent.id} to ${targetEvent.id}`
    );

    await interaction.editReply({
      content: `✅ Copied **${copied}** signups from \`${sourceEvent.title}\` to \`${targetEvent.title}\`.\n${
        skipped > 0 ? `⚠️ Skipped **${skipped}** users already signed up.` : ''
      }`,
    });
  } catch (error) {
    logger.error('[EVENT COPY_SIGNUPS] Error:', error);
    await interaction.editReply({
      content: '❌ Failed to copy signups. Check logs for details.',
    });
  }
}
