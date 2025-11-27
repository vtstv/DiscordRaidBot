// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/types.ts

import { Group, Participant } from '../../types/composition';

export interface Event {
  id: string;
  title: string;
  participants: Participant[];
}

export interface RaidPlanData {
  id: string;
  eventId: string;
  guildId: string;
  title: string;
  groups: Group[];
}

export interface DragData {
  type: 'participant' | 'group' | 'position';
  participant?: Participant;
  groupId?: string;
  positionId?: string;
}
