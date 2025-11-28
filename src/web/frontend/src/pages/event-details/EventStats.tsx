// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/event-details/EventStats.tsx

import { useI18n } from '../../contexts/I18nContext';
import type { Event } from '../../services/api';

interface EventStatsProps {
  event: Event;
}

export default function EventStats({ event }: EventStatsProps) {
  const { t } = useI18n();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.eventDetails.statistics}</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-gray-600 dark:text-gray-400">{t.eventDetails.participants}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {event._count?.participants || 0}
            {event.maxParticipants && (
              <span className="text-lg text-gray-500 dark:text-gray-500">/{event.maxParticipants}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
