// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/Header.tsx

interface HeaderProps {
  guildId: string;
  eventId: string;
  saving: boolean;
  onBack: () => void;
  onOpenPresets: () => void;
}

export default function Header({ guildId, eventId, saving, onBack, onOpenPresets }: HeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Event
      </button>
      <div className="flex items-center gap-2">
        {saving && <span className="text-xs text-purple-600 dark:text-purple-400">Saving...</span>}
        <button
          onClick={onOpenPresets}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm"
        >
          Profiles
        </button>
      </div>
    </div>
  );
}
