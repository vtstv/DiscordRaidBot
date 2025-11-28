// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/settings/StatisticsCard.tsx
// Statistics settings card

import { GuildSettings, DiscordChannel, DiscordRole } from '../../services/api';
import { useI18n } from '../../contexts/I18nContext';

interface StatisticsCardProps {
  settings: GuildSettings;
  setSettings: (settings: GuildSettings) => void;
  channels: DiscordChannel[];
  roles: DiscordRole[];
}

export default function StatisticsCard({ settings, setSettings, channels, roles }: StatisticsCardProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 {t.settings.sections.statistics}</h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.settings.statistics.enableTracking}</span>
            <input 
              type="checkbox" 
              checked={settings.statsEnabled || false} 
              onChange={e => setSettings({...settings, statsEnabled: e.target.checked})}
              className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-purple-500"
            />
          </label>

          {settings.statsEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.settings.statistics.statsChannel}</label>
                <select 
                  value={settings.statsChannelId || ''} 
                  onChange={e => setSettings({...settings, statsChannelId: e.target.value || undefined})}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">{t.settings.statistics.selectChannel}</option>
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>
                      # {channel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.settings.statistics.updateInterval}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['daily', 'weekly', 'monthly'].map(interval => (
                    <button
                      key={interval}
                      type="button"
                      onClick={() => setSettings({...settings, statsUpdateInterval: interval})}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        settings.statsUpdateInterval === interval
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-Role for Top 10</span>
                <input 
                  type="checkbox" 
                  checked={settings.statsAutoRoleEnabled || false} 
                  onChange={e => setSettings({...settings, statsAutoRoleEnabled: e.target.checked})}
                  className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-purple-500"
                />
              </label>

              {settings.statsAutoRoleEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top 10 Role</label>
                    <select 
                      value={settings.statsTop10RoleId || ''} 
                      onChange={e => setSettings({...settings, statsTop10RoleId: e.target.value || undefined})}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="">-- Select role --</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          @{role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min. Events Required</label>
                    <input 
                      type="number" 
                      min="1"
                      value={settings.statsMinEvents || 5} 
                      onChange={e => setSettings({...settings, statsMinEvents: e.target.value ? parseInt(e.target.value) : 5})}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="5"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
