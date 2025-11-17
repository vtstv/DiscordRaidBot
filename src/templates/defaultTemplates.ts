// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/templates/defaultTemplates.ts
// Default template configurations for common use cases

export const DEFAULT_TEMPLATES = {
  wowRaid: {
    name: 'WoW Raid (20-player)',
    description: 'World of Warcraft raid template with 2 tanks, 5 healers, and 13 DPS',
    config: {
      roles: ['Tank', 'Healer', 'DPS'],
      limits: {
        Tank: 2,
        Healer: 5,
        DPS: 13,
      },
      emojiMap: {
        Tank: '🛡️',
        Healer: '💚',
        DPS: '⚔️',
      },
      specs: {
        Tank: [
          'Protection Warrior',
          'Protection Paladin',
          'Blood Death Knight',
          'Brewmaster Monk',
          'Guardian Druid',
          'Vengeance Demon Hunter',
        ],
        Healer: [
          'Holy Priest',
          'Discipline Priest',
          'Restoration Druid',
          'Holy Paladin',
          'Restoration Shaman',
          'Mistweaver Monk',
        ],
        DPS: [
          'Fury Warrior',
          'Arms Warrior',
          'Fire Mage',
          'Frost Mage',
          'Arcane Mage',
          'Shadow Priest',
          'Balance Druid',
          'Feral Druid',
          'Retribution Paladin',
          'Enhancement Shaman',
          'Elemental Shaman',
          'Windwalker Monk',
          'Havoc Demon Hunter',
          'Frost Death Knight',
          'Unholy Death Knight',
        ],
      },
    },
  },

  wowMythicPlus: {
    name: 'WoW Mythic+ (5-player)',
    description: 'World of Warcraft Mythic+ dungeon template',
    config: {
      roles: ['Tank', 'Healer', 'DPS'],
      limits: {
        Tank: 1,
        Healer: 1,
        DPS: 3,
      },
      emojiMap: {
        Tank: '🛡️',
        Healer: '💚',
        DPS: '⚔️',
      },
    },
  },

  ffxivRaid: {
    name: 'FFXIV Raid (8-player)',
    description: 'Final Fantasy XIV raid template with 2 tanks, 2 healers, and 4 DPS',
    config: {
      roles: ['Tank', 'Healer', 'DPS'],
      limits: {
        Tank: 2,
        Healer: 2,
        DPS: 4,
      },
      emojiMap: {
        Tank: '🛡️',
        Healer: '💚',
        DPS: '⚔️',
      },
    },
  },

  pvp: {
    name: 'PvP Event (10-player)',
    description: 'Generic PvP event template',
    config: {
      roles: ['Player'],
      limits: {
        Player: 10,
      },
      emojiMap: {
        Player: '⚔️',
      },
    },
  },

  generic: {
    name: 'Generic Event',
    description: 'Generic event with unlimited participants',
    config: {
      roles: ['Participant'],
      limits: {
        Participant: 50,
      },
      emojiMap: {
        Participant: '✅',
      },
    },
  },
};
