// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/index.ts
// Main entry point - starts both bot and web server

import { startBot } from './bot/index.js';
import { startWebServer } from './web/index.js';
import { getModuleLogger } from './utils/logger.js';

const logger = getModuleLogger('main');

async function main() {
  try {
    logger.info('Starting RaidBot application...');

    // Start bot
    await startBot();
    logger.info('✓ Bot started');

    // Start web server
    await startWebServer();
    logger.info('✓ Web server started');

    logger.info('🚀 RaidBot is fully operational');
  } catch (error) {
    logger.error({ error }, 'Failed to start application');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

main();
