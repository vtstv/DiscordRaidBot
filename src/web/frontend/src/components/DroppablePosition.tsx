// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/DroppablePosition.tsx

import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useState } from 'react';
import { Position, Participant } from '../types/composition';
import { useClickMode } from '../contexts/ClickModeContext';

interface DroppablePositionProps {
  position: Position;
  groupId: string;
  participant?: Participant;
  positionIndex: number;
  onEditLabel: (positionId: string, label: string) => void;
  onRemoveParticipant: (positionId: string) => void;
  onAssignParticipant?: (participant: Participant, sourceGroupId?: string, sourcePositionId?: string) => void;
}

export default function DroppablePosition({
  position,
  groupId,
  participant,
  positionIndex,
  onEditLabel,
  onRemoveParticipant,
  onAssignParticipant,
}: DroppablePositionProps) {
  const { isClickMode, selectedParticipant, selectParticipant, clearSelection, assignToPosition } = useClickMode();
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

  // Make assigned participant draggable
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    transform: dragTransform,
    isDragging,
  } = useDraggable({
    id: participant ? `participant-${participant.id}` : `empty-${position.id}`,
    data: participant ? {
      type: 'participant',
      participant,
      sourceGroupId: groupId,
      sourcePositionId: position.id,
    } : undefined,
    disabled: !participant || isClickMode,
  });

  const isSelectedTarget = isClickMode && selectedParticipant !== null;
  const isOccupiedBySelected = participant && selectedParticipant?.participant.id === participant.id;

  const handlePositionClick = () => {
    if (!isClickMode) return;
    
    if (selectedParticipant && !isOccupiedBySelected && onAssignParticipant) {
      // Assign selected participant to this position
      assignToPosition(groupId, position.id, onAssignParticipant);
    }
  };

  const handleParticipantClick = (e: React.MouseEvent) => {
    if (!isClickMode || !participant) return;
    
    e.stopPropagation();
    
    if (isOccupiedBySelected) {
      clearSelection();
    } else {
      selectParticipant(participant, groupId, position.id);
    }
  };

  const dragStyle = dragTransform
    ? {
        transform: `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const handleSaveLabel = () => {
    onEditLabel(position.id, labelValue);
    setIsEditingLabel(false);
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handlePositionClick}
      className={`px-2 py-1.5 rounded-lg border transition-all ${
        isOver || (isSelectedTarget && !participant)
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
      } ${isClickMode && !participant && isSelectedTarget ? 'ring-2 ring-purple-500 cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[16px]">
          {positionIndex + 1}.
        </span>

        {participant ? (
          <div 
            ref={setDragRef}
            style={dragStyle}
            {...(isClickMode ? {} : dragListeners)}
            {...(isClickMode ? {} : dragAttributes)}
            onClick={handleParticipantClick}
            className={`flex-1 flex items-center justify-between min-w-0 ${
              isClickMode ? 'cursor-pointer active:scale-95' : 'cursor-grab active:cursor-grabbing'
            } ${isOccupiedBySelected ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30 rounded' : ''}`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isClickMode ? (
                <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                  isOccupiedBySelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300 dark:border-gray-500'
                }`}>
                  {isOccupiedBySelected && (
                    <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ) : (
                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-xs truncate">
                  {participant.username}
                </p>
                {participant.role && (
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{participant.role}</p>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveParticipant(position.id);
              }}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0 ml-1"
              title="Remove participant"
            >
              <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            {isEditingLabel ? (
              <input
                type="text"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                onBlur={handleSaveLabel}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveLabel()}
                className="w-full px-2 py-0.5 text-xs border border-purple-300 dark:border-purple-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Position label..."
                autoFocus
              />
            ) : (
              <p
                onClick={() => setIsEditingLabel(true)}
                className="text-xs text-gray-400 dark:text-gray-500 italic cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 truncate"
                title="Click to edit label"
              >
                {position.label || 'Empty slot'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
