// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/utils/logger.ts
// Pino logger wrapper with child logger support

import pino, { Logger } from 'pino';
import { config } from '../config/env.js';

const isDevelopment = config.NODE_ENV === 'development';

/**
 * Base logger instance
 */
export const logger: Logger = pino({
  level: config.LOG_LEVEL,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with context
 * @param context Context object to bind to child logger
 * @returns Child logger instance
 */
export function createLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}

/**
 * Get a logger for a specific module
 * @param moduleName Name of the module
 * @returns Logger instance with module context
 */
export function getModuleLogger(moduleName: string): Logger {
  return createLogger({ module: moduleName });
}

export default logger;
