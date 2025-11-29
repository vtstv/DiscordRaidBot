# Docker Deployment Guide

This guide explains how to deploy the Discord Raid Bot using pre-built Docker images from Docker Hub.

## Prerequisites

- Docker Engine 20.10+ and Docker Compose V2
- A Discord Bot Token
- A Discord Application with OAuth2 configured
- A server with at least 1GB RAM and 10GB disk space

## Quick Start

### 1. Create Project Directory

```bash
mkdir raidbot
cd raidbot
```

### 2. Create Environment File

Create a `.env` file with your configuration:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Admin Configuration (optional)
ADMIN_USER_IDS=your_discord_user_id

# Database Configuration
POSTGRES_USER=raidbot
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=raidbot

# Web Dashboard Configuration
WEB_PORT=3000
WEB_BASE_URL=https://yourdomain.com
WEB_SESSION_SECRET=your_random_secret_at_least_32_chars_long_12345678

# OAuth Redirect URI
DISCORD_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback

# Environment
NODE_ENV=production
```

**Important:** Replace all placeholder values with your actual credentials.

### 3. Create Docker Compose File

Create a `docker-compose.yml` file:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  bot:
    image: vtstv/raidbot:latest
    restart: unless-stopped
    command: ["npm", "run", "start:bot"]
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "/healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  web:
    image: vtstv/raidbot:latest
    restart: unless-stopped
    command: ["npm", "run", "start:web"]
    env_file: .env
    ports:
      - "${WEB_PORT}:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres-data:
```

### 4. Start the Services

```bash
docker compose up -d
```

### 5. Check Service Status

```bash
docker compose ps
```

All services should show as "healthy" after a minute.

### 6. View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f bot
docker compose logs -f web
```

## Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name and create

### 2. Configure Bot

1. Go to "Bot" section
2. Click "Reset Token" to get your bot token
3. Copy the token to your `.env` file as `DISCORD_TOKEN`
4. Enable these Privileged Gateway Intents:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent

### 3. Configure OAuth2

1. Go to "OAuth2" → "General"
2. Copy your Client ID to `.env` as `DISCORD_CLIENT_ID`
3. Copy your Client Secret to `.env` as `DISCORD_CLIENT_SECRET`
4. Add Redirect URL: `https://yourdomain.com/auth/callback`

### 4. Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select bot permissions:
   - Manage Roles
   - Manage Channels
   - Send Messages
   - Manage Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Use Slash Commands
   - Create Public Threads
4. Copy the generated URL and open it to invite the bot

## Web Dashboard Setup

### Using Nginx as Reverse Proxy

Create `/etc/nginx/sites-available/raidbot`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/raidbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Database Management

### Create Backup

```bash
docker compose exec postgres pg_dump -U raidbot raidbot > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Backup

```bash
cat backup_file.sql | docker compose exec -T postgres psql -U raidbot raidbot
```

### Access Database Shell

```bash
docker compose exec postgres psql -U raidbot -d raidbot
```

## Updating the Bot

### Pull Latest Image

```bash
docker compose pull
docker compose up -d
```

The services will restart with zero downtime.

### View What Changed

```bash
docker compose images
```

## Monitoring

### Check Service Health

```bash
docker compose ps
```

### View Resource Usage

```bash
docker stats
```

### View Real-time Logs

```bash
docker compose logs -f --tail=100
```

## Troubleshooting

### Bot Not Connecting

1. Check bot token is correct:
   ```bash
   docker compose logs bot | grep -i token
   ```

2. Verify environment variables:
   ```bash
   docker compose config
   ```

3. Restart bot service:
   ```bash
   docker compose restart bot
   ```

### Web Dashboard Not Loading

1. Check if web service is running:
   ```bash
   docker compose ps web
   ```

2. Check web logs:
   ```bash
   docker compose logs web --tail=50
   ```

3. Verify port is not in use:
   ```bash
   netstat -tuln | grep 3000
   ```

### Database Connection Issues

1. Check postgres is healthy:
   ```bash
   docker compose ps postgres
   ```

2. Test database connection:
   ```bash
   docker compose exec postgres psql -U raidbot -d raidbot -c "SELECT 1;"
   ```

3. Check database logs:
   ```bash
   docker compose logs postgres --tail=50
   ```

### OAuth Login Issues

1. Verify OAuth redirect URI matches exactly:
   - Discord Developer Portal: `https://yourdomain.com/auth/callback`
   - `.env` file: `DISCORD_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback`

2. Check session secret length (must be 32+ characters):
   ```bash
   echo $WEB_SESSION_SECRET | wc -c
   ```

3. Clear browser cookies and try again

### Rate Limiting Issues

If you see "rate limited" errors from Discord API, wait 10-15 minutes before retrying.

## Advanced Configuration

### Custom Port Mapping

Edit `docker-compose.yml`:

```yaml
services:
  web:
    ports:
      - "8080:3000"  # Access on port 8080
```

### Memory Limits

Add resource constraints:

```yaml
services:
  bot:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Custom Network

```yaml
networks:
  raidbot:
    driver: bridge

services:
  postgres:
    networks:
      - raidbot
```

## Security Best Practices

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Use strong passwords** - Generate random passwords for database
3. **Rotate secrets regularly** - Update tokens and secrets periodically
4. **Keep images updated** - Run `docker compose pull` weekly
5. **Use HTTPS only** - Never expose web dashboard over HTTP
6. **Restrict database access** - Don't expose postgres port externally
7. **Monitor logs** - Check for suspicious activity regularly

## Support

For issues or questions:
- GitHub Issues: https://github.com/vtstv/DiscordRaidBot/issues
- Documentation: https://github.com/vtstv/DiscordRaidBot/docs

## License

See [LICENSE](../LICENSE) file in the repository.
