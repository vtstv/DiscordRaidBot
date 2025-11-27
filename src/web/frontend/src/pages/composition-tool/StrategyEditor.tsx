// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/StrategyEditor.tsx

import { useState } from 'react';

const MAX_STRATEGY_LENGTH = 2000;

interface StrategyEditorProps {
  strategy: string;
  onSave: (strategy: string) => void;
}

export default function StrategyEditor({ strategy, onSave }: StrategyEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(strategy);

  const handleSave = () => {
    onSave(value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(strategy);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strategy Description</h3>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {strategy ? 'Edit' : 'Add Strategy'}
          </button>
        </div>
        
        {strategy ? (
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            {strategy}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No strategy description yet. Click "Add Strategy" to add one.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Strategy Description</h3>
      </div>
      
      <textarea
        value={value}
        onChange={(e) => {
          const newValue = e.target.value;
          if (newValue.length <= 2000) {
            setValue(newValue);
          }
        }}
        placeholder="Describe your raid strategy, boss mechanics, player assignments, etc..."
        rows={8}
        maxLength={2000}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-vertical"
      />
      
      <div className="text-right mt-1 text-xs text-gray-500 dark:text-gray-400">
        {value.length}/2000 characters
      </div>
      
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
        >
          Save Strategy
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
