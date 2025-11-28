// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/event-details/EventHeader.tsx

import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import type { Event } from '../../services/api';
import type { EditValues, EditableFieldName, StatusConfig } from './types';
import EditableField from './EditableField';

interface EventHeaderProps {
  event: Event;
  guildId: string;
  eventId: string;
  status: StatusConfig;
  editingField: EditableFieldName | null;
  editValues: EditValues;
  saving: boolean;
  onEdit: (field: EditableFieldName) => void;
  onChangeEdit: (values: Partial<EditValues>) => void;
  onSaveField: (field: EditableFieldName) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

export default function EventHeader({
  event,
  guildId,
  eventId,
  status,
  editingField,
  editValues,
  saving,
  onEdit,
  onChangeEdit,
  onSaveField,
  onCancelEdit,
  onDelete,
}: EventHeaderProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 ${status.bg} rounded-xl`}>
              <svg className={`w-6 h-6 ${status.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={status.icon} />
              </svg>
            </div>
            <div className="flex-1">
              {/* Editable Title */}
              {editingField === 'title' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValues.title}
                    onChange={(e) => onChangeEdit({ title: e.target.value })}
                    className="w-full text-3xl font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSaveField('title')}
                      disabled={saving}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      {saving ? t.eventDetails.saving : t.eventDetails.save}
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      {t.eventDetails.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <h1
                  onClick={() => onEdit('title')}
                  className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  title={t.eventDetails.clickToEdit}
                >
                  {event.title}
                  <svg className="inline-block w-5 h-5 ml-2 opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </h1>
              )}
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${status.bg} ${status.text}`}>
                {event.status}
              </span>
            </div>
          </div>

          {/* Editable Description */}
          <EditableField
            field="description"
            value={event.description || ''}
            editValue={editValues.description}
            isEditing={editingField === 'description'}
            saving={saving}
            onEdit={() => onEdit('description')}
            onChange={(val) => onChangeEdit({ description: val })}
            onSave={() => onSaveField('description')}
            onCancel={onCancelEdit}
            type="textarea"
            className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed"
            placeholder="No description (click to add)"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/guild/${guildId}/events/${eventId}/composition`)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            title={t.eventDetails.composition}
          >
            {t.eventDetails.composition}
          </button>
          <button
            onClick={() => navigate(`/guild/${guildId}/events/${eventId}/edit`)}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-md transition-all font-medium"
          >
            {t.eventDetails.fullEdit}
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 hover:shadow-md transition-all font-medium"
          >
            {t.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
