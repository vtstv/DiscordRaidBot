// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/utils/discord.ts
// Discord utility functions for permissions, formatting, etc.

import { PermissionFlagsBits, GuildMember, PermissionResolvable, User } from 'discord.js';

/**
 * Get user's display name (prioritizes global name, then username)
 * @param user Discord user object
 * @returns Display name
 */
export function getUserDisplayName(user: User): string {
  return user.globalName || user.username;
}

/**
 * Check if a member has specific permissions
 * @param member Guild member to check
 * @param permissions Permissions to check
 * @returns true if member has all permissions
 */
export function hasPermissions(member: GuildMember, permissions: PermissionResolvable): boolean {
  return member.permissions.has(permissions);
}

/**
 * Check if a member is an administrator
 * @param member Guild member to check
 * @returns true if member is admin
 */
export function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Truncate text to fit Discord limits
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Split a long message into chunks that fit Discord's limits
 * @param text Text to split
 * @param maxLength Maximum length per chunk (default: 2000)
 * @returns Array of text chunks
 */
export function splitMessage(text: string, maxLength = 2000): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a newline
    let splitIndex = remaining.lastIndexOf('\n', maxLength);
    if (splitIndex === -1) {
      // No newline found, split at space
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex === -1) {
      // No good split point, just cut at maxLength
      splitIndex = maxLength;
    }

    chunks.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex).trim();
  }

  return chunks;
}

/**
 * Format a user mention
 * @param userId Discord user ID
 * @returns Mention string
 */
export function mentionUser(userId: string): string {
  return `<@${userId}>`;
}

/**
 * Format a role mention
 * @param roleId Discord role ID
 * @returns Mention string
 */
export function mentionRole(roleId: string): string {
  return `<@&${roleId}>`;
}

/**
 * Format a channel mention
 * @param channelId Discord channel ID
 * @returns Mention string
 */
export function mentionChannel(channelId: string): string {
  return `<#${channelId}>`;
}

/**
 * Escape markdown characters
 * @param text Text to escape
 * @returns Escaped text
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([*_`~\\|])/g, '\\$1');
}
