// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/event-details/EventDetailsCard.tsx

import type { Event } from '../../services/api';
import type { EditValues, EditableFieldName } from './types';

interface EventDetailsCardProps {
  event: Event;
  editingField: EditableFieldName | null;
  editValues: EditValues;
  saving: boolean;
  onEdit: (field: EditableFieldName) => void;
  onChangeEdit: (values: Partial<EditValues>) => void;
  onSaveField: (field: EditableFieldName) => void;
  onCancelEdit: () => void;
}

export default function EventDetailsCard({
  event,
  editingField,
  editValues,
  saving,
  onEdit,
  onChangeEdit,
  onSaveField,
  onCancelEdit,
}: EventDetailsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Event Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Editable Start Time */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Start Time</p>
            {editingField === 'startTime' ? (
              <div className="space-y-2">
                <input
                  type="datetime-local"
                  value={editValues.startTime}
                  onChange={(e) => onChangeEdit({ startTime: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-purple-300 dark:border-purple-500 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onSaveField('startTime')}
                    disabled={saving}
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => onEdit('startTime')}
                className="cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                title="Click to edit"
              >
                <p className="font-semibold text-gray-900 dark:text-white">{new Date(event.startTime).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  {new Date(event.startTime).toLocaleTimeString()}
                  <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Editable Max Participants */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Max Participants</p>
            {editingField === 'maxParticipants' ? (
              <div className="space-y-2">
                <input
                  type="number"
                  min="0"
                  value={editValues.maxParticipants}
                  onChange={(e) => onChangeEdit({ maxParticipants: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-purple-300 dark:border-purple-500 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onSaveField('maxParticipants')}
                    disabled={saving}
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => onEdit('maxParticipants')}
                className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                title="Click to edit"
              >
                {event.maxParticipants || 'Unlimited'}
                <svg className="inline-block w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
