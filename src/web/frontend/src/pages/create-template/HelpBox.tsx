// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/create-template/HelpBox.tsx

export default function HelpBox() {
  return (
    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 transition-colors duration-200">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Template Tips</h3>
          <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-sm">
            <li>• Templates can be reused for multiple events</li>
            <li>• Allowed roles help participants choose their position</li>
            <li>• Emoji mapping makes signups more visual and engaging</li>
            <li>• Set max participants to enforce group size limits</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
