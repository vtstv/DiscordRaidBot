// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/database/db.ts
// Database connection manager using Prisma

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getModuleLogger } from '../utils/logger.js';
import { config } from '../config/env.js';

const logger = getModuleLogger('database');

/**
 * Prisma Client singleton
 */
let prisma: PrismaClient | null = null;

/**
 * Get the Prisma client instance
 * @returns Prisma client
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    logger.info('Initializing Prisma client');
    
    // Prisma 7: Use PostgreSQL adapter for database connections
    const adapter = new PrismaPg({
      connectionString: config.DATABASE_URL,
    });
    
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      adapter,
    });
  }

  return prisma;
}

/**
 * Connect to the database
 */
export async function connectDatabase(): Promise<void> {
  const client = getPrismaClient();
  
  try {
    logger.info('Connecting to database...');
    await client.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    throw error;
  }
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    logger.info('Disconnecting from database...');
    await prisma.$disconnect();
    logger.info('Database disconnected');
    prisma = null;
  }
}

/**
 * Health check for database connection
 * @returns true if database is connected and healthy
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ error }, 'Database health check failed');
    return false;
  }
}

// Export the client getter as default
export default getPrismaClient;
