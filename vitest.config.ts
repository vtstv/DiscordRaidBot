import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://raidbot:raidbot@localhost:5432/raidbot',
      DISCORD_CLIENT_ID: '123456789012345678',
      DISCORD_TOKEN: 'mock_token',
      DISCORD_CLIENT_SECRET: 'mock_secret',
      DISCORD_OAUTH_REDIRECT_URI: 'http://localhost:3000/auth/callback',
      WEB_JWT_SECRET: 'mock_secret_key_12345678901234567890',
      WEB_SESSION_SECRET: 'mock_session_secret_1234567890123456',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
});
