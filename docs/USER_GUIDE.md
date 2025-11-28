# User Guide

Complete guide to using Discord Raid Bot for event management.

## Getting Started

After inviting the bot to your server, use `/config` to configure initial settings.

## Discord Commands

### Event Management

#### `/event create`
Create a new event with interactive options.

**Options:**
- `title` - Event name (required)
- `description` - Event details
- `start-time` - When event starts (format: YYYY-MM-DD HH:MM)
- `max-participants` - Maximum participants (0 = unlimited)
- `channel` - Where to post event message (required)
- `template` - Pre-configured template (optional)

**Voice Channel Options:**
- `create-voice-channel` - Auto-create temporary voice channel
- `voice-channel-name` - Custom name (default: event title)
- `voice-restricted` - Restrict to participants only
- `voice-create-before` - Minutes before event to create channel

**Example:**
```
/event create
  title: Mythic+ Run
  start-time: 2025-11-28 19:00
  max-participants: 5
  channel: #events
  template: Mythic Plus Template
  create-voice-channel: true
  voice-restricted: true
```

#### `/event list`
View all upcoming events for your server.

**Filters:**
- `status` - Filter by status (upcoming/completed/cancelled)
- `show-past` - Include past events

#### `/event edit`
Modify existing event. Opens interactive menu to select what to edit.

**Editable Fields:**
- Title, description, start time
- Max participants
- Template
- Voice channel settings

#### `/event delete`
Permanently delete an event. Requires confirmation.

#### `/event cancel`
Cancel event but keep it in history. Notifies all participants.

#### `/event add-user`
Manually add participant to event.

**Options:**
- `event-id` - Event to add participant to (autocomplete)
- `user` - Discord user to add
- `role` - Role/spec for the user (optional)

#### `/event remove-user`
Remove participant from event.

#### `/event extend-voice`
Extend voice channel lifetime for running events.

**Options:**
- `event-id` - Event with voice channel
- `minutes` - Minutes to extend (1-1440)

### Template Management

#### `/template create`
Create reusable event template.

**Template Configuration:**
- Name and description
- Roles with limits (Tank: 2, Healer: 3, DPS: 10)
- Custom emoji for roles
- Default max participants
- Banner image (optional)

#### `/template list`
View all templates for your server.

#### `/template edit`
Modify existing template. Opens interactive editor.

#### `/template delete`
Delete template. Events using this template are unaffected.

### Configuration

#### `/config`
Interactive settings menu with categories:

**General Settings:**
- Language (EN, RU, DE)
- Timezone
- Manager role

**Event Settings:**
- Reminder intervals
- Archive channel
- Auto-delete after archive
- Thread creation

**Voice Channel Settings:**
- Voice category
- Default duration after event
- Minutes before event to create channel

**Advanced:**
- Approval channels
- Allowed roles
- Log channel

### Statistics

#### `/stats`
View participation statistics.

**Options:**
- `user` - Stats for specific user (default: yourself)
- `period` - Time period (week/month/all)

**Shows:**
- Events attended
- Events created
- Most used roles/specs
- Attendance rate

### Utility

#### `/ping`
Check bot status and response time.

## Interactive Elements

### Event Signup Buttons

Each event message has interactive buttons:

**✅ Join** - Sign up for event
**❌ Leave** - Remove yourself from event
**📝 Select Role** - Choose your role/spec (if template has roles)
**📋 View Participants** - See full participant list

### Participant States

- **✅ Confirmed** - Main roster spot
- **⏳ Waitlist** - Overflow, moved up when spots open
- **🪑 Bench** - No allowed role, waiting for role assignment
- **⏰ Pending** - Awaiting manager approval
- **❌ Declined** - Opted out

### Role Selection

If event uses template with roles:
1. Click "Select Role" button
2. Choose from dropdown (Tank, Healer, DPS, etc.)
3. Bot automatically assigns you to role or waitlist based on limits

## Web Dashboard

Access at `http://localhost:3000` (or your configured domain).

### Login

Click "Login with Discord" and authorize the application.

### Server Selection

Choose which Discord server to manage.

### Features

**Events Page:**
- View all events in calendar/list view
- Create new events with form
- Edit/delete existing events
- Filter by status, date range

**Templates Page:**
- Create/edit templates
- Visual role editor
- Preview template

**Settings Page:**
- Configure all guild settings
- Test reminder messages
- View audit log

**Admin Panel** (requires `ADMIN_USER_IDS`):
- Global statistics across all servers
- Search events from all guilds
- Bulk operations
- System health monitoring

## Voice Channels

Automatic voice channel management for events.

### How It Works

1. **Creation** - Channel created X minutes before event (configurable)
2. **Permissions** - Optional restriction to confirmed participants only
3. **Lifetime** - Auto-deleted Y minutes after event ends (configurable)
4. **Extension** - Use `/event extend-voice` to keep channel longer

### Configuration

**Per-Guild Defaults** (via `/config`):
- Voice category - Where channels are created
- Duration - Minutes after event to keep channel
- Create before - Minutes before event to create

**Per-Event Override** (via `/event create`):
- Create voice channel - Enable/disable
- Name - Custom channel name
- Restricted - Participants only
- Create before - Override guild default

### Voice Channel Permissions

**Unrestricted:**
- Everyone can see and join
- Good for public events

**Restricted (Participants Only):**
- Only confirmed participants can join
- Manager role can always join
- Others can see but cannot join

### Managing Voice Channels

Channels appear in event embed:
```
🎤 Voice Channel: #Event-Voice-123
```

Participants can click to join. Managers can use `/event extend-voice` if event runs longer than expected.

## Tips & Best Practices

### Creating Effective Templates

1. **Name clearly** - "Mythic+ Template", "Raid 20-man"
2. **Set realistic limits** - Match typical group size
3. **Use custom emoji** - Makes roles visually distinct
4. **Add description** - Explain template purpose

### Managing Events

1. **Set reminders** - Default: "1h, 15m" works well
2. **Use templates** - Save time on recurring events
3. **Enable threads** - Keeps discussion organized
4. **Archive completed events** - Keeps channels clean

### Participant Management

1. **Use waitlist** - Set max participants, overflow goes to waitlist
2. **Enable approval** - For competitive events, require manager approval
3. **Add notes** - Use participant notes to track attendance, performance
4. **Check statistics** - `/stats` shows who's most active

### Voice Channel Tips

1. **Create early** - Set "create before" to 30-60 minutes
2. **Extend if needed** - Use `/event extend-voice` for long events
3. **Restrict important events** - Use participant-only for raids/competitive
4. **Use voice category** - Organize with dedicated category

## Permissions

### User Permissions

**Everyone:**
- View events
- Join/leave events
- Use statistics

**Manager Role** (configured in settings):
- Create/edit/delete events
- Create/edit/delete templates
- Approve participants
- Add/remove users manually
- View participant notes

**Admin Users** (ADMIN_USER_IDS):
- Access admin web panel
- Global statistics
- Bulk operations across guilds

## Troubleshooting

### Can't create events
- Check if you have manager role
- Verify bot has permissions in target channel

### Signup button not working
- Check if event is full (waitlist may be available)
- Verify you're not already signed up
- Check approval requirements

### Voice channel not created
- Verify voice category is set in `/config`
- Check bot has "Manage Channels" permission in category
- Ensure event has voice channel enabled

### Reminders not sending
- Verify reminder intervals are set
- Check bot has "Send Messages" in event channel
- Ensure events are in the future

## Next Steps

- [Configuration Guide](CONFIGURATION.md) - Detailed settings explanation
- [Voice Channels](VOICE_CHANNELS.md) - Advanced voice channel setup
- [Templates](TEMPLATES.md) - Template creation guide
