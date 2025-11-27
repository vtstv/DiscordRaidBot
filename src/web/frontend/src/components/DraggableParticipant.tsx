// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/DraggableParticipant.tsx

import { useDraggable } from '@dnd-kit/core';
import { Participant } from '../types/composition';

interface DraggableParticipantProps {
  participant: Participant;
}

export default function DraggableParticipant({ participant }: DraggableParticipantProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `participant-${participant.id}`,
    data: {
      type: 'participant',
      participant,
    },
  });

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
      {...listeners}
      {...attributes}
      className={`p-3 bg-white dark:bg-gray-700 border-2 ${
        isDragging
          ? 'border-purple-500 shadow-lg'
          : 'border-gray-200 dark:border-gray-600'
      } rounded-xl cursor-grab active:cursor-grabbing hover:border-purple-400 transition-all`}
    >
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white text-sm">{participant.username}</p>
          {participant.role && (
            <p className="text-xs text-gray-600 dark:text-gray-400">{participant.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}
