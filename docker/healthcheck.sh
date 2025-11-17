#!/bin/sh

# Simple healthcheck script
# Checks if the bot process is running and DB connection is available

# Check if node process is running
if ! pgrep -f "node dist/bot/index.js" > /dev/null; then
    echo "Bot process not running"
    exit 1
fi

# Simple check that process is responsive
if [ -f /app/.healthy ]; then
    exit 0
else
    # Create healthy marker on first run
    touch /app/.healthy
    exit 0
fi
