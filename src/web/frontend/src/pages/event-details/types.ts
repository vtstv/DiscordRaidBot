// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/event-details/types.ts

export interface EditValues {
  title: string;
  description: string;
  maxParticipants: number;
  startTime: string;
}

export type EditableFieldName = keyof EditValues;

export interface StatusConfig {
  bg: string;
  text: string;
  icon: string;
}

export type EventStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
