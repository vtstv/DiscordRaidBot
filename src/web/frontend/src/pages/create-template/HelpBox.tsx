// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/create-template/HelpBox.tsx

import { useI18n } from '../../contexts/I18nContext';

export default function HelpBox() {
  const { t } = useI18n();

  return (
    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 transition-colors duration-200">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.createTemplate.help.title}</h3>
          <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-sm">
            <li>• {t.createTemplate.help.tip1}</li>
            <li>• {t.createTemplate.help.tip2}</li>
            <li>• {t.createTemplate.help.tip3}</li>
            <li>• {t.createTemplate.help.tip4}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
