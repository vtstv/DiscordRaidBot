# Configuration Guide

Detailed explanation of all configuration options.

## Access Configuration

### Via Discord
```
/config
```
Opens interactive menu with settings categories.

### Via Web Dashboard
1. Go to http://localhost:3000
2. Login with Discord
3. Select your server
4. Navigate to Settings page

## General Settings

### Language
**Options:** English (en), Russian (ru), German (de)

Sets language for:
- Bot responses
- Button labels
- Error messages
- Web dashboard (future)

**Default:** en

### Timezone
**Format:** IANA timezone (e.g., "Europe/Moscow", "America/New_York")

Used for:
- Event time display
- Reminder scheduling
- Statistics reports

**Default:** UTC

**Find your timezone:** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

### Manager Role
**Type:** Discord Role

Members with this role can:
- Create/edit/delete events
- Create/edit/delete templates
- Approve participants
- Add/remove users manually
- View and add participant notes

**Default:** Server administrators only

## Event Settings

### Reminder Intervals
**Format:** Comma-separated time units (e.g., "1h, 30m, 15m")

**Units:**
- `w` - weeks
- `d` - days
- `h` - hours
- `m` - minutes

**Examples:**
- `"1h, 15m"` - 1 hour before, 15 minutes before
- `"1d, 6h, 1h"` - 1 day, 6 hours, 1 hour before
- `"30m"` - 30 minutes before only

**Default:** "1h, 15m"

Reminders are sent in the event channel mentioning all confirmed participants.

### Archive Channel
**Type:** Discord Text Channel

Completed events are moved here as a message containing:
- Event title and description
- Start time
- Final participant list
- Event statistics

**Default:** None (events stay in original channel)

**Tip:** Create dedicated #event-archive channel

### Auto-delete After Archive
**Type:** Boolean (yes/no)

If enabled, original event message is deleted after archiving.

**Default:** No

### Thread Creation
**Options:**
- Disabled
- All events
- Events with template only
- Events without template only

Automatically creates discussion thread for event messages.

**Default:** Disabled

### Thread Archive Duration
**Options:** 1 hour, 24 hours, 3 days, 1 week

How long thread stays active before auto-archiving.

**Default:** 24 hours

## Voice Channel Settings

### Voice Category
**Type:** Discord Voice Category

Voice channels are created in this category.

**Requirements:**
- Must be a category (not a channel)
- Bot must have "Manage Channels" permission in category

**Default:** None (voice channels disabled)

**Setup:**
1. Create category "Event Voice Channels"
2. Set category permissions for bot (Manage Channels, Manage Roles)
3. Select in `/config`

### Voice Duration
**Range:** 5-1440 minutes (5 min - 24 hours)

How long voice channel stays after event ends.

**Examples:**
- 60 - Channel deleted 1 hour after event
- 180 - Channel deleted 3 hours after event
- 0 - Deleted immediately when event ends

**Default:** 60 minutes

**Note:** Can be extended with `/event extend-voice`

### Voice Create Before
**Range:** 5-1440 minutes

How many minutes before event start to create voice channel.

**Examples:**
- 30 - Channel created 30 minutes before
- 60 - Channel created 1 hour before
- 5 - Channel created 5 minutes before

**Default:** 60 minutes

## Advanced Settings

### Approval Channels
**Type:** List of Discord Text Channels

Events posted in these channels require manager approval for signups.

**Use Cases:**
- Competitive raids
- Limited participation events
- Trial runs

**Workflow:**
1. User clicks "Join"
2. Signup marked as "Pending"
3. Manager approves/denies via buttons

**Default:** None (no approval required)

### Allowed Roles
**Type:** List of Discord Roles

If set, only members with these roles can sign up for events.

**Use Cases:**
- Verified members only
- Specific rank requirements
- Team-restricted events

**Default:** None (everyone can signup)

### Bench Overflow
**Type:** Boolean (yes/no)

When user without allowed role tries to signup:
- **Enabled:** User added to bench queue
- **Disabled:** Signup rejected

**Default:** No

### Log Channel
**Type:** Discord Text Channel

Audit log messages sent here:
- Event created/edited/deleted
- Template changes
- User added/removed
- Settings modified

**Format:**
```
[2025-11-28 14:30] Event Created
By: @User#1234
Event: Mythic+ Run
Channel: #events
```

**Default:** None (database logging only)

### Log Retention
**Range:** 1-365 days

How long to keep audit logs in database.

**Default:** 90 days

Logs older than this are automatically deleted.

## Statistics Settings

### Statistics Schedule
**Type:** Cron expression

When to post automated statistics reports.

**Presets:**
- Weekly Monday 09:00 - `0 9 * * 1`
- Monthly 1st 10:00 - `0 10 1 * *`
- Disabled - (empty)

**Default:** Disabled

### Statistics Channel
**Type:** Discord Text Channel

Where automated statistics are posted.

**Required:** If statistics schedule is set

**Report Includes:**
- Total events this period
- Most active participants
- Most popular roles
- Average attendance
- Top event creators

## Configuration Examples

### Casual Guild Setup
```yaml
Language: en
Timezone: America/New_York
Reminders: "1h, 15m"
Archive Channel: #event-archive
Auto-delete: No
Manager Role: @Event Organizer
Voice Category: Event Voices
Voice Duration: 90 minutes
Voice Create Before: 30 minutes
```

### Competitive Guild Setup
```yaml
Language: en
Timezone: Europe/London
Reminders: "1d, 6h, 1h, 15m"
Archive Channel: #raid-history
Auto-delete: Yes
Manager Role: @Officer
Approval Channels: #mythic-raids, #ranked-pvp
Allowed Roles: @Raider, @PvP Team
Voice Category: Restricted Voices
Voice Duration: 180 minutes
Voice Create Before: 60 minutes
Log Channel: #audit-log
Statistics Schedule: Weekly
Statistics Channel: #stats
```

### Minimal Setup
```yaml
Language: en
Timezone: UTC
Manager Role: @Admin
# Everything else: default/disabled
```

## Permissions Required

For bot to apply settings:

**General:**
- Read Messages
- Send Messages
- Embed Links

**Voice Channels:**
- Manage Channels (in voice category)
- Manage Roles (for restricted channels)
- View Channels

**Archive:**
- Send Messages (in archive channel)
- Embed Links
- Attach Files (if event has attachments)

**Threads:**
- Create Public Threads
- Manage Threads

**Statistics:**
- Send Messages (in statistics channel)
- Embed Links

## Configuration Validation

Settings are validated when saved:

**Timezone:**
- Must be valid IANA timezone
- Error shown if invalid

**Channels/Roles:**
- Must exist in your server
- Bot must have access

**Voice Category:**
- Must be category type
- Bot must have Manage Channels permission

**Reminders:**
- Must use valid time units (w, d, h, m)
- Must be future times (not negative)

**Numeric Ranges:**
- Voice Duration: 5-1440
- Voice Create Before: 5-1440
- Log Retention: 1-365

## Resetting Configuration

To reset to defaults:

**Via Discord:**
Use `/config` and set each option to empty/default

**Via Database:**
```sql
DELETE FROM "Guild" WHERE "guildId" = 'your_guild_id';
```
Bot will recreate with defaults on next interaction.

**Via Web:**
Settings page → Reset to Defaults button

## Exporting Configuration

Configuration is stored in database but can be exported:

**Via Web Dashboard:**
Settings → Export JSON

**Via Database Query:**
```sql
SELECT * FROM "Guild" WHERE "guildId" = 'your_guild_id';
```

## Next Steps

- [User Guide](USER_GUIDE.md) - Learn how to use configured features
- [Voice Channels](VOICE_CHANNELS.md) - Detailed voice setup
- [Templates](TEMPLATES.md) - Create reusable templates
