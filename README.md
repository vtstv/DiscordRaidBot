# Discord Raid Bot

A powerful Discord event management system, built with TypeScript and discord.js v14.

## 📸 Screenshots

<div align="center">

### Discord Event Management
<img src="Media/discord.png" alt="Discord Event Interface" width="700"/>

### Web Admin Panel
<img src="Media/botadmin.png" alt="Admin Panel" width="700"/>

### Panel Selection
<img src="Media/selectpanel.png" alt="Server Selection" width="700"/>

### Template Creation & Editing
<img src="Media/create_edit_template.png" alt="Template Editor" width="700"/>

</div>

## Features

- 📅 **Event Management** - Create, edit, delete events with slash commands
- 🎯 **Interactive Signups** - Buttons and select menus for participant management
- 📊 **Role Limits** - Configure per-role participant limits
- 📝 **Templates** - Reusable event templates for quick creation
- ⏰ **Scheduler** - Automated reminders and archiving
- 🌍 **Timezone Support** - Per-guild timezone settings
- 🌐 **Web Dashboard** - Manage events through browser interface
- 👥 **Admin Panel** - Global statistics and bulk operations
- 🔍 **Audit Logging** - Complete action history
- 🐳 **Docker Ready** - Full containerization with Docker Compose
- 🏗️ **Multi-Platform** - Native ARM64 and AMD64 support

## Tech Stack

- **Backend**: TypeScript, Node.js 18+, discord.js v14
- **Database**: PostgreSQL with Prisma ORM
- **Web**: Fastify, React, Tailwind CSS
- **Scheduler**: node-cron
- **Container**: Docker + Docker Compose

## Quick Start

### 1. Prerequisites

- Docker & Docker Compose (recommended) OR Node.js 18+
- Discord Bot Token ([Get one here](https://discord.com/developers/applications))

### 2. Setup

Clone and configure:

```bash
git clone https://github.com/vtstv/DiscordRaidBot.git
cd DiscordRaidBot
cp .env.example .env
```

Edit `.env` with your values:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DATABASE_URL=postgresql://raidbot:password@postgres:5432/raidbot
ADMIN_USER_IDS=your_discord_user_id
```

### 3. Run with Docker

```bash
docker-compose up -d
```

The bot will start automatically along with:
- PostgreSQL database
- Web dashboard at http://localhost:3000

### 4. Invite Bot to Server

Use this URL (replace `YOUR_CLIENT_ID`):

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147485696&scope=bot%20applications.commands
```

## Usage

### Discord Commands

- `/event create` - Create new event
- `/event list` - View all events
- `/event delete` - Delete event
- `/template create` - Create event template
- `/template list` - View templates
- `/settings` - Configure guild settings
- `/ping` - Check bot status

### Web Dashboard

Access at **http://localhost:3000**

- **User Panel**: Manage events for your guilds
- **Admin Panel**: Global overview (requires ADMIN_USER_IDS)

Features:
- View and create events
- Manage templates
- Configure guild settings
- Search across all events
- Analytics and audit logs

## Configuration

Edit guild settings via `/settings` command or web dashboard:

- **Timezone**: Default timezone for events
- **Language**: Bot response language (en, ru, de)
- **Reminder Intervals**: When to send reminders (e.g., "1h", "15m")
- **Archive Channel**: Where to move completed events
- **Manager Role**: Who can manage events
- **Approval Channels**: Channels requiring approval for signups
- **Thread Settings**: Auto-create threads for events

## Development

### Local Setup

```bash
npm install
cp .env.example .env
# Edit .env with your settings

# Database
npx prisma generate
npx prisma migrate deploy

# Run
npm run dev
```

### Build

```bash
npm run build
npm start
```

## Docker Services

- **bot**: Discord bot service
- **web**: Web dashboard (port 3000)
- **postgres**: PostgreSQL database (port 5432)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal | Yes |
| `DISCORD_CLIENT_ID` | Application ID | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `ADMIN_USER_IDS` | Comma-separated Discord user IDs for admin access | No |
| `PORT` | Web dashboard port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## Features in Detail

### Event Templates

Create reusable templates with:
- Pre-configured roles (Tank, Healer, DPS, etc.)
- Participant limits per role
- Custom emoji mapping
- Optional banner images

### Participation Management

- **Confirmed** - Main roster
- **Waitlist** - Overflow participants
- **Bench** - Players without allowed roles (if enabled)
- **Pending** - Awaiting approval
- **Declined** - Opted out

### Advanced Settings

- **Deadline**: Close signups X hours before/after event start
- **Allowed Roles**: Restrict signups to specific Discord roles
- **Bench Overflow**: Move unauthorized users to bench instead of denying
- **Thread Creation**: Auto-create discussion threads
- **Auto-delete**: Remove event messages after archiving

## Troubleshooting

**Bot not responding?**
- Check `docker logs raidbot-bot`
- Verify `DISCORD_TOKEN` is correct
- Ensure bot has proper permissions

**Web dashboard not loading?**
- Check `docker logs raidbot-web`
- Verify port 3000 is not in use
- Check `DATABASE_URL` connection

**Database errors?**
- Run `npx prisma migrate deploy`
- Check PostgreSQL is running: `docker ps`

## Docker Multi-Platform Support

This project supports **ARM64** (aarch64) and **AMD64** (x86_64) architectures.

### Quick Build

```bash
# Auto-detect platform (recommended)
docker-compose build

# Build and load locally for current platform
.\docker-build.ps1 -LoadLocal          # Windows
./docker-build.sh latest "" false true # Linux/macOS

# Build for ARM64 specifically
make docker-build-arm64

# Build for AMD64 specifically
make docker-build-amd64

# Build and push to registry (both platforms)
.\docker-build.ps1 -Registry "vtstv" -Push          # Windows/Docker Hub
./docker-build.sh latest "vtstv" true               # Linux/Docker Hub
./docker-build.sh latest "ghcr.io/vtstv" true       # GitHub Container Registry
```

## License

MIT License - see [LICENSE](LICENSE) file for details.


**Made with ❤️ by [Murr](https://github.com/vtstv)**
