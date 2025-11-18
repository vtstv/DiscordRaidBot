#!/bin/sh

# Simple healthcheck script
# Checks if the Node.js process is running

# Check if node process is running (tsx or node)
if ! pgrep -f "node" > /dev/null; then
    echo "Node process not running"
    exit 1
fi

# Process is running
exit 0
