// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/dragHandlers.ts

import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Group, Participant } from '../../types/composition';

/**
 * Handle drag end event for participants and groups
 */
export function handleDragEnd(
  event: DragEndEvent,
  groups: Group[],
  onUpdate: (newGroups: Group[]) => void
): void {
  const { active, over } = event;

  if (!over) return;

  const activeData = active.data.current;
  const overData = over.data.current;

  // Participant dragged to position
  if (activeData?.type === 'participant' && overData?.type === 'position') {
    const participant = activeData.participant as Participant;
    const targetGroupId = overData.groupId;
    const targetPositionId = overData.positionId;

    const updatedGroups = groups.map(group => {
      if (group.id === targetGroupId) {
        return {
          ...group,
          positions: group.positions.map(pos =>
            pos.id === targetPositionId
              ? { ...pos, participantId: participant.id }
              : pos
          ),
        };
      }
      return group;
    });

    onUpdate(updatedGroups);
    return;
  }

  // Group reordering
  if (activeData?.type === 'group' && overData?.type === 'group') {
    const oldIndex = groups.findIndex(g => `group-${g.id}` === active.id);
    const newIndex = groups.findIndex(g => `group-${g.id}` === over.id);

    if (oldIndex !== newIndex) {
      const reordered = arrayMove(groups, oldIndex, newIndex);
      onUpdate(reordered);
    }
  }
}
