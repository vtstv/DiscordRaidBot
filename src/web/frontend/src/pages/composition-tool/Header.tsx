// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/Header.tsx

import { useI18n } from '../../contexts/I18nContext';
import { useClickMode } from '../../contexts/ClickModeContext';

interface HeaderProps {
  guildId: string;
  eventId: string;
  saving: boolean;
  onBack: () => void;
  onOpenPresets: () => void;
  raidPlanId?: string;
}

export default function Header({ guildId, eventId, saving, onBack, onOpenPresets, raidPlanId }: HeaderProps) {
  const { t } = useI18n();
  const { isClickMode, isTouchDevice, forceClickMode, setForceClickMode } = useClickMode();

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 lg:gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-xs lg:text-sm"
        >
          <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">{t.compositionTool.backToEvent}</span>
          <span className="sm:hidden">Back</span>
        </button>
        <div className="flex items-center gap-1 lg:gap-2">
          {saving && <span className="text-xs text-purple-600 dark:text-purple-400">{t.compositionTool.saving}</span>}
          {raidPlanId && (
            <a
              href={`/raidplan/${raidPlanId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg lg:rounded-xl font-medium hover:shadow-lg transition-all text-xs lg:text-sm flex items-center gap-1 lg:gap-2"
            >
              <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="hidden sm:inline">{t.compositionTool.viewPublicPage}</span>
              <span className="sm:hidden">View</span>
            </a>
          )}
          <button
            onClick={onOpenPresets}
            className="px-2 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg lg:rounded-xl font-medium hover:shadow-lg transition-all text-xs lg:text-sm"
          >
            <span className="hidden sm:inline">{t.compositionTool.profiles}</span>
            <span className="sm:hidden">Profiles</span>
          </button>
        </div>
      </div>
      
      {/* Mode toggle for desktop only */}
      {!isTouchDevice && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assignment Mode:</span>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setForceClickMode(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !forceClickMode
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
                Drag & Drop
              </div>
            </button>
            <button
              onClick={() => setForceClickMode(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                forceClickMode
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Click to Assign
              </div>
            </button>
          </div>
          {forceClickMode && (
            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
              Click participant → Click position to assign
            </span>
          )}
        </div>
      )}
    </div>
  );
}
