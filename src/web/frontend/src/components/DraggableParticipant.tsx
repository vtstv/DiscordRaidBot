// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/DraggableParticipant.tsx

import { useDraggable } from '@dnd-kit/core';
import { Participant } from '../types/composition';
import { useClickMode } from '../contexts/ClickModeContext';

interface DraggableParticipantProps {
  participant: Participant;
}

export default function DraggableParticipant({ participant }: DraggableParticipantProps) {
  const { isClickMode, selectedParticipant, selectParticipant, clearSelection } = useClickMode();
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `participant-${participant.id}`,
    data: {
      type: 'participant',
      participant,
    },
  });

  const isSelected = selectedParticipant?.participant.id === participant.id;

  const handleClick = () => {
    if (!isClickMode) return;
    
    if (isSelected) {
      clearSelection();
    } else {
      selectParticipant(participant);
    }
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isClickMode ? {} : listeners)}
      {...(isClickMode ? {} : attributes)}
      onClick={handleClick}
      className={`px-3 py-2 bg-white dark:bg-gray-700 border ${
        isSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg ring-2 ring-purple-500'
          : isDragging
          ? 'border-purple-500 shadow-lg'
          : 'border-gray-200 dark:border-gray-600'
      } rounded-lg ${
        isClickMode ? 'cursor-pointer active:scale-95' : 'cursor-grab active:cursor-grabbing'
      } hover:border-purple-400 transition-all`}
    >
      <div className="flex items-center gap-2">
        {isClickMode && (
          <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
            isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300 dark:border-gray-500'
          }`}>
            {isSelected && (
              <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
        {!isClickMode && (
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white text-xs truncate">{participant.username}</p>
          {participant.role && (
            <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{participant.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}
