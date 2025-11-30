// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/GroupsPanel.tsx

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableGroup from '../../components/SortableGroup';
import { Group, Participant } from '../../types/composition';
import { useI18n } from '../../contexts/I18nContext';

interface GroupsPanelProps {
  groups: Group[];
  participants: Participant[];
  onRenameGroup: (groupId: string, name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddPosition: (groupId: string) => void;
  onRemovePosition: (groupId: string, positionId: string) => void;
  onEditPositionLabel: (groupId: string, positionId: string, label: string) => void;
  onRemoveParticipant: (groupId: string, positionId: string) => void;
  onAddGroup: () => void;
  onAssignParticipant?: (groupId: string, positionId: string, participant: Participant, sourceGroupId?: string, sourcePositionId?: string) => void;
}

export default function GroupsPanel({
  groups,
  participants,
  onRenameGroup,
  onDeleteGroup,
  onAddPosition,
  onRemovePosition,
  onEditPositionLabel,
  onRemoveParticipant,
  onAddGroup,
  onAssignParticipant,
}: GroupsPanelProps) {
  const { t } = useI18n();

  return (
    <>
      <SortableContext
        items={groups.map(g => `group-${g.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {groups.map(group => (
            <SortableGroup
              key={group.id}
              group={group}
              participants={participants}
              onRenameGroup={onRenameGroup}
              onDeleteGroup={onDeleteGroup}
              onAddPosition={onAddPosition}
              onRemovePosition={onRemovePosition}
              onEditPositionLabel={onEditPositionLabel}
              onRemoveParticipant={onRemoveParticipant}
              onAssignParticipant={onAssignParticipant}
            />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={onAddGroup}
        className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-medium"
      >
        {t.compositionTool.addGroup}
      </button>
    </>
  );
}
