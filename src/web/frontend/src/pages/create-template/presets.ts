// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/create-template/presets.ts

import type { TemplateFormData } from './types';

export const TEMPLATE_PRESETS: Array<{ name: string; data: TemplateFormData }> = [
  {
    name: 'Raid (25)',
    data: {
      name: 'Raid',
      description: 'Standard 25-player raid group',
      maxParticipants: 25,
      allowedRoles: 'Tank, Healer, DPS',
      roleLimits: 'Tank:2, Healer:5, DPS:18',
      emojiMapping: 'Tank:🛡️, Healer:❤️, DPS:⚔️',
      imageUrl: '',
    },
  },
  {
    name: 'Mythic+ (5)',
    data: {
      name: 'Mythic+',
      description: '5-player dungeon run',
      maxParticipants: 5,
      allowedRoles: 'Tank, Healer, DPS',
      roleLimits: 'Tank:1, Healer:1, DPS:3',
      emojiMapping: 'Tank:🛡️, Healer:❤️, DPS:⚔️',
      imageUrl: '',
    },
  },
  {
    name: 'Arena (3v3)',
    data: {
      name: 'Arena 3v3',
      description: '3v3 Arena team',
      maxParticipants: 3,
      allowedRoles: 'DPS, Healer',
      roleLimits: 'DPS:2, Healer:1',
      emojiMapping: 'DPS:⚔️, Healer:❤️',
      imageUrl: '',
    },
  },
  {
    name: 'Custom',
    data: {
      name: '',
      description: '',
      maxParticipants: 0,
      allowedRoles: '',
      roleLimits: '',
      emojiMapping: '',
      imageUrl: '',
    },
  },
];
