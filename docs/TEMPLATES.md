# Templates Guide

Complete guide to creating and managing event templates.

## Overview

Templates are reusable event configurations that save time when creating recurring events. They define roles, participant limits, and default settings.

**Use Cases:**
- Raid templates (Tank: 2, Healer: 4, DPS: 14)
- Mythic+ dungeons (Tank: 1, Healer: 1, DPS: 3)
- PvP teams (Healer: 2, DPS: 3)
- Custom event types

---

## Creating Templates

### Via Discord

```
/template create
  name: Mythic Raid 20-man
  description: Standard mythic raid composition
```

Bot will prompt you to configure:
1. **Roles** - Add roles with limits
2. **Emoji** - Custom emoji for each role
3. **Settings** - Max participants, approval required

### Via Web Dashboard

1. Navigate to Templates page
2. Click "Create Template"
3. Fill form:
   - Name and description
   - Add roles with limits
   - Select emoji
   - Configure options

---

## Template Configuration

### Basic Settings

**Name** (required)
- Short descriptive name
- Examples: "Mythic Raid", "M+ Team", "Arena 3v3"
- Max 100 characters

**Description** (optional)
- Explain template purpose
- Example: "Standard 20-man mythic raid composition with flex spots"
- Max 500 characters

**Max Participants**
- Total participant limit (0 = unlimited)
- Should match sum of role limits (or higher for flex)
- Example: 20 for raids, 5 for dungeons

### Roles Configuration

Templates can have multiple roles with individual limits.

**Role Properties:**
- **Name** - Role identifier (Tank, Healer, DPS, Support)
- **Emoji** - Visual icon (⚔️, 💚, 🔥, 🛡️)
- **Limit** - Max participants in this role
- **Required** - Minimum participants needed

**Example: Mythic Raid Template**
```yaml
Roles:
  - Name: Tank
    Emoji: 🛡️
    Limit: 2
    Required: 2
  
  - Name: Healer
    Emoji: 💚
    Limit: 4
    Required: 3
  
  - Name: DPS
    Emoji: ⚔️
    Limit: 14
    Required: 10
```

**Example: Mythic+ Template**
```yaml
Roles:
  - Name: Tank
    Emoji: 🛡️
    Limit: 1
    Required: 1
  
  - Name: Healer
    Emoji: 💚
    Limit: 1
    Required: 1
  
  - Name: DPS
    Emoji: 🔥
    Limit: 3
    Required: 3
```

### Advanced Options

**Approval Required**
- Events from this template require manager approval for signups
- Useful for competitive content

**Bench Enabled**
- Allow participants without allowed role to join bench
- They can be promoted when slots open

**Deadline Offset**
- Close signups X hours before event
- Example: -2 (closes 2 hours before)

**Auto-archive**
- Automatically archive events after completion

---

## Using Templates

### During Event Creation

**Via Discord:**
```
/event create
  title: Castle Nathria Heroic
  start-time: 2025-11-28 19:00
  channel: #raids
  template: Mythic Raid 20-man
```

Template automatically applies:
- Role structure
- Participant limits
- Signup settings

**Via Web:**
1. Create Event page
2. Select template from dropdown
3. Template populates role limits
4. Customize if needed

### Template Override

You can override template settings per event:
- Change role limits
- Adjust max participants
- Modify approval requirement

Template is a starting point, not a restriction.

---

## Managing Templates

### Listing Templates

**Via Discord:**
```
/template list
```

Shows all templates with:
- Name and description
- Number of roles
- Total participant limit
- Usage count

**Via Web:**
Templates page shows cards with:
- Template details
- Role breakdown
- Quick edit/delete buttons

### Editing Templates

**Via Discord:**
```
/template edit
  template: Mythic Raid 20-man
```

Opens interactive editor to:
- Rename template
- Modify description
- Add/remove/edit roles
- Change settings

**Via Web:**
1. Templates page
2. Click template card
3. Edit fields
4. Save changes

**Note:** Editing template doesn't affect existing events created from it.

### Deleting Templates

**Via Discord:**
```
/template delete
  template: Mythic Raid 20-man
```

**Via Web:**
Templates page → Delete button

**Confirmation required** - deletion is permanent.

**Impact:** Existing events using this template are unaffected.

---

## Template Best Practices

### Naming Conventions

**Good Names:**
- "Mythic Raid 20" - Clear and specific
- "M+ Weekly" - Common shorthand
- "RBG 10v10" - Standard format

**Avoid:**
- "Template 1" - Not descriptive
- "SuperAwesomeRaidTemplate!!!" - Too casual
- "asdf" - Meaningless

### Role Structure

**Be Realistic:**
- Match actual game/content requirements
- Don't create "Tank: 20" for a 5-man dungeon

**Allow Flexibility:**
- Set max higher than required for flex spots
- Example: Required: 3 healers, Limit: 4 healers

**Use Clear Names:**
- Tank, Healer, DPS - universally understood
- Melee, Ranged - if needed
- Avoid obscure abbreviations

### Emoji Selection

**Discord Default Emoji:**
- ⚔️ DPS
- 🛡️ Tank
- 💚 Healer
- 🏹 Ranged
- 🗡️ Melee
- 🎯 Support

**Custom Emoji:**
- Use server custom emoji for class icons
- Ensure emoji exists in your server
- Fallback to default if custom unavailable

### Participant Limits

**Match Content:**
- 5-man dungeons: 5 participants
- 10-man raids: 10 participants
- 20-man raids: 20 participants
- Open world: 0 (unlimited)

**Consider Reserves:**
- Add 1-2 extra spots for backups
- Example: 20-man raid → 22 max participants

---

## Template Examples

### World of Warcraft

**Mythic Raid 20**
```yaml
Name: Mythic Raid 20
Description: Standard mythic raid composition
Max Participants: 22
Roles:
  Tank: 2 (⚔️)
  Healer: 4 (💚)
  Melee DPS: 6 (🗡️)
  Ranged DPS: 8 (🏹)
```

**Mythic+ Dungeon**
```yaml
Name: Mythic+ Key
Description: 5-man dungeon group
Max Participants: 5
Roles:
  Tank: 1 (🛡️)
  Healer: 1 (💚)
  DPS: 3 (⚔️)
```

**Normal Raid Flex**
```yaml
Name: Normal Raid
Description: Flexible normal difficulty
Max Participants: 30
Roles:
  Tank: 2-3 (🛡️)
  Healer: 5-7 (💚)
  DPS: 18-23 (⚔️)
```

### PvP Content

**Rated Battleground**
```yaml
Name: RBG 10v10
Description: Rated battleground team
Max Participants: 12
Roles:
  Healer: 2-3 (💚)
  DPS: 7-8 (⚔️)
  Flag Carrier: 1 (🏴)
```

**Arena 3v3**
```yaml
Name: Arena 3v3
Description: Arena team composition
Max Participants: 4
Roles:
  Healer: 1 (💚)
  DPS: 2 (⚔️)
```

### Other Games

**FFXIV Savage Raid**
```yaml
Name: Savage 8-man
Description: Savage raid static
Max Participants: 8
Roles:
  Tank: 2 (🛡️)
  Healer: 2 (💚)
  Melee: 2 (🗡️)
  Ranged: 2 (🏹)
```

**Destiny 2 Raid**
```yaml
Name: Raid Team
Description: 6-player raid
Max Participants: 6
Roles:
  All: 6 (⚔️)
```

---

## Troubleshooting

### Template Not Appearing

**Check:**
- Template saved successfully? (confirmation message)
- You're in the correct server?
- Template not deleted?

**Fix:**
```
/template list
```
Verify template exists.

### Can't Edit Template

**Possible causes:**
- Not a manager (need manager role)
- Template deleted
- Bot permissions issue

**Fix:**
Check `/config` for manager role setting.

### Roles Not Working

**Issue:** Participants can't select roles

**Causes:**
- Template has no roles defined
- Event not using template
- Discord API lag

**Fix:**
1. Edit template, add roles
2. Re-create event with template
3. Wait 30 seconds and try again

### Emoji Not Showing

**Issue:** Default squares instead of emoji

**Causes:**
- Custom emoji from different server
- Emoji deleted
- Invalid emoji format

**Fix:**
1. Edit template
2. Use Discord default emoji
3. Or upload emoji to your server first

---

## API Integration

For developers:

### Create Template
```typescript
const template = await prisma.template.create({
  data: {
    guildId: '123456789',
    name: 'Mythic Raid',
    description: 'Standard composition',
    maxParticipants: 20,
    roles: [
      { name: 'Tank', emoji: '🛡️', limit: 2 },
      { name: 'Healer', emoji: '💚', limit: 4 },
      { name: 'DPS', emoji: '⚔️', limit: 14 }
    ]
  }
});
```

### Apply Template to Event
```typescript
const template = await prisma.template.findUnique({
  where: { id: templateId }
});

const event = await prisma.event.create({
  data: {
    ...eventData,
    templateId: template.id,
    maxParticipants: template.maxParticipants,
    roles: template.roles
  }
});
```

---

## Next Steps

- [User Guide](USER_GUIDE.md) - Using templates in events
- [Configuration](CONFIGURATION.md) - Template-related settings
- [Voice Channels](VOICE_CHANNELS.md) - Combine with voice channels
