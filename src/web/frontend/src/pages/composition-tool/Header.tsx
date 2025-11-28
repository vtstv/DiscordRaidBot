// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/Header.tsx

import { useI18n } from '../../contexts/I18nContext';

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

  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t.compositionTool.backToEvent}
      </button>
      <div className="flex items-center gap-2">
        {saving && <span className="text-xs text-purple-600 dark:text-purple-400">{t.compositionTool.saving}</span>}
        {raidPlanId && (
          <a
            href={`/raidplan/${raidPlanId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {t.compositionTool.viewPublicPage}
          </a>
        )}
        <button
          onClick={onOpenPresets}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm"
        >
          {t.compositionTool.profiles}
        </button>
      </div>
    </div>
  );
}
