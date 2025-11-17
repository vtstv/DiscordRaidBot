// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/utils/time.ts
// Time and timezone utility functions using Luxon

import { DateTime } from 'luxon';
import { getModuleLogger } from './logger.js';

const logger = getModuleLogger('time-utils');

/**
 * Parse a time string with timezone support
 * @param timeString Time string to parse (ISO 8601 or human-readable)
 * @param timezone IANA timezone (e.g., "America/New_York")
 * @returns DateTime object or null if parsing fails
 */
export function parseTime(timeString: string, timezone = 'UTC'): DateTime | null {
  try {
    // Try parsing as ISO
    let dt = DateTime.fromISO(timeString, { zone: timezone });
    
    if (!dt.isValid) {
      // Try parsing as SQL format
      dt = DateTime.fromSQL(timeString, { zone: timezone });
    }
    
    if (!dt.isValid) {
      // Try parsing with common formats (YYYY-MM-DD HH:MM)
      dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm', { zone: timezone });
    }

    if (!dt.isValid) {
      // Try parsing European format (DD.MM.YYYY HH:MM)
      dt = DateTime.fromFormat(timeString, 'dd.MM.yyyy HH:mm', { zone: timezone });
    }

    if (!dt.isValid) {
      // Try European format without time (DD.MM.YYYY)
      dt = DateTime.fromFormat(timeString, 'dd.MM.yyyy', { zone: timezone });
    }

    if (dt.isValid) {
      return dt;
    }

    logger.warn({ timeString, timezone }, 'Failed to parse time string');
    return null;
  } catch (error) {
    logger.error({ error, timeString, timezone }, 'Error parsing time');
    return null;
  }
}

/**
 * Parse a duration string like "1h", "30m", "2h30m"
 * @param durationString Duration string
 * @returns Duration in milliseconds or null if invalid
 */
export function parseDuration(durationString: string): number | null {
  try {
    const regex = /(\d+)([smhd])/g;
    let totalMs = 0;
    let match;

    while ((match = regex.exec(durationString)) !== null) {
      const value = parseInt(match[1], 10);
      const unit = match[2];

      switch (unit) {
        case 's':
          totalMs += value * 1000;
          break;
        case 'm':
          totalMs += value * 60 * 1000;
          break;
        case 'h':
          totalMs += value * 60 * 60 * 1000;
          break;
        case 'd':
          totalMs += value * 24 * 60 * 60 * 1000;
          break;
      }
    }

    return totalMs > 0 ? totalMs : null;
  } catch (error) {
    logger.error({ error, durationString }, 'Error parsing duration');
    return null;
  }
}

/**
 * Format a DateTime for Discord timestamp
 * @param dt DateTime object
 * @param style Discord timestamp style (t, T, d, D, f, F, R)
 * @returns Discord timestamp string
 */
export function formatDiscordTimestamp(dt: DateTime, style: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' = 'F'): string {
  const unixTimestamp = Math.floor(dt.toMillis() / 1000);
  return `<t:${unixTimestamp}:${style}>`;
}

/**
 * Get current time in a specific timezone
 * @param timezone IANA timezone
 * @returns DateTime object
 */
export function now(timezone = 'UTC'): DateTime {
  return DateTime.now().setZone(timezone);
}

/**
 * Validate timezone string
 * @param timezone IANA timezone string
 * @returns true if valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    const dt = DateTime.now().setZone(timezone);
    return dt.isValid;
  } catch {
    return false;
  }
}

/**
 * Calculate time until an event
 * @param eventTime Event DateTime
 * @returns Human-readable duration string
 */
export function getTimeUntil(eventTime: DateTime): string {
  const now = DateTime.now();
  const diff = eventTime.diff(now, ['days', 'hours', 'minutes']);
  
  const parts: string[] = [];
  
  if (diff.days > 0) {
    parts.push(`${Math.floor(diff.days)}d`);
  }
  if (diff.hours > 0) {
    parts.push(`${Math.floor(diff.hours)}h`);
  }
  if (diff.minutes > 0) {
    parts.push(`${Math.floor(diff.minutes)}m`);
  }
  
  return parts.length > 0 ? parts.join(' ') : 'now';
}
