// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/create-template/PresetButtons.tsx

import type { TemplateFormData } from './types';
import { TEMPLATE_PRESETS } from './presets';

interface PresetButtonsProps {
  onSelectPreset: (data: TemplateFormData) => void;
}

export default function PresetButtons({ onSelectPreset }: PresetButtonsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors duration-200">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Quick Presets
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TEMPLATE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onSelectPreset(preset.data)}
            className="px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
