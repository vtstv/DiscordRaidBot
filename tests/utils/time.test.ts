// path: tests/utils/time.test.ts
// Unit tests for time utilities

import { describe, it, expect } from 'vitest';
import { parseTime, parseDuration, formatDiscordTimestamp, isValidTimezone } from '../src/utils/time.js';
import { DateTime } from 'luxon';

describe('Time Utils', () => {
  describe('parseTime', () => {
    it('should parse ISO 8601 time strings', () => {
      const result = parseTime('2024-03-15T19:00:00', 'UTC');
      expect(result).not.toBeNull();
      expect(result?.isValid).toBe(true);
    });

    it('should parse SQL format time strings', () => {
      const result = parseTime('2024-03-15 19:00:00', 'UTC');
      expect(result).not.toBeNull();
      expect(result?.isValid).toBe(true);
    });

    it('should return null for invalid time strings', () => {
      const result = parseTime('invalid', 'UTC');
      expect(result).toBeNull();
    });

    it('should respect timezone', () => {
      const result = parseTime('2024-03-15T19:00:00', 'America/New_York');
      expect(result).not.toBeNull();
      expect(result?.zoneName).toBe('America/New_York');
    });
  });

  describe('parseDuration', () => {
    it('should parse seconds', () => {
      expect(parseDuration('30s')).toBe(30000);
    });

    it('should parse minutes', () => {
      expect(parseDuration('15m')).toBe(900000);
    });

    it('should parse hours', () => {
      expect(parseDuration('2h')).toBe(7200000);
    });

    it('should parse days', () => {
      expect(parseDuration('1d')).toBe(86400000);
    });

    it('should parse combined durations', () => {
      expect(parseDuration('1h30m')).toBe(5400000);
    });

    it('should return null for invalid format', () => {
      expect(parseDuration('invalid')).toBeNull();
    });
  });

  describe('formatDiscordTimestamp', () => {
    it('should format timestamp with style', () => {
      const dt = DateTime.fromISO('2024-03-15T19:00:00Z');
      const result = formatDiscordTimestamp(dt, 'F');
      expect(result).toMatch(/<t:\d+:F>/);
    });
  });

  describe('isValidTimezone', () => {
    it('should validate UTC', () => {
      expect(isValidTimezone('UTC')).toBe(true);
    });

    it('should validate IANA timezones', () => {
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
    });

    it('should reject invalid timezones', () => {
      expect(isValidTimezone('Invalid/Zone')).toBe(false);
    });
  });
});
