// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/EventDetails.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Event } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';

export default function EventDetails() {
  const { guildId, eventId } = useParams<{ guildId: string; eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Inline editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    title: '',
    description: '',
    maxParticipants: 0,
    startTime: '',
  });

  useEffect(() => {
    if (guildId && eventId) {
      api.getEvent(guildId, eventId)
        .then(evt => {
          setEvent(evt);
          setEditValues({
            title: evt.title,
            description: evt.description || '',
            maxParticipants: evt.maxParticipants || 0,
            startTime: new Date(evt.startTime).toISOString().slice(0, 16),
          });
        })
        .finally(() => setLoading(false));
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

  const saveField = async (field: keyof typeof editValues) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId,
          [field]: field === 'startTime' ? new Date(editValues[field]).toISOString() : editValues[field],
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const updatedEvent = await api.getEvent(guildId!, eventId!);
      setEvent(updatedEvent);
      setEditingField(null);
    } catch (error) {
      alert(`Failed to update ${field}`);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (!event) return;
    setEditValues({
      title: event.title,
      description: event.description || '',
      maxParticipants: event.maxParticipants || 0,
      startTime: new Date(event.startTime).toISOString().slice(0, 16),
    });
    setEditingField(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading event details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-200">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event not found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">This event may have been deleted</p>
            <button
              onClick={() => navigate(`/guild/${guildId}/events`)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Back to Events
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusConfig = {
    scheduled: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: 'M5 13l4 4L19 7' },
    completed: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
  };

  const status = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.scheduled;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/guild/${guildId}/events`)}
            className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>

          {/* Header Card with Inline Editing */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6 transition-colors duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 ${status.bg} rounded-xl`}>
                    <svg className={`w-6 h-6 ${status.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={status.icon} />
                    </svg>
                  </div>
                  <div className="flex-1">
                    {/* Editable Title */}
                    {editingField === 'title' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editValues.title}
                          onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                          className="w-full text-3xl font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveField('title')}
                            disabled={saving}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <h1
                        onClick={() => setEditingField('title')}
                        className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        title="Click to edit"
                      >
                        {event.title}
                        <svg className="inline-block w-5 h-5 ml-2 opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </h1>
                    )}
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${status.bg} ${status.text}`}>
                      {event.status}
                    </span>
                  </div>
                </div>

                {/* Editable Description */}
                {editingField === 'description' ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValues.description}
                      onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                      className="w-full text-gray-600 dark:text-gray-300 text-lg bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveField('description')}
                        disabled={saving}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => setEditingField('description')}
                    className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                    title="Click to edit"
                  >
                    {event.description || <span className="italic text-gray-400 dark:text-gray-500">No description (click to add)</span>}
                    <svg className="inline-block w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/guild/${guildId}/events/${eventId}/composition`)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  title="Manage raid composition"
                >
                  Composition
                </button>
                <button
                  onClick={() => navigate(`/guild/${guildId}/events/${eventId}/edit`)}
                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-md transition-all font-medium"
                >
                  Full Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 hover:shadow-md transition-all font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Time Information with Inline Editing */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Event Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Editable Start Time */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Start Time</p>
                      {editingField === 'startTime' ? (
                        <div className="space-y-2">
                          <input
                            type="datetime-local"
                            value={editValues.startTime}
                            onChange={(e) => setEditValues({ ...editValues, startTime: e.target.value })}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-purple-300 dark:border-purple-500 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveField('startTime')}
                              disabled={saving}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingField('startTime')}
                          className="cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                          title="Click to edit"
                        >
                          <p className="font-semibold text-gray-900 dark:text-white">{new Date(event.startTime).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            {new Date(event.startTime).toLocaleTimeString()}
                            <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editable Max Participants */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Max Participants</p>
                      {editingField === 'maxParticipants' ? (
                        <div className="space-y-2">
                          <input
                            type="number"
                            min="0"
                            value={editValues.maxParticipants}
                            onChange={(e) => setEditValues({ ...editValues, maxParticipants: parseInt(e.target.value) || 0 })}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-purple-300 dark:border-purple-500 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveField('maxParticipants')}
                              disabled={saving}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          onClick={() => setEditingField('maxParticipants')}
                          className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                          title="Click to edit"
                        >
                          {event.maxParticipants || 'Unlimited'}
                          <svg className="inline-block w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants */}
              {event.participants && event.participants.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Participants ({event.participants.length}{event.maxParticipants ? `/${event.maxParticipants}` : ''})
                  </h2>
                  <div className="space-y-2">
                    {event.participants.map((participant: any) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            participant.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            participant.status === 'waitlist' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Statistics</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">Participants</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {event._count?.participants || 0}
                      {event.maxParticipants && <span className="text-lg text-gray-500 dark:text-gray-500">/{event.maxParticipants}</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator Info */}
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
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
