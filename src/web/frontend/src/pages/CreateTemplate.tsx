// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/CreateTemplate.tsx
// Create/Edit Template Page - Orchestrator

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import { useI18n } from '../contexts/I18nContext';
import PresetButtons from './create-template/PresetButtons';
import FormFields from './create-template/FormFields';
import HelpBox from './create-template/HelpBox';
import type { TemplateFormData } from './create-template/types';
import { templateToFormData, formDataToConfig } from './create-template/utils';

export default function CreateTemplate() {
  const { guildId, templateId } = useParams<{ guildId: string; templateId?: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    maxParticipants: 0,
    allowedRoles: '',
    roleLimits: '',
    emojiMapping: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (templateId) {
      setIsEditMode(true);
      setLoading(true);
      api.getTemplate(templateId)
        .then(template => {
          setFormData(templateToFormData(template));
        })
        .catch(err => {
          setError('Failed to load template');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [templateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(isEditMode ? `/api/templates/${templateId}` : '/api/templates', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          guildId,
          name: formData.name,
          description: formData.description,
          config: formDataToConfig(formData),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${isEditMode ? 'update' : 'create'} template`);
      }

      navigate(`/guild/${guildId}/templates`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleFormChange = (updates: Partial<TemplateFormData>) => {
    setFormData({ ...formData, ...updates });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <button
            onClick={() => navigate(`/guild/${guildId}/templates`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t.createTemplate.backToTemplates}</span>
          </button>

          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {isEditMode ? t.createTemplate.titleEdit : t.createTemplate.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isEditMode ? t.createTemplate.subtitleEdit : t.createTemplate.subtitle}
            </p>
          </div>

          {/* Preset Buttons */}
          <PresetButtons onSelectPreset={setFormData} />

          {/* Form Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 transition-colors duration-200">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FormFields formData={formData} onChange={handleFormChange} />

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => navigate(`/guild/${guildId}/templates`)}
                  className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  {t.createTemplate.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditMode ? t.createTemplate.updating : t.createTemplate.creating}
                    </span>
                  ) : (
                    isEditMode ? t.createTemplate.updateButton : t.createTemplate.createButton
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Box */}
          <HelpBox />
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
