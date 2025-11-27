// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/event-details/EditableField.tsx

import type { EditValues, EditableFieldName } from './types';

interface EditableFieldProps {
  field: EditableFieldName;
  value: EditValues[EditableFieldName];
  editValue: EditValues[EditableFieldName];
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onChange: (value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  renderDisplay?: () => React.ReactNode;
  className?: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'number' | 'datetime-local';
}

export default function EditableField({
  field,
  value,
  editValue,
  isEditing,
  saving,
  onEdit,
  onChange,
  onSave,
  onCancel,
  renderDisplay,
  className = '',
  placeholder,
  type = 'text',
}: EditableFieldProps) {
  if (isEditing) {
    return (
      <div className="space-y-2">
        {type === 'textarea' ? (
          <textarea
            value={String(editValue)}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-purple-300 dark:border-purple-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${className}`}
            rows={3}
            autoFocus
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            value={type === 'number' ? Number(editValue) : String(editValue)}
            onChange={(e) => {
              if (type === 'number') {
                onChange(parseInt(e.target.value) || 0);
              } else {
                onChange(e.target.value);
              }
            }}
            min={type === 'number' ? 0 : undefined}
            className={`w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-purple-300 dark:border-purple-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
            autoFocus
            placeholder={placeholder}
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onEdit}
      className="cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
      title="Click to edit"
    >
      {renderDisplay ? renderDisplay() : (
        <span className={className}>
          {value || <span className="italic text-gray-400 dark:text-gray-500">{placeholder || 'Click to add'}</span>}
          <svg className="inline-block w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </span>
      )}
    </div>
  );
}
