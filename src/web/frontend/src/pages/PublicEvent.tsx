// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/PublicEvent.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, Event } from '../services/api';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function PublicEvent() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raidPlanId, setRaidPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      // Use a public API endpoint that doesn't require authentication
      fetch(`/api/events/${eventId}/public`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Event not found or not public');
          }
          return response.json();
        })
        .then(data => {
          setEvent(data);
          // Check if raid plan exists
          fetch(`/api/raidplans/event/${eventId}/public`)
            .then(res => res.ok ? res.json() : null)
            .then(plan => plan && setRaidPlanId(plan.id))
            .catch(() => {}); // Silently ignore if no raid plan
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This event may not exist or is not publicly accessible'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{event.title}</h1>
          <div className="flex items-center justify-center gap-4 text-lg text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(event.startTime).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[event.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
              {event.status}
            </span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors duration-200">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Description</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Raid Plan Link */}
        {raidPlanId && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-sm border border-purple-200 dark:border-purple-700 p-6 mb-6 transition-colors duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Raid Composition</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View the planned raid composition for this event</p>
              </div>
              <a
                href={`/raidplan/${raidPlanId}`}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                View Raid Plan
              </a>
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Participants ({event._count?.participants || 0}{event.maxParticipants ? `/${event.maxParticipants}` : ''})
          </h2>

          {event.participants && event.participants.length > 0 ? (
            <div className="space-y-3">
              {event.participants.map((participant: any, index: number) => (
                <div key={participant.id} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[20px]">
                    {index + 1}.
                  </span>
                  <div className="flex items-start gap-3 flex-1">
                    {participant.discordAvatar && (
                      <img
                        src={participant.discordAvatar}
                        alt={participant.discordDisplayName || participant.discordUsername || participant.username || participant.userId}
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-600 shadow-sm flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {participant.discordDisplayName || participant.discordUsername || participant.username || participant.userId}
                      </p>
                      {participant.role && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{participant.role}</p>
                      )}
                      {participant.note && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 italic mt-1">_{participant.note}_</p>
                      )}
                    </div>
                    {participant.status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        participant.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        participant.status === 'waitlist' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {participant.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">No participants yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Event ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{event.id}</code>
          </p>
          {event.createdByUser && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Created by {event.createdByUser.displayName}</p>
          )}
          <div className="mt-4 text-xs text-gray-400 dark:text-gray-600">
            <p>© 2025 <a href="https://github.com/vtstv" target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Murr</a> • RaidBot v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}