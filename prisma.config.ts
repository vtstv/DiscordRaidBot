// Prisma 7 Configuration File
// This configures the Prisma CLI for migrations, seeding, and schema management

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Schema location
  schema: 'prisma/schema.prisma',
  
  // Migrations configuration
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx scripts/seed.ts',
  },
  
  // Database connection (for CLI commands: migrate, db push, etc.)
  datasource: {
    url: env('DATABASE_URL'),
  },
});
