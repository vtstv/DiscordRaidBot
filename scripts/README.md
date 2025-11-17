# Database Scripts

This directory contains database-related scripts and utilities.

## Migrations

Prisma migrations are stored in `prisma/migrations/`.

To create a new migration:
```bash
npm run migrate:dev
```

To apply migrations in production:
```bash
npm run migrate
```

## Seed Data

Run the seed script to populate the database with initial data:
```bash
node scripts/seed.js
```
