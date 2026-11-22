// path: tests/auth/guilds.test.ts
// Unit tests for auth guilds and permissions logic

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasAdminPermissions } from '../../src/web/auth/discord-oauth.js';
import { guildsHandler } from '../../src/web/routes/auth/guilds.js';
import { getAdminGuildsForUser } from '../../src/web/routes/auth/guild-permissions.js';

// Mocks
const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/services/botGuildSync.js', () => ({
  getBotGuildIds: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/database/db.js', () => ({
  default: vi.fn(() => ({
    guild: {
      findMany: mockFindMany,
    },
  })),
}));

vi.mock('../../src/web/auth/discord-oauth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/web/auth/discord-oauth.js')>();
  return {
    ...actual,
    getGuildMember: vi.fn(),
  };
});

import { getBotGuildIds } from '../../src/services/botGuildSync.js';
import getPrismaClient from '../../src/database/db.js';
import { getGuildMember } from '../../src/web/auth/discord-oauth.js';

describe('Auth Guild Permissions & Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasAdminPermissions', () => {
    it('should return true for ADMINISTRATOR (0x8)', () => {
      expect(hasAdminPermissions('8')).toBe(true);
      expect(hasAdminPermissions('2147483647')).toBe(true);
    });

    it('should return false when ADMINISTRATOR bit is missing', () => {
      expect(hasAdminPermissions('0')).toBe(false);
      expect(hasAdminPermissions('32')).toBe(false); // MANAGE_GUILD
    });
  });

  describe('guildsHandler', () => {
    it('should return 401 if unauthenticated', async () => {
      const req: any = { session: {} };
      const reply: any = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      await guildsHandler(req, reply);
      expect(reply.code).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    });

    it('should quickly filter guilds by bot presence and db data without calling Discord API', async () => {
      const mockAdminGuilds = [
        { id: 'guild-1', name: 'Server 1', icon: null, owner: true, isRoleBased: false },
        { id: 'guild-2', name: 'Server 2', icon: null, owner: false, isRoleBased: false },
        { id: 'guild-3', name: 'Server 3', icon: null, owner: false, isRoleBased: false },
      ];

      const req: any = {
        session: {
          user: { id: 'user-123', username: 'testuser' },
          adminGuilds: mockAdminGuilds,
        },
      };

      const reply: any = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      // Mock bot in guild-1, db has guild-2, neither has guild-3
      vi.mocked(getBotGuildIds).mockResolvedValue(['guild-1']);
      mockFindMany.mockResolvedValue([{ id: 'guild-2' }] as any);

      await guildsHandler(req, reply);

      expect(getGuildMember).not.toHaveBeenCalled(); // Crucial: No serial Discord API calls!
      expect(reply.send).toHaveBeenCalledWith({
        guilds: [
          { ...mockAdminGuilds[0], hasBot: true },
          { ...mockAdminGuilds[1], hasBot: false },
        ],
      });
    });
  });

  describe('getAdminGuildsForUser', () => {
    it('should filter candidate guilds by botGuildIds and userGuilds, checking members in parallel', async () => {
      const userGuilds = [
        { id: 'guild-1', name: 'Admin Server', icon: null, owner: true, permissions: '8' },
        { id: 'guild-2', name: 'Role Server', icon: null, owner: false, permissions: '0' },
        { id: 'guild-3', name: 'Not In Bot Server', icon: null, owner: false, permissions: '0' },
      ];

      // Bot is in guild-1 and guild-2, but not guild-3
      vi.mocked(getBotGuildIds).mockResolvedValue(['guild-1', 'guild-2']);
      mockFindMany.mockResolvedValue([
        { id: 'guild-2', name: 'Role Server', dashboardRoles: ['role-mod'] },
      ] as any);

      // Mock member check returning role
      vi.mocked(getGuildMember).mockResolvedValue({
        user: { id: 'user-123', username: 'test', discriminator: '0000', avatar: null },
        roles: ['role-mod'],
      });

      const result = await getAdminGuildsForUser('user-123', userGuilds);

      expect(result).toHaveLength(2);
      expect(result.find(g => g.id === 'guild-1')).toMatchObject({ id: 'guild-1', isRoleBased: false });
      expect(result.find(g => g.id === 'guild-2')).toMatchObject({ id: 'guild-2', isRoleBased: true });
      expect(getGuildMember).toHaveBeenCalledTimes(1);
      expect(getGuildMember).toHaveBeenCalledWith('guild-2', 'user-123');
    });

    it('should handle getGuildMember timeout/failure gracefully without crashing', async () => {
      const userGuilds = [
        { id: 'guild-1', name: 'Admin Server', icon: null, owner: true, permissions: '8' },
        { id: 'guild-2', name: 'Failing Server', icon: null, owner: false, permissions: '0' },
      ];

      vi.mocked(getBotGuildIds).mockResolvedValue(['guild-1', 'guild-2']);
      mockFindMany.mockResolvedValue([
        { id: 'guild-2', name: 'Failing Server', dashboardRoles: ['role-mod'] },
      ] as any);

      // getGuildMember returns null (timeout or 429)
      vi.mocked(getGuildMember).mockResolvedValue(null);

      const result = await getAdminGuildsForUser('user-123', userGuilds);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('guild-1');
    });
  });
});
