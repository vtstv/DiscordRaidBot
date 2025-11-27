// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/CreateTemplate.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';

interface TemplateFormData {
  name: string;
  description: string;
  maxParticipants: number;
  allowedRoles: string;
  roleLimits: string;
  emojiMapping: string;
  imageUrl: string;
}

const PRESETS = [
  {
    name: 'Raid (25)',
    data: {
      name: 'Raid',
      description: 'Standard 25-player raid group',
      maxParticipants: 25,
      allowedRoles: 'Tank, Healer, DPS',
      roleLimits: 'Tank:2, Healer:5, DPS:18',
      emojiMapping: 'Tank:🛡️, Healer:❤️, DPS:⚔️',
      imageUrl: '',
    },
  },
  {
    name: 'Mythic+ (5)',
    data: {
      name: 'Mythic+',
      description: '5-player dungeon run',
      maxParticipants: 5,
      allowedRoles: 'Tank, Healer, DPS',
      roleLimits: 'Tank:1, Healer:1, DPS:3',
      emojiMapping: 'Tank:🛡️, Healer:❤️, DPS:⚔️',
      imageUrl: '',
    },
  },
  {
    name: 'Arena (3v3)',
    data: {
      name: 'Arena 3v3',
      description: '3v3 Arena team',
      maxParticipants: 3,
      allowedRoles: 'DPS, Healer',
      roleLimits: 'DPS:2, Healer:1',
      emojiMapping: 'DPS:⚔️, Healer:❤️',
      imageUrl: '',
    },
  },
  {
    name: 'Custom',
    data: {
      name: '',
      description: '',
      maxParticipants: 0,
      allowedRoles: '',
      roleLimits: '',
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
    roleLimits: '',
    emojiMapping: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (templateId) {
      setIsEditMode(true);
      setLoading(true);
      api.getTemplate(templateId)
        .then(template => {
          const config = template.config as any;
          const roleLimitsStr = config.limits && typeof config.limits === 'object'
            ? Object.entries(config.limits)
                .filter(([key]) => key !== 'total')
                .map(([role, limit]) => `${role}:${limit}`)
                .join(', ')
            : '';
          
          setFormData({
            name: template.name,
            description: template.description || '',
            maxParticipants: config.limits?.total || 0,
            allowedRoles: config.roles?.join(', ') || '',
            roleLimits: roleLimitsStr,
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
      const rolesArray = formData.allowedRoles
        .split(',')
        .map(r => r.trim())
        .filter(r => r);

      const emojiMap: Record<string, string> = {};
      if (formData.emojiMapping) {
        formData.emojiMapping.split(',').forEach(pair => {
          const [role, emoji] = pair.split(':').map(s => s.trim());
          if (role && emoji) {
            emojiMap[role] = emoji;
          }
        });
      }

      const limits: Record<string, number> = {};
      if (formData.maxParticipants > 0) {
        limits.total = formData.maxParticipants;
      }
      
      if (formData.roleLimits) {
        formData.roleLimits.split(',').forEach(pair => {
          const [role, limit] = pair.split(':').map(s => s.trim());
          if (role && limit) {
            limits[role] = parseInt(limit);
          }
        });
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <button
            onClick={() => navigate(`/guild/${guildId}/templates`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Templates</span>
          </button>

          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {isEditMode ? 'Edit Template' : 'Create New Template'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isEditMode ? 'Update your event template settings' : 'Create a reusable template for events'}
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors duration-200">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setFormData(preset.data)}
                  className="px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 transition-colors duration-200">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Description Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Mythic+ Run"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    Max Participants
                    <span className="text-xs text-gray-500 dark:text-gray-400">(0 = unlimited)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Standard Mythic+ dungeon run template"
                />
              </div>

              {/* Allowed Roles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allowed Roles
                </label>
                <input
                  type="text"
                  value={formData.allowedRoles}
                  onChange={(e) => setFormData({ ...formData, allowedRoles: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Tank, Healer, DPS"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Comma-separated list of roles</p>
              </div>

              {/* Role Limits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Limits (Optional)
                </label>
                <input
                  type="text"
                  value={formData.roleLimits}
                  onChange={(e) => setFormData({ ...formData, roleLimits: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Tank:2, Healer:5, DPS:18"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Format: Role:limit, Role:limit (comma-separated pairs)</p>
              </div>

              {/* Emoji Mapping */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emoji Mapping
                </label>
                <input
                  type="text"
                  value={formData.emojiMapping}
                  onChange={(e) => setFormData({ ...formData, emojiMapping: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Tank:🛡️, Healer:❤️, DPS:⚔️"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Format: Role:Emoji, Role:Emoji (comma-separated pairs)</p>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="https://example.com/image.png"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Add a banner image to event embeds created from this template</p>
                {formData.imageUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect width="400" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="sans-serif"%3EInvalid Image URL%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/guild/${guildId}/templates`)}
                  className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    isEditMode ? 'Update Template' : 'Create Template'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 transition-colors duration-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Template Tips</h3>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                  <li>• Templates can be reused for multiple events</li>
                  <li>• Allowed roles help participants choose their position</li>
                  <li>• Emoji mapping makes signups more visual and engaging</li>
                  <li>• Set max participants to enforce group size limits</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
