// path: tests/utils/discord.test.ts
// Unit tests for Discord utilities

import { describe, it, expect } from 'vitest';
import {
  truncate,
  splitMessage,
  mentionUser,
  mentionRole,
  mentionChannel,
  escapeMarkdown,
} from '../src/utils/discord.js';

describe('Discord Utils', () => {
  describe('truncate', () => {
    it('should not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate long text', () => {
      const text = 'This is a very long text';
      const result = truncate(text, 10);
      expect(result).toBe('This is...');
      expect(result.length).toBe(10);
    });
  });

  describe('splitMessage', () => {
    it('should not split short messages', () => {
      const result = splitMessage('Hello', 2000);
      expect(result).toEqual(['Hello']);
    });

    it('should split long messages', () => {
      const text = 'a'.repeat(3000);
      const result = splitMessage(text, 2000);
      expect(result.length).toBeGreaterThan(1);
    });
  });

  describe('mention functions', () => {
    it('should format user mention', () => {
      expect(mentionUser('123456')).toBe('<@123456>');
    });

    it('should format role mention', () => {
      expect(mentionRole('789012')).toBe('<@&789012>');
    });

    it('should format channel mention', () => {
      expect(mentionChannel('345678')).toBe('<#345678>');
    });
  });

  describe('escapeMarkdown', () => {
    it('should escape markdown characters', () => {
      expect(escapeMarkdown('*bold*')).toBe('\\*bold\\*');
      expect(escapeMarkdown('_italic_')).toBe('\\_italic\\_');
      expect(escapeMarkdown('`code`')).toBe('\\`code\\`');
    });

    it('should not modify plain text', () => {
      expect(escapeMarkdown('Hello World')).toBe('Hello World');
    });
  });
});
