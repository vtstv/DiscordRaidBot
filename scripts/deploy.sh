#!/bin/bash
# Copyright (c) 2025 Murr (https://github.com/vtstv)
# Automated deployment script for Discord Raid Bot
# Usage: ./scripts/deploy.sh [local|remote]

set -e

MODE="${1:-local}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        log_warn ".env file not found, creating from .env.example..."
        if [ -f "$PROJECT_DIR/.env.example" ]; then
            cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
            log_warn "Please edit .env file with your configuration"
            exit 1
        else
            log_error ".env.example not found"
            exit 1
        fi
    fi
    
    log_info "Prerequisites check passed"
}

# Deploy locally
deploy_local() {
    log_info "Deploying locally..."
    
    cd "$PROJECT_DIR"
    
    # Build images
    log_info "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    log_info "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check status
    docker-compose ps
    
    log_info "Local deployment complete!"
    log_info "Bot logs: docker-compose logs -f bot"
    log_info "Web panel: http://localhost:3000"
}

# Deploy to remote server
deploy_remote() {
    log_info "Deploying to remote server..."
    
    # Check for SSH configuration
    if [ -z "$REMOTE_HOST" ]; then
        log_error "REMOTE_HOST environment variable not set"
        log_info "Example: export REMOTE_HOST=ubuntu@XXX.XXX.XXX.XXX"
        exit 1
    fi
    
    if [ -z "$SSH_KEY" ]; then
        log_warn "SSH_KEY not set, using default SSH authentication"
        SSH_CMD="ssh $REMOTE_HOST"
        SCP_CMD="scp"
    else
        SSH_CMD="ssh -i $SSH_KEY $REMOTE_HOST"
        SCP_CMD="scp -i $SSH_KEY"
    fi
    
    log_info "Connecting to $REMOTE_HOST..."
    
    # Test connection
    if ! $SSH_CMD "echo 'Connection successful'" &> /dev/null; then
        log_error "Cannot connect to remote server"
        exit 1
    fi
    
    # Create project directory if it doesn't exist
    $SSH_CMD "mkdir -p ~/DiscordRaidBot"
    
    # Sync files (excluding node_modules, .git, logs)
    log_info "Syncing files to remote server..."
    rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'logs' --exclude 'dist' \
        -e "ssh ${SSH_KEY:+-i $SSH_KEY}" \
        "$PROJECT_DIR/" "$REMOTE_HOST:~/DiscordRaidBot/"
    
    # Execute remote deployment
    log_info "Building and starting services on remote server..."
    $SSH_CMD "cd ~/DiscordRaidBot && docker-compose down && docker-compose build --no-cache && docker-compose up -d"
    
    # Wait and check status
    sleep 10
    $SSH_CMD "cd ~/DiscordRaidBot && docker-compose ps"
    
    log_info "Remote deployment complete!"
    log_info "Check logs: ssh $REMOTE_HOST 'cd ~/DiscordRaidBot && docker-compose logs -f bot'"
}

# Main
main() {
    log_info "Discord Raid Bot Deployment Script"
    log_info "Mode: $MODE"
    
    check_prerequisites
    
    case "$MODE" in
        local)
            deploy_local
            ;;
        remote)
            deploy_remote
            ;;
        *)
            log_error "Invalid mode: $MODE"
            log_info "Usage: $0 [local|remote]"
            exit 1
            ;;
    esac
}

main
