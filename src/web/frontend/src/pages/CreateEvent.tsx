import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Footer from '../components/Footer';

interface EventFormData {
  title: string;
  description: string;
  startTime: string;
  maxParticipants: number;
  templateId?: string;
  channelId: string;
}

export default function CreateEvent() {
  const { guildId, eventId } = useParams<{ guildId: string; eventId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startTime: '',
    maxParticipants: 0,
    channelId: '',
  });

  // Load event data if editing
  useEffect(() => {
    if (eventId) {
      setIsEditMode(true);
      setLoading(true);
      api.getEvent(guildId!, eventId)
        .then(event => {
          setFormData({
            title: event.title,
            description: event.description || '',
            startTime: new Date(event.startTime).toISOString().slice(0, 16),
            maxParticipants: event.maxParticipants || 0,
            channelId: '', // channelId не возвращается из API, оставляем пустым
            templateId: undefined,
          });
        })
        .catch(err => {
          setError('Failed to load event');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [eventId, guildId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(isEditMode ? `/api/events/${eventId}` : '/api/events', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          guildId,
          startTime: new Date(formData.startTime).toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${isEditMode ? 'update' : 'create'} event`);
      }

      navigate(`/guild/${guildId}/events`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/guild/${guildId}/events`)}
            className="text-purple-300 hover:text-white transition-colors mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>
          <h1 className="text-3xl font-bold text-white">{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
          <p className="text-purple-200 mt-2">{isEditMode ? 'Update event details' : 'Fill in the details to create a new event for your server'}</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Weekly Raid Night"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Join us for our weekly raid night..."
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Max Participants */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Max Participants (0 = unlimited)
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="25"
              />
            </div>

            {/* Channel ID */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Channel ID *
              </label>
              <input
                type="text"
                required
                value={formData.channelId}
                onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="123456789012345678"
              />
              <p className="text-sm text-gray-400 mt-1">Right-click channel and Copy ID (Developer Mode must be enabled)</p>
            </div>

            {/* Template Selection - TODO: Load templates from API */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Template (Optional)
              </label>
              <select
                value={formData.templateId || ''}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value || undefined })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">No Template</option>
                {/* TODO: Map templates */}
              </select>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Event' : 'Create Event')}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/guild/${guildId}/events`)}
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        <Footer />
      </div>
    </div>
  );
}
