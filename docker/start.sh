#!/bin/sh
# Copyright (c) 2025 Murr (https://github.com/vtstv)
# Startup script for Discord Raid Bot
# Runs database migrations before starting the bot

set -e

echo "Starting Discord Raid Bot..."

#!/bin/sh
# Copyright (c) 2025 Murr (https://github.com/vtstv)
# Startup script for Discord Raid Bot
# Runs database migrations before starting the bot

set -e

echo "Starting Discord Raid Bot..."

# Wait for database to be ready
echo "Waiting for database connection..."
until npx prisma db execute --stdin <<EOF 2>/dev/null
SELECT 1;
EOF
do
  echo "Database not ready yet, retrying in 2 seconds..."
  sleep 2
done

echo "Database is ready!"

# Apply database migrations
echo "Applying database migrations..."
npx prisma migrate deploy

echo "Migrations applied successfully!"

# Start the application based on NODE_ENV
if [ "$NODE_ENV" = "development" ]; then
  echo "Starting in development mode..."
  exec npm run dev
else
  echo "Starting in production mode..."
  exec node dist/bot/index.js
fi

# Run migrations
echo "Applying database migrations..."
npx prisma migrate deploy

echo "Migrations applied successfully!"

# Start the bot
echo "Starting bot..."
exec node dist/bot/index.js
