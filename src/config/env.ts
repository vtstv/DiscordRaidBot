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
  WEB_JWT_SECRET: str({
    default: 'change-this-secret-in-production',
    desc: 'JWT secret for web authentication',
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
});

export type Config = typeof config;
