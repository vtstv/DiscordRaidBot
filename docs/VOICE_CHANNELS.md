# Voice Channels Guide

Complete guide to automatic voice channel management.

## Overview

Discord Raid Bot can automatically create and manage temporary voice channels for events.

**Features:**
- Auto-creation before event starts
- Auto-deletion after event ends
- Participant-only restriction option
- Lifetime extension for long events
- Permission management

## Setup

### 1. Create Voice Category

In Discord:
1. Create new category: "Event Voice Channels"
2. Right-click category → Edit Category → Permissions
3. Add bot role with permissions:
   - ✅ Manage Channels
   - ✅ Manage Permissions
   - ✅ View Channel
   - ✅ Connect

### 2. Configure in Bot

**Via Discord:**
```
/config → Voice Channels → Voice Category
```
Select the category you created.

**Via Web Dashboard:**
Settings → Voice Channels → Voice Category

### 3. Set Defaults

**Voice Duration:** How long after event to keep channel
- Recommended: 60-120 minutes
- Range: 5-1440 minutes

**Create Before:** When to create channel before event
- Recommended: 30-60 minutes
- Range: 5-1440 minutes

## Creating Events with Voice Channels

### Via Discord

```
/event create
  title: Mythic Raid
  start-time: 2025-11-28 19:00
  create-voice-channel: true
  voice-channel-name: Mythic Raid Team
  voice-restricted: true
  voice-create-before: 45
```

**Options:**
- `create-voice-channel` - Enable voice channel (default: false)
- `voice-channel-name` - Custom name (default: event title)
- `voice-restricted` - Participants only (default: false)
- `voice-create-before` - Override guild default (optional)

### Via Web Dashboard

Event Creation Form:
1. Fill event details
2. Check "Create temporary voice channel"
3. Configure:
   - Voice Channel Name (optional)
   - Restrict to participants only (checkbox)
   - Create Before Event (minutes, optional)

## Voice Channel Lifecycle

### 1. Scheduled Creation

**When:** X minutes before event start (configured time)

**What happens:**
1. Bot creates voice channel in configured category
2. Channel named from event (or custom name)
3. If restricted: Sets permissions for participants only
4. Event message updated with voice channel link

### 2. Active Event

**During event:**
- Channel visible in event embed
- Participants can join
- Managers can always join (even if restricted)
- Non-participants see but cannot join (if restricted)

**Event Message Shows:**
```
🎤 Voice Channel: #Mythic-Raid-Team
```

### 3. Automatic Deletion

**When:** Y minutes after event ends (configured duration)

**What happens:**
1. Bot checks if event ended
2. Waits configured duration
3. Deletes voice channel
4. Event message updated (voice link removed)

### 4. Manual Extension

If event runs longer than expected:

```
/event extend-voice
  event-id: <select from dropdown>
  minutes: 60
```

Adds specified minutes to deletion time. Can be used multiple times.

## Permission Modes

### Unrestricted (Default)

**Who can join:** Everyone in server

**Use cases:**
- Public events
- Casual groups
- Open raids

**Permissions:**
```
@everyone
  ✅ View Channel
  ✅ Connect
  ✅ Speak
```

### Restricted (Participants Only)

**Who can join:**
- Confirmed participants
- Manager role members
- Server administrators

**Use cases:**
- Competitive raids
- Private events
- Team practice

**Permissions:**
```
@everyone
  ✅ View Channel
  ❌ Connect

@Participant (per user)
  ✅ View Channel
  ✅ Connect
  ✅ Speak

@Manager Role
  ✅ View Channel
  ✅ Connect
  ✅ Speak
  ✅ Mute Members
  ✅ Deafen Members
```

## Advanced Configuration

### Per-Event Override

Each event can override guild defaults:

**Example 1: Quick Event**
```
Event at 19:00
Voice Create Before: 15 minutes
→ Channel created at 18:45
```

**Example 2: All-Day Event**
```
Event at 10:00, runs 8 hours
Voice Duration: 480 minutes (8 hours)
→ Channel deleted 8 hours after event ends
```

### Multiple Events

Bot handles multiple simultaneous events:
- Each event gets unique voice channel
- Channels named after events (avoid conflicts)
- Independent lifecycles
- No limit on concurrent channels

### Category Organization

**Option 1: Single Category**
```
📁 Event Voice Channels
  🔊 Mythic Raid Team
  🔊 PvP Practice
  🔊 Dungeon Group
```

**Option 2: Multiple Categories** (advanced)
Configure different categories per event type using templates.

## Monitoring

### Check Active Channels

**Via Discord:**
Look in configured voice category

**Via Web Dashboard:**
Events page shows voice channel status:
- 🟢 Channel active
- 🟡 Scheduled to create
- 🔴 Deleted

**Via Database:**
```sql
SELECT title, voiceChannelId, voiceChannelDeleteAt
FROM "Event"
WHERE voiceChannelId IS NOT NULL;
```

### Bot Logs

Check scheduler activity:
```bash
docker logs raidbot-bot | grep -i voice
```

Shows:
- Channel creation
- Permission updates
- Channel deletion
- Extension requests

## Troubleshooting

### Voice Channel Not Created

**Check:**
1. Voice category configured? `/config`
2. Bot has Manage Channels permission in category
3. Event has `create-voice-channel: true`
4. Current time is within "create before" window

**Debug:**
```bash
docker logs raidbot-bot --tail 100 | grep -i voice
```

### Permissions Not Working

**Restricted mode not blocking users:**
1. Verify "Manage Permissions" enabled for bot in category
2. Check bot role is higher than @everyone in role hierarchy
3. Ensure no channel-specific overrides conflict

**Participants can't join:**
1. Check they're confirmed (not waitlist/bench)
2. Verify restricted mode is enabled
3. Check bot updated permissions (may take 30s)

### Channel Not Deleted

**Possible causes:**
1. Bot offline when deletion scheduled
2. Channel manually deleted (bot already cleaned up)
3. Event extended with `/event extend-voice`

**Check deletion time:**
Event message shows: "Voice channel will be deleted <t:timestamp:R>"

### Channel Creation Delayed

Scheduler runs every 5 minutes. Channel may be created up to 5 minutes late.

**Not an issue if:**
- Created before event start
- Participants notified in event message

## Best Practices

### Timing

**Create Before:**
- Short events (1-2h): 30 minutes
- Medium events (2-4h): 60 minutes
- Long events (4+h): 90 minutes

**Duration:**
- PvE content: 60-90 minutes
- PvP sessions: 120 minutes
- Raid progression: 180 minutes

### Naming

**Good names:**
- "Mythic+ Team Alpha"
- "Raid: Castle Nathria"
- "Arena Practice 3v3"

**Avoid:**
- Generic: "Voice Channel"
- Too long: "Super Awesome Mythic Plus Dungeon Run Team #5"
- Special characters: "Raid!!! @@@"

### Restrictions

**Use restricted for:**
- Competitive content
- Limited roster events
- Strategy discussion needed

**Use unrestricted for:**
- Social events
- Open world groups
- Community gatherings

### Extensions

Instead of setting very long duration, use shorter duration + extensions:

**Why:**
- Saves Discord API calls
- Auto-cleanup if event ends early
- Flexible for variable-length content

**Example:**
```
Duration: 60 minutes
If event runs long: /event extend-voice minutes: 60
```

## Integration with Events

### Signup Flow

1. User signs up for event
2. If restricted voice: Bot adds user to voice permissions
3. User can now join voice channel
4. If user leaves event: Voice permission removed

### Waitlist Promotion

When user moves from waitlist to confirmed:
1. Bot updates voice permissions
2. User can now join restricted channel
3. Notification sent (optional)

### Event Cancellation

If event cancelled:
1. Voice channel deleted immediately
2. Permissions cleaned up
3. Participants notified

## Statistics

Track voice channel usage:

**Via `/stats`:**
Shows voice channel participation rate

**Via Database:**
```sql
SELECT 
  COUNT(*) as total_events,
  COUNT(voiceChannelId) as events_with_voice,
  ROUND(COUNT(voiceChannelId)::numeric / COUNT(*) * 100, 2) as usage_percentage
FROM "Event"
WHERE startTime > NOW() - INTERVAL '30 days';
```

## API Integration

For developers integrating with bot:

**Check if event has voice:**
```javascript
const event = await prisma.event.findUnique({
  where: { id: eventId },
  select: { voiceChannelId: true }
});

if (event.voiceChannelId) {
  console.log('Voice channel active');
}
```

**Extend voice channel:**
```javascript
const newDeleteAt = DateTime.now().plus({ minutes: 60 });
await prisma.event.update({
  where: { id: eventId },
  data: { voiceChannelDeleteAt: newDeleteAt.toJSDate() }
});
```

## Next Steps

- [User Guide](USER_GUIDE.md) - Using voice channels as participant
- [Configuration](CONFIGURATION.md) - Voice settings reference
- [Templates](TEMPLATES.md) - Create templates with voice defaults
