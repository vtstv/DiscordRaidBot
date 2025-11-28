// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/settings/AutomationCard.tsx
// Automation settings card

import { GuildSettings } from '../../services/api';
import { useI18n } from '../../contexts/I18nContext';

interface AutomationCardProps {
  settings: GuildSettings;
  setSettings: (settings: GuildSettings) => void;
}

export default function AutomationCard({ settings, setSettings }: AutomationCardProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⏰ {t.settings.sections.automation}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.settings.automation.reminderIntervals}</label>
            <input 
              type="text" 
              value={(settings.reminderIntervals || []).join(', ')} 
              onChange={e => setSettings({...settings, reminderIntervals: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder={t.settings.automation.reminderIntervalsPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              Auto-Delete After
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                24h
              </span>
            </label>
            <input 
              type="number" 
              min="0"
              value={settings.autoDeleteHours || ''} 
              onChange={e => setSettings({...settings, autoDeleteHours: e.target.value ? parseInt(e.target.value) : undefined})}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.settings.automation.logRetention}</label>
            <input 
              type="number" 
              min="0"
              value={settings.logRetentionDays || ''} 
              onChange={e => setSettings({...settings, logRetentionDays: e.target.value ? parseInt(e.target.value) : undefined})}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder={t.settings.automation.logRetentionPlaceholder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
