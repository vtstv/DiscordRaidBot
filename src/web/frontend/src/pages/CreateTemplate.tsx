import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Footer from '../components/Footer';

interface TemplateFormData {
  name: string;
  description: string;
  maxParticipants: number;
  allowedRoles: string;
  emojiMapping: string;
  imageUrl: string;
}

const PRESETS = [
  {
    name: 'Raid (25 players)',
    data: {
      name: 'Raid',
      description: 'Standard 25-player raid group',
      maxParticipants: 25,
      allowedRoles: 'Tank, Healer, DPS',
      emojiMapping: 'Tank:🛡️, Healer:❤️, DPS:⚔️',
      imageUrl: '',
    },
  },
  {
    name: 'Mythic+ (5 players)',
    data: {
      name: 'Mythic+',
      description: '5-player dungeon run',
      maxParticipants: 5,
      allowedRoles: 'Tank, Healer, DPS',
      emojiMapping: 'Tank:🛡️, Healer:❤️, DPS:⚔️',
      imageUrl: '',
    },
  },
  {
    name: 'PvP Arena (3v3)',
    data: {
      name: 'Arena 3v3',
      description: '3v3 Arena team',
      maxParticipants: 3,
      allowedRoles: 'DPS, Healer',
      emojiMapping: 'DPS:⚔️, Healer:❤️',
      imageUrl: '',
    },
  },
  {
    name: 'Custom Event',
    data: {
      name: '',
      description: '',
      maxParticipants: 0,
      allowedRoles: '',
      emojiMapping: '',
      imageUrl: '',
    },
  },
];

export default function CreateTemplate() {
  const { guildId, templateId } = useParams<{ guildId: string; templateId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    maxParticipants: 0,
    allowedRoles: '',
    emojiMapping: '',
    imageUrl: '',
  });

  // Load template data if editing
  useEffect(() => {
    if (templateId) {
      setIsEditMode(true);
      setLoading(true);
      api.getTemplate(templateId)
        .then(template => {
          const config = template.config as any;
          setFormData({
            name: template.name,
            description: template.description || '',
            maxParticipants: config.limits?.total || 0,
            allowedRoles: config.roles?.join(', ') || '',
            emojiMapping: config.emojiMap 
              ? Object.entries(config.emojiMap).map(([role, emoji]) => `${role}:${emoji}`).join(', ')
              : '',
            imageUrl: config.imageUrl || '',
          });
        })
        .catch(err => {
          setError('Failed to load template');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [templateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Parse allowed roles
      const rolesArray = formData.allowedRoles
        .split(',')
        .map(r => r.trim())
        .filter(r => r);

      // Parse emoji mapping
      const emojiMap: Record<string, string> = {};
      if (formData.emojiMapping) {
        formData.emojiMapping.split(',').forEach(pair => {
          const [role, emoji] = pair.split(':').map(s => s.trim());
          if (role && emoji) {
            emojiMap[role] = emoji;
          }
        });
      }

      // Build limits object
      const limits: Record<string, number> = {};
      if (formData.maxParticipants > 0) {
        limits.total = formData.maxParticipants;
      }

      const response = await fetch(isEditMode ? `/api/templates/${templateId}` : '/api/templates', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId,
          name: formData.name,
          description: formData.description,
          config: {
            roles: rolesArray,
            limits: limits,
            emojiMap: Object.keys(emojiMap).length > 0 ? emojiMap : undefined,
            imageUrl: formData.imageUrl || undefined,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${isEditMode ? 'update' : 'create'} template`);
      }

      navigate(`/guild/${guildId}/templates`);
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
            onClick={() => navigate(`/guild/${guildId}/templates`)}
            className="text-purple-300 hover:text-white transition-colors mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Templates
          </button>
          <h1 className="text-3xl font-bold text-white">{isEditMode ? 'Edit Template' : 'Create New Template'}</h1>
          <p className="text-purple-200 mt-2">{isEditMode ? 'Update your event template' : 'Create a reusable template for events'}</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-purple-200 mb-3">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setFormData(preset.data)}
                  className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors text-sm"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Mythic+ Run"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Standard Mythic+ dungeon run template"
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
                placeholder="5"
              />
            </div>

            {/* Allowed Roles */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Allowed Roles
              </label>
              <input
                type="text"
                value={formData.allowedRoles}
                onChange={(e) => setFormData({ ...formData, allowedRoles: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Tank, Healer, DPS (comma-separated)"
              />
              <p className="text-sm text-gray-400 mt-1">Comma-separated list of roles</p>
            </div>

            {/* Emoji Mapping */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Emoji Mapping
              </label>
              <input
                type="text"
                value={formData.emojiMapping}
                onChange={(e) => setFormData({ ...formData, emojiMapping: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Tank:🛡️, Healer:❤️, DPS:⚔️"
              />
              <p className="text-sm text-gray-400 mt-1">Format: Role:Emoji, Role:Emoji (comma-separated pairs)</p>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://example.com/image.png"
              />
              <p className="text-sm text-gray-400 mt-1">Add a banner image to event embeds created from this template</p>
              {formData.imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-white/20">
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect width="400" height="200" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif"%3EInvalid Image URL%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Template' : 'Create Template')}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/guild/${guildId}/templates`)}
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Help Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Template Tips</h3>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• Templates can be reused for multiple events</li>
                <li>• Allowed roles help participants choose their position</li>
                <li>• Emoji mapping makes signups more visual and engaging</li>
                <li>• Set max participants to enforce group size limits</li>
              </ul>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
