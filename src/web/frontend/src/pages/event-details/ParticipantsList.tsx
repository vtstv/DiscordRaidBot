// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/event-details/ParticipantsList.tsx

import type { Event } from '../../services/api';

interface ParticipantsListProps {
  event: Event;
}

export default function ParticipantsList({ event }: ParticipantsListProps) {
  if (!event.participants || event.participants.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Participants ({event.participants.length}{event.maxParticipants ? `/${event.maxParticipants}` : ''})
      </h2>
      <div className="space-y-2">
        {event.participants.map((participant: any) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              {participant.discordAvatar && (
                <img
                  src={participant.discordAvatar}
                  alt={participant.discordDisplayName || participant.discordUsername || participant.userId}
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-600 shadow-sm"
                />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {participant.discordDisplayName || participant.discordUsername || participant.username || participant.userId}
                </p>
                {participant.role && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{participant.role}</p>
                )}
                {participant.note && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 italic">_{participant.note}_</p>
                )}
              </div>
            </div>
            {participant.status && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  participant.status === 'confirmed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : participant.status === 'waitlist'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {participant.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
