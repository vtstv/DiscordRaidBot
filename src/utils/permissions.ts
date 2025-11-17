// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/utils/permissions.ts
// Permission utilities for bot commands and features

import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from 'discord.js';
import getPrismaClient from '../database/db.js';

const prisma = getPrismaClient();

/**
 * Check if user has bot management permissions in guild
 * - Must be Administrator OR
 * - Must have configured manager role
 */
export async function hasManagementPermissions(
  interaction: ChatInputCommandInteraction
): Promise<boolean> {
  if (!interaction.guild || !interaction.member) {
    return false;
  }

  const member = interaction.member as GuildMember;

  // Check if user is administrator
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  // Check if user has configured manager role
  const guild = await prisma.guild.findUnique({
    where: { id: interaction.guild.id },
    select: { managerRoleId: true },
  });

  if (guild?.managerRoleId) {
    return member.roles.cache.has(guild.managerRoleId);
  }

  // Default: only administrators
  return false;
}

/**
 * Check if user can edit specific event
 * - Event creator OR
 * - Administrator OR
 * - Has event editor role
 */
export async function canEditEvent(
  userId: string,
  eventId: string,
  member?: GuildMember
): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { createdBy: true, editorRoleId: true },
  });

  if (!event) {
    return false;
  }

  // Event creator can always edit
  if (event.createdBy === userId) {
    return true;
  }

  // Administrator can always edit
  if (member?.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  // Check editor role
  if (event.editorRoleId && member?.roles.cache.has(event.editorRoleId)) {
    return true;
  }

  return false;
}
