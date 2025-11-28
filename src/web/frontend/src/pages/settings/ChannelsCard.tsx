// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/settings/ChannelsCard.tsx
// Channels settings card

import { GuildSettings, DiscordChannel } from '../../services/api';
import { HashtagIcon, InfoIcon } from './icons';
import { useI18n } from '../../contexts/I18nContext';

interface ChannelsCardProps {
  settings: GuildSettings;
  setSettings: (settings: GuildSettings) => void;
  channels: DiscordChannel[];
}

export default function ChannelsCard({ settings, setSettings, channels }: ChannelsCardProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <HashtagIcon />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.settings.sections.channels}</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              {t.settings.channels.loggingChannel}
              <InfoIcon onClick={() => alert(t.settings.channels.loggingChannelHint)} />
            </label>
            <select 
              value={settings.logChannelId || ''} 
              onChange={e => setSettings({...settings, logChannelId: e.target.value || undefined})}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="">{t.settings.channels.selectChannel}</option>
              {channels.map(channel => (
                <option key={channel.id} value={channel.id}>
                  # {channel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              {t.settings.channels.archiveChannel}
              <InfoIcon onClick={() => alert(t.settings.channels.archiveChannelHint)} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select 
                value={settings.archiveChannelId || ''} 
                onChange={e => setSettings({...settings, archiveChannelId: e.target.value || undefined})}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">Select a channel...</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    # {channel.name}
                  </option>
                ))}
              </select>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Archive after (hours)</label>
                <input 
                  type="number" 
                  min="0"
                  value={settings.autoDeleteHours || 24} 
                  onChange={e => setSettings({...settings, autoDeleteHours: e.target.value ? parseInt(e.target.value) : 24})}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="24"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
