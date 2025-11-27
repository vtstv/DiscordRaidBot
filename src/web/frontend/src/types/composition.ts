// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/types/composition.ts

export interface Participant {
  id: string;
  username: string;
  role?: string;
  spec?: string;
  userId: string;
}

export interface Position {
  id: string;
  participantId?: string;
  label?: string;
}

export interface Group {
  id: string;
  name: string;
  positions: Position[];
}

export interface RaidPlan {
  id: string;
  eventId: string;
  guildId: string;
  title: string;
  groups: Group[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DragItem {
  type: 'participant' | 'position';
  id: string;
  participantId?: string;
  sourceGroupId?: string;
  sourcePositionId?: string;
}
