// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/event-details/CreatorInfo.tsx

import type { Event } from '../../services/api';

interface CreatorInfoProps {
  event: Event;
}

export default function CreatorInfo({ event }: CreatorInfoProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Created By</h2>
      {event.createdByUser ? (
        <div className="flex items-center gap-3">
          <img
            src={event.createdByUser.avatar}
            alt={event.createdByUser.displayName}
            className="w-12 h-12 rounded-full border-2 border-purple-200 dark:border-purple-900 shadow-sm"
          />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{event.createdByUser.displayName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">@{event.createdByUser.username}</p>
          </div>
        </div>
      ) : (
        <p className="font-mono text-sm text-gray-600 dark:text-gray-400">{event.createdBy}</p>
      )}
    </div>
  );
}
