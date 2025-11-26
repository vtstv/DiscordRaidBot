// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Log cleanup task for audit log retention

import { DateTime } from 'luxon';
import getPrismaClient from '../../database/db.js';
import { getModuleLogger } from '../../utils/logger.js';

const logger = getModuleLogger('scheduler:logs');
const prisma = getPrismaClient();

/**
 * Clean up old audit logs based on guild retention settings
 */
export async function cleanupOldLogs(): Promise<void> {
  const now = DateTime.now();

  // Get all guilds with log retention configured
  const guilds = await prisma.guild.findMany({
    where: {
      logRetentionDays: { not: null },
    },
    select: {
      id: true,
      logRetentionDays: true,
    },
  });

  for (const guild of guilds) {
    if (!guild.logRetentionDays) continue;

    const cutoffDate = now.minus({ days: guild.logRetentionDays }).toJSDate();

    try {
      const result = await prisma.logEntry.deleteMany({
        where: {
          guildId: guild.id,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      if (result.count > 0) {
        logger.info({ guildId: guild.id, count: result.count, retentionDays: guild.logRetentionDays }, 'Cleaned up old audit logs');
      }
    } catch (error) {
      logger.error({ error, guildId: guild.id }, 'Failed to cleanup old logs');
    }
  }
}
