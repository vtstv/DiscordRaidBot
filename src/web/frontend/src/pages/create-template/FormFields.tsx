// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/create-template/FormFields.tsx

import { useI18n } from '../../contexts/I18nContext';
import type { TemplateFormData } from './types';

interface FormFieldsProps {
  formData: TemplateFormData;
  onChange: (updates: Partial<TemplateFormData>) => void;
}

export default function FormFields({ formData, onChange }: FormFieldsProps) {
  const { t } = useI18n();
  
  return (
    <div className="space-y-6">
      {/* Name and Max Participants Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.createTemplate.fields.name} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder={t.createTemplate.fields.namePlaceholder}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            {t.createTemplate.fields.maxParticipants}
            <span className="text-xs text-gray-500 dark:text-gray-400">{t.createTemplate.fields.maxParticipantsHint}</span>
          </label>
          <input
            type="number"
            min="0"
            value={formData.maxParticipants}
            onChange={(e) => onChange({ maxParticipants: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder={t.createTemplate.fields.maxParticipantsPlaceholder}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.createTemplate.fields.description}
        </label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder={t.createTemplate.fields.descriptionPlaceholder}
        />
      </div>

      {/* Allowed Roles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.createTemplate.fields.allowedRoles}
        </label>
        <input
          type="text"
          value={formData.allowedRoles}
          onChange={(e) => onChange({ allowedRoles: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder={t.createTemplate.fields.allowedRolesPlaceholder}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t.createTemplate.fields.allowedRolesHint}</p>
      </div>

      {/* Role Limits */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.createTemplate.fields.roleLimits}
        </label>
        <input
          type="text"
          value={formData.roleLimits}
          onChange={(e) => onChange({ roleLimits: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder={t.createTemplate.fields.roleLimitsPlaceholder}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t.createTemplate.fields.roleLimitsHint}</p>
      </div>

      {/* Emoji Mapping */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.createTemplate.fields.emojiMapping}
        </label>
        <input
          type="text"
          value={formData.emojiMapping}
          onChange={(e) => onChange({ emojiMapping: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder={t.createTemplate.fields.emojiMappingPlaceholder}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t.createTemplate.fields.emojiMappingHint}</p>
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.createTemplate.fields.imageUrl}
        </label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => onChange({ imageUrl: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder={t.createTemplate.fields.imageUrlPlaceholder}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t.createTemplate.fields.imageUrlHint}</p>
        {formData.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <img 
              src={formData.imageUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect width="400" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="sans-serif"%3EInvalid Image URL%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
