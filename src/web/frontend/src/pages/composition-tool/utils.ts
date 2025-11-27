// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/utils.ts

import { Group } from '../../types/composition';
import type { Event } from './types';

/**
 * Create default groups for a new raid plan
 */
export function createDefaultGroups(): Group[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `group-${Date.now()}-${i}`,
    name: `Group ${i + 1}`,
    positions: Array.from({ length: 5 }, (_, j) => ({
      id: `pos-${Date.now()}-${i}-${j}`,
    })),
  }));
}

/**
 * Get unassigned participants
 */
export function getUnassignedParticipants(event: Event | null, groups: Group[]) {
  if (!event) return [];

  const assignedParticipantIds = new Set(
    groups.flatMap(g => g.positions.map(p => p.participantId).filter(Boolean))
  );

  return event.participants.filter(p => !assignedParticipantIds.has(p.id));
}

/**
 * Filter participants by search term
 */
export function filterParticipants(participants: any[], searchTerm: string) {
  if (!searchTerm) return participants;

  return participants.filter(p =>
    p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

/**
 * Generate new IDs for preset groups
 */
export function regeneratePresetGroups(presetGroups: any[]): Group[] {
  return presetGroups.map((g: any) => ({
    ...g,
    id: `group-${Date.now()}-${Math.random()}`,
    positions: g.positions.map((p: any) => ({
      ...p,
      id: `pos-${Date.now()}-${Math.random()}`,
      participantId: undefined,
    })),
  }));
}
