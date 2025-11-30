// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/admin/database.ts
// Database backup and restore API routes

import { FastifyInstance } from 'fastify';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream, createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { pipeline } from 'stream/promises';
import path from 'path';
import { requireAdmin } from './middleware.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { config } from '../../../config/env.js';
import { getPrismaClient } from '../../../database/db.js';

const execAsync = promisify(exec);
const logger = getModuleLogger('database-routes');

// Parse DATABASE_URL to get connection details for pg_dump/psql
function getDatabaseConnectionParams() {
  const dbUrl = new URL(config.DATABASE_URL);
  return {
    host: dbUrl.hostname,
    port: dbUrl.port || '5432',
    database: dbUrl.pathname.slice(1), // Remove leading slash
    user: dbUrl.username,
    password: dbUrl.password
  };
}

export async function databaseRoutes(server: FastifyInstance): Promise<void> {
  // Export database dump
  server.post('/export', {
    preHandler: requireAdmin,
  }, async (request, reply) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `raidbot-backup-${timestamp}.sql`;
    const filepath = path.join('/tmp', filename);

    try {
      const dbParams = getDatabaseConnectionParams();
      logger.info('Starting database export');

      // Create pg_dump command
      const dumpCommand = `PGPASSWORD="${dbParams.password}" pg_dump -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.user} -d ${dbParams.database} --no-owner --no-acl -F p -f ${filepath}`;

      // Execute dump
      await execAsync(dumpCommand);

      logger.info({ filename }, 'Database export completed');

      // Set headers for file download
      reply.header('Content-Type', 'application/sql');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);

      // Stream file to response
      const stream = createReadStream(filepath);
      
      // Clean up file after streaming
      stream.on('end', async () => {
        try {
          await unlink(filepath);
          logger.info({ filename }, 'Temporary dump file cleaned up');
        } catch (error) {
          logger.error({ error, filename }, 'Failed to clean up temporary dump file');
        }
      });

      return reply.send(stream);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Database export failed');
      return reply.code(500).send({ 
        error: 'Failed to export database', 
        details: error.message 
      });
    }
  });

  // Import database dump
  server.post('/import', {
    preHandler: requireAdmin,
  }, async (request, reply) => {
    try {
      // Get the raw body buffer
      const sqlContent = request.body as Buffer | string;
      
      if (!sqlContent || (Buffer.isBuffer(sqlContent) && sqlContent.length === 0) || (typeof sqlContent === 'string' && sqlContent.length === 0)) {
        return reply.code(400).send({ error: 'No SQL content provided' });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `raidbot-import-${timestamp}.sql`;
      const filepath = path.join('/tmp', filename);

      logger.info({ size: Buffer.isBuffer(sqlContent) ? sqlContent.length : sqlContent.length }, 'Starting database import');

      // Write SQL content to file
      const fs = await import('fs/promises');
      await fs.writeFile(filepath, sqlContent);

      const dbParams = getDatabaseConnectionParams();
      // Create psql command to restore
      const restoreCommand = `PGPASSWORD="${dbParams.password}" psql -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.user} -d ${dbParams.database} -f ${filepath}`;

      // Execute restore
      const { stdout, stderr } = await execAsync(restoreCommand);

      // Clean up temporary file
      await unlink(filepath);

      logger.info({ 
        stdout: stdout.substring(0, 500),
        stderr: stderr.substring(0, 500)
      }, 'Database import completed');

      return reply.send({ 
        success: true, 
        message: 'Database imported successfully',
        details: {
          filename: filename,
          output: stdout || stderr
        }
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Database import failed');
      return reply.code(500).send({ 
        error: 'Failed to import database', 
        details: error.message 
      });
    }
  });

  // Get database statistics
  server.post('/stats', {
    preHandler: requireAdmin,
  }, async (request, reply) => {
    try {
      const dbParams = getDatabaseConnectionParams();
      const prisma = getPrismaClient();

      // Get database size using raw SQL
      const sizeCommand = `PGPASSWORD="${dbParams.password}" psql -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.user} -d ${dbParams.database} -t -c "SELECT pg_size_pretty(pg_database_size('${dbParams.database}'));"`;
      const { stdout: sizeOutput } = await execAsync(sizeCommand);

      // Get table counts using Prisma
      const [
        guilds, 
        events, 
        templates, 
        participants, 
        logEntries, 
        reminders, 
        participantStats,
        raidPlans,
        compositionPresets,
        dashboardRoles,
        systemSettings
      ] = await Promise.all([
        prisma.guild.count(),
        prisma.event.count(),
        prisma.template.count(),
        prisma.participant.count(),
        prisma.logEntry.count(),
        prisma.reminder.count(),
        prisma.participantStatistics.count(),
        prisma.raidPlan.count(),
        prisma.compositionPreset.count(),
        prisma.dashboardRolePermission.count(),
        prisma.systemSettings.count()
      ]);

      return reply.send({
        databaseSize: sizeOutput.trim(),
        tables: [
          { schema: 'public', table: 'Guild', rows: guilds },
          { schema: 'public', table: 'Event', rows: events },
          { schema: 'public', table: 'Template', rows: templates },
          { schema: 'public', table: 'Participant', rows: participants },
          { schema: 'public', table: 'LogEntry', rows: logEntries },
          { schema: 'public', table: 'Reminder', rows: reminders },
          { schema: 'public', table: 'ParticipantStatistics', rows: participantStats },
          { schema: 'public', table: 'RaidPlan', rows: raidPlans },
          { schema: 'public', table: 'CompositionPreset', rows: compositionPresets },
          { schema: 'public', table: 'DashboardRolePermission', rows: dashboardRoles },
          { schema: 'public', table: 'SystemSettings', rows: systemSettings }
        ]
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to get database stats');
      return reply.code(500).send({ 
        error: 'Failed to get database statistics', 
        details: error.message 
      });
    }
  });
}
