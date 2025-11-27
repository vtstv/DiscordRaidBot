// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/EventDetails.tsx
// Event Details Page - Orchestrator

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Event } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import { STATUS_CONFIG } from './event-details/constants';
import { EditValues, EditableFieldName, EventStatus } from './event-details/types';
import EventHeader from './event-details/EventHeader';
import EventDetailsCard from './event-details/EventDetailsCard';
import ParticipantsList from './event-details/ParticipantsList';
import EventStats from './event-details/EventStats';
import CreatorInfo from './event-details/CreatorInfo';

export default function EventDetails() {
  const { guildId, eventId } = useParams<{ guildId: string; eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<EditableFieldName | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({
    title: '',
    description: '',
    maxParticipants: 0,
    startTime: '',
  });

  useEffect(() => {
    if (guildId && eventId) {
      api
        .getEvent(guildId, eventId)
        .then((evt) => {
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

  const saveField = async (field: EditableFieldName) => {
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

  const handleChangeEdit = (values: Partial<EditValues>) => {
    setEditValues({ ...editValues, ...values });
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

  const status = STATUS_CONFIG[event.status as EventStatus] || STATUS_CONFIG.scheduled;

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

          <EventHeader
            event={event}
            guildId={guildId!}
            eventId={eventId!}
            status={status}
            editingField={editingField}
            editValues={editValues}
            saving={saving}
            onEdit={setEditingField}
            onChangeEdit={handleChangeEdit}
            onSaveField={saveField}
            onCancelEdit={cancelEdit}
            onDelete={handleDelete}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <EventDetailsCard
                event={event}
                editingField={editingField}
                editValues={editValues}
                saving={saving}
                onEdit={setEditingField}
                onChangeEdit={handleChangeEdit}
                onSaveField={saveField}
                onCancelEdit={cancelEdit}
              />

              <ParticipantsList event={event} />
            </div>

            <div className="space-y-6">
              <EventStats event={event} />
              <CreatorInfo event={event} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
