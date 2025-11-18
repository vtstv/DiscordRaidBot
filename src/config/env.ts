// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/config/env.ts
// Typed configuration loader using envalid

import { cleanEnv, str, num, bool, url } from 'envalid';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

export const config = cleanEnv(process.env, {
  // Discord
  DISCORD_TOKEN: str({
    desc: 'Discord bot token',
  }),
  DISCORD_CLIENT_ID: str({
    desc: 'Discord application/client ID',
  }),
  DISCORD_CLIENT_SECRET: str({
    desc: 'Discord OAuth2 client secret (for web dashboard)',
    default: '',
  }),
  DISCORD_OAUTH_REDIRECT_URI: str({
    desc: 'OAuth2 redirect URI (e.g., http://localhost:3000/auth/callback)',
    default: 'http://localhost:3000/auth/callback',
  }),

  // Database
  DATABASE_URL: url({
    desc: 'PostgreSQL connection URL',
  }),

  // Node environment
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development',
  }),

  // Logging
  LOG_LEVEL: str({
    choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
    default: 'info',
  }),

  // Web panel
  WEB_ENABLED: bool({
    default: false,
    desc: 'Enable web dashboard',
  }),
  WEB_PORT: num({
    default: 3000,
    desc: 'Web server port',
  }),
  WEB_BASE_URL: str({
    default: 'http://localhost:3000',
    desc: 'Web panel base URL (no trailing slash)',
  }),
  WEB_JWT_SECRET: str({
    default: 'change-this-secret-in-production',
    desc: 'JWT secret for web authentication',
  }),
  WEB_SESSION_SECRET: str({
    default: 'change-this-session-secret-in-production',
    desc: 'Session secret for web dashboard',
  }),

  // Redis (optional)
  REDIS_URL: url({
    default: 'redis://localhost:6379',
    desc: 'Redis connection URL',
  }),

  // Bot settings
  DEFAULT_TIMEZONE: str({
    default: 'UTC',
    desc: 'Default timezone for events',
  }),
  REMINDER_INTERVALS: str({
    default: '1h,15m',
    desc: 'Comma-separated reminder intervals (e.g., "1h,15m")',
  }),

  // Admin
  ADMIN_USER_IDS: str({
    default: '',
    desc: 'Comma-separated list of Discord user IDs with admin access',
  }),
  ADMIN_USERNAME: str({
    default: '',
    desc: 'Admin panel username for password authentication',
  }),
  ADMIN_PASSWORD: str({
    default: '',
    desc: 'Admin panel password for password authentication',
  }),
  ADMIN_BASE_URL: str({
    default: 'http://localhost:3000',
    desc: 'Admin panel base URL (no trailing slash)',
  }),
});

export type Config = typeof config;
