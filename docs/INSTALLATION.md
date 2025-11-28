# Installation Guide

Quick guide to install and run Discord Raid Bot.

## Prerequisites

- **Docker & Docker Compose** (recommended) OR **Node.js 18+**
- **Discord Bot Token** - [Create application](https://discord.com/developers/applications)
- **PostgreSQL** (if running without Docker)

## Method 1: Docker (Recommended)

### 1. Clone Repository

```bash
git clone https://github.com/vtstv/DiscordRaidBot.git
cd DiscordRaidBot
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Discord Configuration
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# Database (keep default for Docker)
DATABASE_URL=postgresql://raidbot:password@postgres:5432/raidbot

# Optional: Admin Access
ADMIN_USER_IDS=your_discord_user_id

# Optional: Web Dashboard Port
PORT=3000
```

### 3. Start Services

**Full Stack (Bot + Web Dashboard):**
```bash
docker-compose up -d
```

**Bot Only (Minimal Resources):**
```bash
docker-compose up -d bot postgres redis
```

### 4. Verify Installation

Check logs:
```bash
docker logs raidbot-bot
docker logs raidbot-web  # if running web
```

Access web dashboard: **http://localhost:3000**

### 5. Invite Bot to Server

Replace `YOUR_CLIENT_ID` with your Discord Application ID:

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147485696&scope=bot%20applications.commands
```

Required permissions:
- Manage Channels
- Manage Roles
- Send Messages
- Embed Links
- Attach Files
- Use Slash Commands
- Connect (for voice channels)
- Move Members (for voice channels)

## Method 2: Manual Installation

### 1. Install Dependencies

```bash
git clone https://github.com/vtstv/DiscordRaidBot.git
cd DiscordRaidBot
npm install
```

### 2. Setup Database

Install PostgreSQL and create database:
```sql
CREATE DATABASE raidbot;
CREATE USER raidbot WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE raidbot TO raidbot;
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection:
```env
DATABASE_URL=postgresql://raidbot:your_password@localhost:5432/raidbot
```

### 4. Run Migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5. Build and Start

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Docker Configuration

### Services

- **bot** - Discord bot service
- **web** - Web dashboard (optional, port 3000)
- **postgres** - Database (port 5432)
- **redis** - Pub/sub for bot↔web sync

### Platform Support

Auto-detects your platform (AMD64 or ARM64):
```bash
docker-compose build
```

Specify platform:
```bash
docker-compose build --platform linux/amd64
docker-compose build --platform linux/arm64
```

### Resource Usage

**Minimal (Bot Only):**
- CPU: ~0.5 cores
- RAM: ~256 MB
- Disk: ~1 GB

**Full Stack:**
- CPU: ~1 core
- RAM: ~512 MB
- Disk: ~2 GB

## Troubleshooting

### Bot Not Starting

Check logs:
```bash
docker logs raidbot-bot --tail 50
```

Common issues:
- Invalid `DISCORD_TOKEN` - verify token in Discord Developer Portal
- Database connection failed - check `DATABASE_URL`
- Missing permissions - ensure bot has required permissions in Discord

### Web Dashboard Not Loading

Check logs:
```bash
docker logs raidbot-web --tail 50
```

Common issues:
- Port 3000 already in use - change `PORT` in `.env`
- Database not connected - verify PostgreSQL is running
- Redis not connected - ensure redis service is running

### Database Migration Errors

Reset and reapply migrations:
```bash
docker-compose exec bot npx prisma migrate deploy
```

For manual installation:
```bash
npx prisma migrate reset  # WARNING: Deletes all data
npx prisma migrate deploy
```

## Next Steps

- [User Guide](USER_GUIDE.md) - Learn how to use the bot
- [Configuration](CONFIGURATION.md) - Customize guild settings
- [Voice Channels](VOICE_CHANNELS.md) - Setup automatic voice channels

## Support

For issues and questions:
- GitHub Issues: https://github.com/vtstv/DiscordRaidBot/issues
- Check logs: `docker logs raidbot-bot`
