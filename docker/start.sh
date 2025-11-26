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

# Determine what to start based on environment variables
if [ "$START_WEB" = "true" ] && [ "$START_BOT" = "true" ]; then
  # Start both bot and web
  echo "Starting bot + web server..."
  if [ "$NODE_ENV" = "development" ]; then
    exec tsx watch src/index.ts
  else
    exec tsx src/index.ts
  fi
elif [ "$START_WEB" = "true" ]; then
  # Start only web server
  echo "Starting web server..."
  if [ "$NODE_ENV" = "development" ]; then
    exec tsx watch src/web/index.ts
  else
    exec tsx src/web/index.ts
  fi
else
  # Start only bot (default)
  echo "Starting bot..."
  if [ "$NODE_ENV" = "development" ]; then
    exec tsx watch src/bot/index.ts
  else
    exec tsx src/bot/index.ts
  fi
fi
