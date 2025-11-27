// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/groupActions.ts

import { Group } from '../../types/composition';

/**
 * Rename a group
 */
export function renameGroup(groups: Group[], groupId: string, name: string): Group[] {
  return groups.map(g => g.id === groupId ? { ...g, name } : g);
}

/**
 * Delete a group
 */
export function deleteGroup(groups: Group[], groupId: string): Group[] {
  return groups.filter(g => g.id !== groupId);
}

/**
 * Add a new group
 */
export function addGroup(groups: Group[]): Group[] {
  const newGroup: Group = {
    id: `group-${Date.now()}`,
    name: `Group ${groups.length + 1}`,
    positions: [{ id: `pos-${Date.now()}` }],
  };
  return [...groups, newGroup];
}

/**
 * Add a position to a group
 */
export function addPosition(groups: Group[], groupId: string): Group[] {
  return groups.map(g =>
    g.id === groupId
      ? { ...g, positions: [...g.positions, { id: `pos-${Date.now()}` }] }
      : g
  );
}

/**
 * Remove a position from a group
 */
export function removePosition(groups: Group[], groupId: string, positionId: string): Group[] {
  return groups.map(g =>
    g.id === groupId
      ? { ...g, positions: g.positions.filter(p => p.id !== positionId) }
      : g
  );
}

/**
 * Edit position label
 */
export function editPositionLabel(
  groups: Group[],
  groupId: string,
  positionId: string,
  label: string
): Group[] {
  return groups.map(g =>
    g.id === groupId
      ? {
          ...g,
          positions: g.positions.map(p =>
            p.id === positionId ? { ...p, label } : p
          ),
        }
      : g
  );
}

/**
 * Remove participant from position
 */
export function removeParticipant(groups: Group[], groupId: string, positionId: string): Group[] {
  return groups.map(g =>
    g.id === groupId
      ? {
          ...g,
          positions: g.positions.map(p =>
            p.id === positionId ? { ...p, participantId: undefined } : p
          ),
        }
      : g
  );
}
