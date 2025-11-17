# Discord Raid Bot

**Author**: Murr  
**GitHub**: https://github.com/vtstv  
**License**: MIT

A full-featured Discord event management system (Raid-Helper style bot) built with TypeScript, discord.js v14, and PostgreSQL.

## Features

- Create, edit, and delete events via slash commands
- Embed-based event messages with interactive buttons and select menus
- Participation limits (global and per-role/class)
- Event templates for quick creation
- Automated scheduler with reminders
- Auto-archiving of completed events
- Persistent storage with PostgreSQL
- Audit logging
- Time zone support per guild
- Optional web dashboard
- Fully Dockerized

## Tech Stack

- **Language**: TypeScript (ES2022+)
- **Runtime**: Node.js 18+
- **Discord Library**: discord.js v14
- **ORM**: Prisma with PostgreSQL
- **Scheduler**: node-cron
- **Web Framework**: Fastify (optional)
- **Testing**: Vitest
- **Logging**: Pino
- **Containerization**: Docker + docker-compose

## Quick Start

### Prerequisites

- Node.js 18+ (if running locally)
- Docker & Docker Compose (recommended)
- PostgreSQL (if not using Docker)
- Discord Bot Token (see guide below)

### Accessing the Web Dashboard

Once the bot is running, access the web dashboard at **http://localhost:3000**

The dashboard provides:
- **Real-time event viewing**: See all upcoming and past events
- **Template management**: View all configured event templates
- **Help guide**: Complete documentation for using the bot
- **Auto-refresh**: Data updates every 30 seconds

To use the dashboard:
1. Open http://localhost:3000 in your browser
2. Enter your Discord Server (Guild) ID in the input field
3. Switch between Events, Templates, and Help tabs
4. Your Guild ID is saved automatically in browser storage

### How to Find Your Guild ID

1. Open Discord and go to User Settings
2. Navigate to Advanced settings
3. Enable **"Developer Mode"**
4. Right-click on your server icon and select **"Copy Server ID"**
5. Paste this ID in the dashboard or use it with Discord commands

## 🚀 Quick Start for Discord Server Admins

### Step 1: Get Your Discord Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name (e.g., "Raid Bot")
3. Go to the **"Bot"** section in the left sidebar
4. Click **"Reset Token"** and copy the token (save it securely!)
5. Copy your **Application ID** from the "General Information" page

### Step 2: Invite the Bot to Your Server

Create an invite URL with these permissions:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147485696&scope=bot%20applications.commands
```

Replace `YOUR_CLIENT_ID` with your Application ID from Step 1.

**Required Permissions:**
- Send Messages
- Embed Links
- Use External Emojis
- Add Reactions
- Read Message History
- Use Slash Commands

### Step 3: Configure the Bot

1. Clone this repository or download the files
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and add your Discord credentials:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_application_id_here
   ```

### Step 4: Start the Bot

**Using Docker (Recommended):**
```bash
docker-compose up -d
```

**Using Node.js:**
```bash
npm install
npm run build
npm run migrate
npm start
```

### Step 5: Test the Bot

In your Discord server, try these commands:

1. `/ping` - Check if the bot is online
2. `/template create` - Create your first event template
3. `/event create` - Create an event using your template

### Step 6: Access the Web Dashboard

Open your browser and go to:
```
http://localhost:3000
```

1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click your server icon and click "Copy Server ID"
3. Paste the Server ID in the dashboard

---

## 📚 Discord Server Admin Guide

### Initial Setup

1. **Set Your Timezone:**
   ```
   /settings timezone America/New_York
   ```
   Use [IANA timezone names](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

2. **Configure Reminder Times:**
   ```
   /settings reminders 24h,1h,15m
   ```

3. **Set Log Channel (optional):**
   ```
   /settings log-channel #bot-logs
   ```

4. **Set Archive Channel (optional):**
   ```
   /settings archive-channel #archived-events
   ```

### Creating Event Templates

Templates make it easy to create recurring events with the same structure:

```
/template create
```

**Example: Raid Template**
- Name: "Mythic Raid"
- Roles: Tank, Healer, DPS
- Limits: Tank (2), Healer (4), DPS (14)
- Emojis: 🛡️ (Tank), 💚 (Healer), ⚔️ (DPS)

### Creating Events

```
/event create
```

**Required Information:**
- **Title**: Name of your event
- **Time**: When the event starts (e.g., "2025-11-20 19:00")
- **Template** (optional): Select a pre-made template
- **Channel**: Where to post the event message
- **Description** (optional): Event details
- **Max Participants** (optional): Limit total signups

### Managing Events

- **List Events**: `/event list` - View all upcoming events
- **Cancel Event**: `/event cancel` - Cancel a scheduled event

### How Members Sign Up

When you create an event, the bot posts an interactive message with buttons:

1. Members click the **role button** they want to play (Tank, Healer, DPS)
2. They can select their **specialization** from a dropdown
3. They can **leave** the event by clicking the Leave button
4. If the event is full, they're added to a **waitlist**

### Automatic Features

- **Reminders**: Bot sends reminders before events start (configurable)
- **Auto-Archive**: Completed events are automatically moved to archive
- **Audit Logs**: All actions are logged to database and optional Discord channel

---

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd discord-raid-bot
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your Discord bot token and other configuration

### Running with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f bot

# Stop services
docker-compose down
```

### Running Locally

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate:dev

# Start development server
npm run dev
```

### Building for Production

```bash
# Build TypeScript
npm run build

# Run migrations
npm run migrate

# Start production server
npm start
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate` - Run Prisma migrations (production)
- `npm run migrate:dev` - Run Prisma migrations (development)
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Using Makefile

```bash
make install      # Install dependencies
make dev          # Run development server
make build        # Build project
make migrate-dev  # Run migrations
make docker-up    # Start Docker containers
make docker-logs  # View Docker logs
make help         # Show all available commands
```

## Project Structure

```
.
├── src/
│   ├── bot/          # Discord bot logic
│   ├── commands/     # Slash commands
│   ├── database/     # Database utilities
│   ├── scheduler/    # Event scheduling and reminders
│   ├── templates/    # Event template management
│   └── web/          # Optional web dashboard
├── prisma/
│   └── schema.prisma # Database schema
├── docker/
│   └── healthcheck.sh
├── tests/            # Test files
├── scripts/          # Utility scripts
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Configuration

Configuration is managed through environment variables. See `.env.example` for all available options.

Key configuration:
- `DISCORD_TOKEN` - Your Discord bot token
- `DISCORD_CLIENT_ID` - Your Discord application ID
- `DATABASE_URL` - PostgreSQL connection string
- `DEFAULT_TIMEZONE` - Default timezone for events
- `WEB_ENABLED` - Enable web dashboard (optional)

## Database

The bot uses PostgreSQL with Prisma ORM. Schema includes:
- `Guild` - Discord guild/server settings
- `Template` - Event templates
- `Event` - Scheduled events
- `Participant` - Event participants
- `LogEntry` - Audit logs

## Docker

Multi-stage Dockerfile for optimized production builds:
- Build stage: Compiles TypeScript
- Runtime stage: Minimal alpine image with only production dependencies

Services in docker-compose:
- `bot` - Discord bot service
- `postgres` - PostgreSQL database
- `redis` - Redis (optional, for advanced queuing)
- `web` - Web dashboard (optional, use `--profile web`)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
