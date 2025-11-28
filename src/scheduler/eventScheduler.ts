// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Event scheduler main module - coordinates all scheduled tasks

import cron from 'node-cron';
import { getModuleLogger } from '../utils/logger.js';
import { checkReminders } from './tasks/reminders.js';
import { checkEventStart, checkArchiving } from './tasks/archiving.js';
import { checkMessageDeletion } from './tasks/cleanup.js';
import { cleanupOldLogs } from './tasks/logs.js';
import { manageVoiceChannels } from './tasks/voiceChannels.js';

const logger = getModuleLogger('scheduler');

let schedulerTask: cron.ScheduledTask | null = null;

/**
 * Start the event scheduler
 * Runs every minute to check for events needing reminders or archiving
 */
export function startScheduler(): void {
  if (schedulerTask) {
    logger.warn('Scheduler already running');
    return;
  }

  logger.info('Starting event scheduler');

  // Run every minute
  schedulerTask = cron.schedule('* * * * *', async () => {
    try {
      await checkReminders();
      await checkArchiving();
      await checkEventStart();
      await checkMessageDeletion();
      await cleanupOldLogs();
      await manageVoiceChannels();
    } catch (error) {
      logger.error({ error }, 'Scheduler task failed');
    }
  });

  logger.info('Event scheduler started');
}

/**
 * Stop the event scheduler
 */
export function stopScheduler(): void {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    logger.info('Event scheduler stopped');
  }
}
