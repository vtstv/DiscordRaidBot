// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/EventDetails.tsx
// Event details page

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Event } from '../services/api';
import Layout from '../components/Layout';

export default function EventDetails() {
  const { guildId, eventId } = useParams<{ guildId: string; eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guildId && eventId) {
      api.getEvent(guildId, eventId).then(setEvent).finally(() => setLoading(false));
    }
  }, [guildId, eventId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await api.deleteEvent(guildId!, eventId!);
      navigate(`/guild/${guildId}/events`);
    } catch (error) {
      alert('Failed to delete event');
    }
  };

  if (loading) return <Layout><div className="loading">Loading event...</div></Layout>;
  if (!event) return <Layout><div>Event not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/guild/${guildId}/events`)}
          className="mb-6 text-purple-300 hover:text-white transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </button>

        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'active' ? 'bg-green-500/30 text-green-200 border border-green-500/50' :
                event.status === 'scheduled' ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50' :
                event.status === 'completed' ? 'bg-gray-500/30 text-gray-200 border border-gray-500/50' :
                'bg-red-500/30 text-red-200 border border-red-500/50'
              }`}>
                {event.status}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/guild/${guildId}/events/${eventId}/edit`)}
                className="px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Description */}
            {event.description && (
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-purple-200 mb-2">Description</h2>
                <p className="text-gray-200">{event.description}</p>
              </div>
            )}

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-300 mb-1">Start Time</h3>
                <p className="text-white font-semibold">{new Date(event.startTime).toLocaleString()}</p>
              </div>

              {event.endTime && (
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-300 mb-1">End Time</h3>
                  <p className="text-white font-semibold">{new Date(event.endTime).toLocaleString()}</p>
                </div>
              )}

              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-300 mb-1">Participants</h3>
                <p className="text-white font-semibold">
                  {event._count?.participants || 0}
                  {event.maxParticipants && ` / ${event.maxParticipants}`}
                </p>
              </div>

              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-300 mb-1">Created By</h3>
                {event.createdByUser ? (
                  <div className="flex items-center gap-2">
                    <img 
                      src={event.createdByUser.avatar} 
                      alt={event.createdByUser.displayName}
                      className="w-8 h-8 rounded-full border-2 border-purple-500/50"
                    />
                    <div>
                      <p className="text-white font-semibold text-sm">{event.createdByUser.displayName}</p>
                      <p className="text-xs text-gray-400">@{event.createdByUser.username}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-white font-mono text-sm font-semibold">{event.createdBy}</p>
                )}
              </div>
            </div>

            {/* Participants List */}
            {event.participants && event.participants.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Participants</h2>
                <div className="space-y-2">
                  {event.participants.map((participant: any) => (
                    <div key={participant.id} className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3 flex items-center justify-between hover:bg-indigo-900/40 transition-colors">
                      <div className="flex items-center gap-3">
                        {participant.discordAvatar && (
                          <img 
                            src={participant.discordAvatar} 
                            alt={participant.discordDisplayName || participant.discordUsername || participant.userId}
                            className="w-10 h-10 rounded-full border-2 border-indigo-500/50"
                          />
                        )}
                        <div>
                          <p className="text-white font-medium">
                            {participant.discordDisplayName || participant.discordUsername || participant.username || participant.userId}
                          </p>
                          {participant.discordUsername && participant.discordUsername !== participant.discordDisplayName && (
                            <p className="text-xs text-gray-400">@{participant.discordUsername}</p>
                          )}
                          {participant.role && (
                            <p className="text-sm text-indigo-300">{participant.role}</p>
                          )}
                        </div>
                      </div>
                      {participant.status && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          participant.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                          participant.status === 'waitlist' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {participant.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
