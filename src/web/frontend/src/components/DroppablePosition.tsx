// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/DroppablePosition.tsx

import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import { Position, Participant } from '../types/composition';

interface DroppablePositionProps {
  position: Position;
  groupId: string;
  participant?: Participant;
  positionIndex: number;
  onEditLabel: (positionId: string, label: string) => void;
  onRemoveParticipant: (positionId: string) => void;
}

export default function DroppablePosition({
  position,
  groupId,
  participant,
  positionIndex,
  onEditLabel,
  onRemoveParticipant,
}: DroppablePositionProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(position.label || '');

  const { isOver, setNodeRef } = useDroppable({
    id: `position-${groupId}-${position.id}`,
    data: {
      type: 'position',
      groupId,
      positionId: position.id,
    },
  });

  const handleSaveLabel = () => {
    onEditLabel(position.id, labelValue);
    setIsEditingLabel(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`p-3 rounded-xl border-2 transition-all ${
        isOver
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[20px]">
          {positionIndex + 1}.
        </span>

        {participant ? (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {participant.username}
              </p>
              {participant.role && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{participant.role}</p>
              )}
            </div>
            <button
              onClick={() => onRemoveParticipant(position.id)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Remove participant"
            >
              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex-1">
            {isEditingLabel ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  onBlur={handleSaveLabel}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveLabel()}
                  className="flex-1 px-2 py-1 text-sm border border-purple-300 dark:border-purple-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Position label..."
                  autoFocus
                />
              </div>
            ) : (
              <p
                onClick={() => setIsEditingLabel(true)}
                className="text-sm text-gray-400 dark:text-gray-500 italic cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                title="Click to edit label"
              >
                {position.label || 'Empty slot (click to label)'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
