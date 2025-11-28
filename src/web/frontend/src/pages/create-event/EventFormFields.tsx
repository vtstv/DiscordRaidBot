// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/create-event/EventFormFields.tsx

import { useI18n } from '../../contexts/I18nContext';
import type { EventFormData, Channel, Template } from './types';

interface EventFormFieldsProps {
  formData: EventFormData;
  onChange: (updates: Partial<EventFormData>) => void;
  channels: Channel[];
  templates: Template[];
  loadingData: boolean;
}

export default function EventFormFields({ formData, onChange, channels, templates, loadingData }: EventFormFieldsProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.createEvent.fields.title} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder={t.createEvent.fields.titlePlaceholder}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.createEvent.fields.description}
        </label>
        <textarea
          rows={4}
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder={t.createEvent.fields.descriptionPlaceholder}
        />
      </div>

      {/* Date and Time Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.createEvent.fields.startTime} <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            required
            value={formData.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            {t.createEvent.fields.maxParticipants}
            <span className="text-xs text-gray-500 dark:text-gray-400">{t.createEvent.fields.maxParticipantsHint}</span>
          </label>
          <input
            type="number"
            min="0"
            value={formData.maxParticipants}
            onChange={(e) => onChange({ maxParticipants: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder={t.createEvent.fields.maxParticipantsPlaceholder}
          />
        </div>
      </div>

      {/* Channel Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.createEvent.fields.channel} <span className="text-red-500">*</span>
        </label>
        {loadingData ? (
          <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t.createEvent.fields.loadingChannels}
          </div>
        ) : channels.length > 0 ? (
          <select
            required
            value={formData.channelId}
            onChange={(e) => onChange({ channelId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">{t.createEvent.fields.selectChannel}</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                # {channel.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="w-full px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">{t.createEvent.fields.noChannels}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.createEvent.fields.channelHint}
        </p>
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.createEvent.fields.template}
        </label>
        {loadingData ? (
          <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t.createEvent.fields.loadingTemplates}
          </div>
        ) : (
          <select
            value={formData.templateId || ''}
            onChange={(e) => onChange({ templateId: e.target.value || undefined })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">{t.createEvent.fields.noTemplate}</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.description && ` - ${template.description.substring(0, 50)}${template.description.length > 50 ? '...' : ''}`}
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Templates define roles, limits, and other event settings
        </p>
      </div>

      {/* Voice Channel Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voice Channel Settings</h3>
        </div>

        {/* Create Voice Channel Checkbox */}
        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.createVoiceChannel || false}
              onChange={(e) => onChange({ createVoiceChannel: e.target.checked })}
              className="w-5 h-5 text-purple-600 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 transition-all"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              Create temporary voice channel for this event
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-8">
            A voice channel will be automatically created before the event starts and deleted after it ends
          </p>
        </div>

        {/* Conditional Voice Channel Options */}
        {formData.createVoiceChannel && (
          <div className="space-y-4 ml-8 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
            {/* Voice Channel Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Channel Name
              </label>
              <input
                type="text"
                maxLength={50}
                value={formData.voiceChannelName || ''}
                onChange={(e) => onChange({ voiceChannelName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Leave empty to use event title"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum 50 characters. Leave empty to use the event title.
              </p>
            </div>

            {/* Voice Channel Restricted */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.voiceChannelRestricted || false}
                  onChange={(e) => onChange({ voiceChannelRestricted: e.target.checked })}
                  className="w-5 h-5 text-purple-600 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 transition-all"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Restrict to participants only
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">
                Only confirmed participants will be able to join the voice channel
              </p>
            </div>

            {/* Create Before Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Create Before Event (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={formData.voiceChannelCreateBefore || ''}
                onChange={(e) => onChange({ voiceChannelCreateBefore: parseInt(e.target.value) || undefined })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Leave empty to use server default (60 minutes)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                How many minutes before the event starts to create the voice channel (5-1440). Leave empty to use server settings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
