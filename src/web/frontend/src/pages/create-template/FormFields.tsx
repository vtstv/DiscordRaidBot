// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/create-template/FormFields.tsx

import type { TemplateFormData } from './types';

interface FormFieldsProps {
  formData: TemplateFormData;
  onChange: (updates: Partial<TemplateFormData>) => void;
}

export default function FormFields({ formData, onChange }: FormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Name and Max Participants Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Mythic+ Run"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            Max Participants
            <span className="text-xs text-gray-500 dark:text-gray-400">(0 = unlimited)</span>
          </label>
          <input
            type="number"
            min="0"
            value={formData.maxParticipants}
            onChange={(e) => onChange({ maxParticipants: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="5"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder="Standard Mythic+ dungeon run template"
        />
      </div>

      {/* Allowed Roles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Allowed Roles
        </label>
        <input
          type="text"
          value={formData.allowedRoles}
          onChange={(e) => onChange({ allowedRoles: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Tank, Healer, DPS"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Comma-separated list of roles</p>
      </div>

      {/* Role Limits */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Role Limits (Optional)
        </label>
        <input
          type="text"
          value={formData.roleLimits}
          onChange={(e) => onChange({ roleLimits: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Tank:2, Healer:5, DPS:18"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Format: Role:limit, Role:limit (comma-separated pairs)</p>
      </div>

      {/* Emoji Mapping */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Emoji Mapping
        </label>
        <input
          type="text"
          value={formData.emojiMapping}
          onChange={(e) => onChange({ emojiMapping: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Tank:🛡️, Healer:❤️, DPS:⚔️"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Format: Role:Emoji, Role:Emoji (comma-separated pairs)</p>
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Image URL (Optional)
        </label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => onChange({ imageUrl: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="https://example.com/image.png"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Add a banner image to event embeds created from this template</p>
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
