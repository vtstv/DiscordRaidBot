// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/settings/VoiceChannelsCard.tsx
// Voice channels settings card

import { useState, useEffect } from 'react';
import { GuildSettings } from '../../services/api';
import { useI18n } from '../../contexts/I18nContext';

interface VoiceChannelsCardProps {
  settings: GuildSettings;
  setSettings: (settings: GuildSettings) => void;
  guildId: string;
}

interface Category {
  id: string;
  name: string;
  type: number;
}

export default function VoiceChannelsCard({ settings, setSettings, guildId }: VoiceChannelsCardProps) {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, [guildId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/guilds/${guildId}/categories`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔊 Voice Channels</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category for Voice Channels
            </label>
            <select
              value={settings.voiceChannelCategoryId || ''}
              onChange={e => setSettings({...settings, voiceChannelCategoryId: e.target.value || undefined})}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading}
            >
              <option value="">None (disabled)</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select a category where temporary voice channels will be created for events
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              Duration After Event (minutes)
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                120
              </span>
            </label>
            <input 
              type="number" 
              min="0"
              max="1440"
              value={settings.voiceChannelDuration ?? 120} 
              onChange={e => setSettings({...settings, voiceChannelDuration: parseInt(e.target.value) || 120})}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="120"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              How long to keep the voice channel after the event ends (0-1440 minutes)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              Create Before Event (minutes)
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                60
              </span>
            </label>
            <input 
              type="number" 
              min="0"
              max="1440"
              value={settings.voiceChannelCreateBefore ?? 60} 
              onChange={e => setSettings({...settings, voiceChannelCreateBefore: parseInt(e.target.value) || 60})}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="60"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              How many minutes before the event to create the voice channel (0-1440 minutes)
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-2xl">ℹ️</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium mb-1">How Voice Channels Work:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Voice channels are created automatically before events start</li>
                  <li>Channel is created in the selected category</li>
                  <li>Optionally restricted to confirmed participants only</li>
                  <li>Automatically deleted after the configured duration</li>
                  <li>Enable this feature when creating events</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
