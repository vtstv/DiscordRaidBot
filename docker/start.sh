#!/bin/sh
# Copyright (c) 2025 Murr (https://github.com/vtstv)
# Startup script for Discord Raid Bot
# Runs database migrations before starting the bot

set -e

echo "Starting Discord Raid Bot..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Apply database migrations (will wait for database automatically)
echo "Applying database migrations..."
npx prisma migrate deploy

echo "Migrations applied successfully!"

# Start the application based on role and NODE_ENV
if [ "$START_WEB" = "true" ]; then
  echo "Starting web server..."
  exec tsx src/web/index.ts
elif [ "$NODE_ENV" = "development" ]; then
  echo "Starting bot in development mode..."
  exec npm run dev
else
  echo "Starting bot..."
  exec tsx src/bot/index.ts
fi
