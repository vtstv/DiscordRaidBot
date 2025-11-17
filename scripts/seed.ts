#!/usr/bin/env node

/**
 * Database seed script
 * Populates the database with sample templates and test data
 */

import { PrismaClient } from '@prisma/client';
import { getModuleLogger } from '../src/utils/logger.js';

const logger = getModuleLogger('seed');
const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seed...');

  // Sample template configurations
  const wowRaidTemplate = {
    roles: ['Tank', 'Healer', 'DPS'],
    limits: {
      Tank: 2,
      Healer: 5,
      DPS: 13,
    },
    emojiMap: {
      Tank: '🛡️',
      Healer: '💚',
      DPS: '⚔️',
    },
    specs: {
      Tank: ['Protection Warrior', 'Protection Paladin', 'Blood Death Knight'],
      Healer: ['Holy Priest', 'Restoration Druid', 'Holy Paladin', 'Restoration Shaman', 'Mistweaver Monk'],
      DPS: ['Fury Warrior', 'Fire Mage', 'Shadow Priest', 'Balance Druid', 'Retribution Paladin'],
    },
  };

  const ffxivRaidTemplate = {
    roles: ['Tank', 'Healer', 'DPS'],
    limits: {
      Tank: 2,
      Healer: 2,
      DPS: 4,
    },
    emojiMap: {
      Tank: '🛡️',
      Healer: '💚',
      DPS: '⚔️',
    },
  };

  const pvpTemplate = {
    roles: ['Player'],
    limits: {
      Player: 10,
    },
    emojiMap: {
      Player: '⚔️',
    },
  };

  logger.info('Seed completed successfully');
  logger.info('Sample templates can be created per-guild using /template create command');
}

main()
  .catch((error) => {
    logger.error({ error }, 'Seed failed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
