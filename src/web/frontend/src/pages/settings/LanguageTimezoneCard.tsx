// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/settings/LanguageTimezoneCard.tsx
// Language & Timezone settings card

import { GuildSettings } from '../../services/api';
import { COMMON_TIMEZONES } from './constants';
import { getCurrentTime } from './utils';
import { InfoIcon, ResetIcon } from './icons';

interface LanguageTimezoneCardProps {
  settings: GuildSettings;
  setSettings: (settings: GuildSettings) => void;
}

export default function LanguageTimezoneCard({ settings, setSettings }: LanguageTimezoneCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🌍 Language & Timezone</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
            <select 
              value={settings.locale || 'en'} 
              onChange={e => setSettings({...settings, locale: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="en">🇬🇧 English</option>
              <option value="ru">🇷🇺 Русский</option>
              <option value="de">🇩🇪 Deutsch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              Timezone
              <InfoIcon onClick={() => alert('Select your server timezone. Events will be displayed in this timezone.')} />
            </label>
            <div className="flex gap-2">
              <select
                value={settings.timezone || 'UTC'} 
                onChange={e => setSettings({...settings, timezone: e.target.value})}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                {COMMON_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.name} | Current time: {getCurrentTime(tz.value)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSettings({...settings, timezone: 'UTC'})}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                title="Reset to UTC"
              >
                <ResetIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
