// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/settings/DiscordEventsCard.tsx
// Discord Events settings card

import { GuildSettings } from '../../services/api';
import { useI18n } from '../../contexts/I18nContext';

interface DiscordEventsCardProps {
  settings: GuildSettings;
  setSettings: (settings: GuildSettings) => void;
}

export default function DiscordEventsCard({ settings, setSettings }: DiscordEventsCardProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.nativeEvents.title}
          </h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                {t.nativeEvents.createEvents}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t.nativeEvents.createEventsDescription}
              </span>
            </div>
            <input
              type="checkbox"
              checked={(settings as any).createNativeEvent !== false}
              onChange={e => setSettings({...settings, createNativeEvent: e.target.checked} as any)}
              className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-purple-500"
            />
          </label>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">{t.nativeEvents.benefitsTitle}</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>{t.nativeEvents.benefit1}</li>
                  <li>{t.nativeEvents.benefit2}</li>
                  <li>{t.nativeEvents.benefit3}</li>
                  <li>{t.nativeEvents.benefit4}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
