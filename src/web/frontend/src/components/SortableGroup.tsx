// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/SortableGroup.tsx

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Group, Participant } from '../types/composition';
import DroppablePosition from './DroppablePosition';

interface SortableGroupProps {
  group: Group;
  participants: Participant[];
  onRenameGroup: (groupId: string, name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddPosition: (groupId: string) => void;
  onRemovePosition: (groupId: string, positionId: string) => void;
  onEditPositionLabel: (groupId: string, positionId: string, label: string) => void;
  onRemoveParticipant: (groupId: string, positionId: string) => void;
}

export default function SortableGroup({
  group,
  participants,
  onRenameGroup,
  onDeleteGroup,
  onAddPosition,
  onRemovePosition,
  onEditPositionLabel,
  onRemoveParticipant,
}: SortableGroupProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(group.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `group-${group.id}`,
    data: {
      type: 'group',
      group,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveName = () => {
    onRenameGroup(group.id, nameValue);
    setIsEditingName(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Group Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>

          {isEditingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleSaveName}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
              className="flex-1 px-3 py-1 text-xl font-bold border border-purple-300 dark:border-purple-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          ) : (
            <h2
              onClick={() => setIsEditingName(true)}
              className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              title="Click to rename"
            >
              {group.name}
            </h2>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onAddPosition(group.id)}
            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
            title="Add position"
          >
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => onDeleteGroup(group.id)}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Delete group"
          >
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Positions */}
      <div className="space-y-2">
        {group.positions.map((position, index) => {
          const participant = participants.find(p => p.id === position.participantId);
          return (
            <div key={position.id} className="flex items-center gap-2">
              <DroppablePosition
                position={position}
                groupId={group.id}
                participant={participant}
                positionIndex={index}
                onEditLabel={(posId, label) => onEditPositionLabel(group.id, posId, label)}
                onRemoveParticipant={(posId) => onRemoveParticipant(group.id, posId)}
              />
              {group.positions.length > 1 && (
                <button
                  onClick={() => onRemovePosition(group.id, position.id)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
                  title="Remove position"
                >
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}

        {group.positions.length === 0 && (
          <div className="p-4 text-center text-gray-400 dark:text-gray-600 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
            No positions (click + to add)
          </div>
        )}
      </div>
    </div>
  );
}
