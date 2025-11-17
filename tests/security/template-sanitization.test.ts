// path: tests/security/template-sanitization.test.ts
// Security tests for template name sanitization

import { describe, it, expect } from 'vitest';

/**
 * Sanitize template name to prevent SQL injection
 * Copied from src/commands/template.ts for testing
 */
function sanitizeTemplateName(name: string): string {
  // Remove null bytes
  let sanitized = name.replace(/\0/g, '');
  
  // Remove SQL comment markers
  sanitized = sanitized.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');
  
  // Remove SQL keywords that could be dangerous (case-insensitive)
  // Do this BEFORE removing semicolons to preserve word boundaries
  const dangerousPatterns = [
    /\bDROP\b/gi,
    /\bDELETE\b/gi,
    /\bTRUNCATE\b/gi,
    /\bEXEC\b/gi,
    /\bEXECUTE\b/gi,
    /\bUNION\b/gi,
    /\bINSERT\b/gi,
    /\bUPDATE\b/gi,
    /\bALTER\b/gi,
    /\bCREATE\b/gi,
  ];
  
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Remove semicolons (statement terminators) AFTER keywords
  sanitized = sanitized.replace(/;/g, '');
  
  // Trim whitespace
  return sanitized.trim();
}

describe('Template Name Sanitization Security Tests', () => {
  describe('Valid Names (Should Pass Through)', () => {
    it('should allow basic alphanumeric names', () => {
      expect(sanitizeTemplateName('Mythic Dungeon')).toBe('Mythic Dungeon');
      expect(sanitizeTemplateName('Raid20')).toBe('Raid20');
    });

    it('should allow plus sign and special characters', () => {
      expect(sanitizeTemplateName('Mythic+ Dungeon')).toBe('Mythic+ Dungeon');
      expect(sanitizeTemplateName('M+ #1')).toBe('M+ #1');
      expect(sanitizeTemplateName('Event @ 20:00')).toBe('Event @ 20:00');
    });

    it('should allow emoji', () => {
      expect(sanitizeTemplateName('🎮 Gaming Night')).toBe('🎮 Gaming Night');
      expect(sanitizeTemplateName('🛡️ Tank Event')).toBe('🛡️ Tank Event');
    });

    it('should allow multiple languages', () => {
      expect(sanitizeTemplateName('Событие Рейд')).toBe('Событие Рейд');
      expect(sanitizeTemplateName('イベント')).toBe('イベント');
      expect(sanitizeTemplateName('活动')).toBe('活动');
    });

    it('should allow parentheses and brackets', () => {
      expect(sanitizeTemplateName('Raid (Heroic)')).toBe('Raid (Heroic)');
      expect(sanitizeTemplateName('Event [EU]')).toBe('Event [EU]');
      expect(sanitizeTemplateName('Guild {BEST}')).toBe('Guild {BEST}');
    });
  });

  describe('SQL Injection Attempts (Should Be Sanitized)', () => {
    it('should remove DROP statements', () => {
      expect(sanitizeTemplateName("Test'; DROP TABLE templates;--")).toBe("Test'  TABLE templates");
      expect(sanitizeTemplateName('DROP TABLE users')).toBe('TABLE users');
      expect(sanitizeTemplateName('drop table test')).toBe('table test');
    });

    it('should remove DELETE statements', () => {
      expect(sanitizeTemplateName('Test DELETE FROM users')).toBe('Test  FROM users');
      expect(sanitizeTemplateName('delete from templates')).toBe('from templates');
    });

    it('should remove UNION attacks', () => {
      expect(sanitizeTemplateName("Test' UNION SELECT * FROM users--")).toBe("Test'  SELECT * FROM users");
      expect(sanitizeTemplateName('UNION SELECT password')).toBe('SELECT password');
    });

    it('should remove semicolons (statement terminators)', () => {
      expect(sanitizeTemplateName('Test; DROP TABLE users')).toBe('Test  TABLE users');
      // Keywords removed first (DELETE, UPDATE), then semicolons
      expect(sanitizeTemplateName('Event;DELETE;UPDATE')).toBe('Event');
    });

    it('should remove SQL comment markers', () => {
      expect(sanitizeTemplateName('Test-- comment')).toBe('Test comment');
      expect(sanitizeTemplateName('Test /* comment */ end')).toBe('Test  comment  end');
    });

    it('should remove EXEC/EXECUTE', () => {
      expect(sanitizeTemplateName('Test EXEC sp_dropdb')).toBe('Test  sp_dropdb');
      expect(sanitizeTemplateName('EXECUTE malicious')).toBe('malicious');
    });

    it('should remove INSERT statements', () => {
      expect(sanitizeTemplateName('Test INSERT INTO users')).toBe('Test  INTO users');
    });

    it('should remove UPDATE statements', () => {
      expect(sanitizeTemplateName('Test UPDATE users SET')).toBe('Test  users SET');
    });

    it('should remove ALTER statements', () => {
      expect(sanitizeTemplateName('ALTER TABLE drop_column')).toBe('TABLE drop_column');
    });

    it('should remove CREATE statements', () => {
      expect(sanitizeTemplateName('CREATE TABLE malicious')).toBe('TABLE malicious');
    });
  });

  describe('Complex Injection Attempts', () => {
    it('should handle multiple dangerous keywords', () => {
      const input = 'DROP;DELETE;TRUNCATE;EXEC;UNION;INSERT;UPDATE';
      const result = sanitizeTemplateName(input);
      // Semicolons removed, then keywords removed, result is concatenated words
      expect(result.length).toBeLessThan(input.length);
    });

    it('should handle null byte injection', () => {
      // Null byte is removed, but = sign is allowed
      expect(sanitizeTemplateName("Safe\0' OR '1'='1")).toBe("Safe' OR '1'='1");
    });

    it('should handle nested comments', () => {
      expect(sanitizeTemplateName('Test /* /* nested */ */ end')).toBe('Test   nested   end');
    });

    it('should handle mixed case SQL keywords', () => {
      expect(sanitizeTemplateName('DeLeTe FrOm UsErS')).toBe('FrOm UsErS');
      expect(sanitizeTemplateName('DrOp TaBlE test')).toBe('TaBlE test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(sanitizeTemplateName('')).toBe('');
      expect(sanitizeTemplateName('   ')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeTemplateName('  Mythic+ Dungeon  ')).toBe('Mythic+ Dungeon');
    });

    it('should handle very long strings', () => {
      const longName = 'A'.repeat(200);
      const result = sanitizeTemplateName(longName);
      expect(result.length).toBe(200);
    });

    it('should handle strings with only dangerous content', () => {
      expect(sanitizeTemplateName('DROP DELETE TRUNCATE')).toBe('');
      // Hyphens are allowed characters (for names like "Mythic-Plus")
      expect(sanitizeTemplateName(';;;---')).toBe('-');
    });
  });

  describe('Real-World Valid Examples', () => {
    it('should allow common template names', () => {
      const validNames = [
        'Mythic+ Dungeon',
        'Raid (Normal)',
        'PvP @ 20:00',
        'Event #5',
        'Level 70+ Only',
        'Tank/Healer Needed',
        'Gaming Night 🎮',
        '⚔️ DPS Run',
        'Событие №5',
        'M+ Keys +15',
      ];

      validNames.forEach(name => {
        const result = sanitizeTemplateName(name);
        // Should not be empty
        expect(result.length).toBeGreaterThan(0);
        // Should preserve most of the original content
        expect(result.length).toBeGreaterThanOrEqual(name.length * 0.8);
      });
    });
  });

  describe('Suspicion Detection Scenarios', () => {
    it('should detect when too much content is removed', () => {
      const input = 'DROP DELETE TRUNCATE EXEC UNION INSERT UPDATE ALTER CREATE';
      const output = sanitizeTemplateName(input);
      
      // More than 50% removed
      const removalRate = 1 - (output.length / input.length);
      expect(removalRate).toBeGreaterThan(0.5);
    });

    it('should pass normal names with minimal removal', () => {
      const input = 'Mythic+ Dungeon Event';
      const output = sanitizeTemplateName(input);
      
      // Less than 10% removed
      const removalRate = 1 - (output.length / input.length);
      expect(removalRate).toBeLessThan(0.1);
    });
  });
});
