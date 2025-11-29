// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Settings.tsx
// Settings page - refactored with modular components and tabs

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, GuildSettings, DiscordRole, DiscordChannel } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import { useI18n } from '../contexts/I18nContext';

// Import settings components
import LanguageTimezoneCard from './settings/LanguageTimezoneCard';
import ManagerAccessCard from './settings/ManagerAccessCard';
import AutomationCard from './settings/AutomationCard';
import ChannelsCard from './settings/ChannelsCard';
import VoiceChannelsCard from './settings/VoiceChannelsCard';
import StatisticsCard from './settings/StatisticsCard';
import ParticipantNotesCard from './settings/ParticipantNotesCard';
import { ChevronLeftIcon } from './settings/icons';
import { RolePermissionsMap } from './settings/types';

type TabKey = 'general' | 'access' | 'automation' | 'channels' | 'features';

export default function Settings() {
  const { guildId } = useParams<{ guildId: string }>();
  const { t } = useI18n();
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  useEffect(() => {
    if (guildId) {
      setLoading(true);
      setError(null);
      Promise.all([
        api.getGuildSettings(guildId),
        api.getGuildRoles(guildId),
        api.getGuildChannels(guildId),
        api.getRolePermissions(guildId),
      ]).then(([settingsData, rolesData, channelsData, permissionsData]) => {
        setSettings(settingsData);
        setRoles(rolesData.filter(r => !r.managed).sort((a, b) => b.position - a.position));
        setChannels(channelsData.filter(c => c.type === 0 || c.type === 5).sort((a, b) => a.position - b.position));
        
        // Convert permissions array to map
        const permMap: RolePermissionsMap = {};
        permissionsData.forEach((p: any) => {
          permMap[p.roleId] = {
            canAccessEvents: p.canAccessEvents,
            canAccessCompositions: p.canAccessCompositions,
            canAccessTemplates: p.canAccessTemplates,
            canAccessSettings: p.canAccessSettings,
          };
        });
        setRolePermissions(permMap);
      }).catch((err) => {
        console.error('Failed to load settings:', err);
        if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
          setError('Access Denied: You do not have permission to view Settings.');
        } else {
          setError('Failed to load settings. Please try again.');
        }
      }).finally(() => setLoading(false));
    }
  }, [guildId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guildId && settings) {
      setSaving(true);
      try {
        // Save guild settings
        await api.updateGuildSettings(guildId, settings);
        
        // Get current role permissions from server
        const currentPermissions = await api.getRolePermissions(guildId);
        const currentRoleIds = new Set(currentPermissions.map((p: any) => p.roleId));
        
        // Save/update permissions for all current dashboard roles
        const currentDashboardRoles = settings.dashboardRoles || [];
        const permissionUpdates = currentDashboardRoles.map(roleId => {
          const perms = rolePermissions[roleId] || {
            canAccessEvents: true,
            canAccessCompositions: true,
            canAccessTemplates: true,
            canAccessSettings: false,
          };
          return api.updateRolePermission(guildId, { roleId, ...perms });
        });
        
        // Delete permissions for roles that were removed from dashboardRoles
        const rolesToDelete = Array.from(currentRoleIds).filter(
          roleId => !currentDashboardRoles.includes(roleId as string)
        );
        const deletePromises = rolesToDelete.map(roleId => 
          api.deleteRolePermission(guildId, roleId as string).catch(() => {
            // Ignore 404 errors if permission doesn't exist
          })
        );
        
        await Promise.all([...permissionUpdates, ...deletePromises]);
        
        alert(t.settings.saveSuccess);
      } catch (error) {
        console.error('Failed to save settings:', error);
        alert(t.settings.saveFailed);
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t.settings.loadingSettings}</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !settings) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
          <div className="text-center max-w-md">
            <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">{t.errors.accessDenied}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || t.errors.notFound}</p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              {t.common.goBack}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
            >
              <ChevronLeftIcon />
              <span className="ml-1">{t.common.goBack}</span>
            </button>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t.settings.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t.settings.subtitle}</p>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === 'general'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  General
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('access')}
                className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === 'access'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Access Control
                </div>
              </button>

              <button
                onClick={() => setActiveTab('automation')}
                className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === 'automation'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Automation
                </div>
              </button>

              <button
                onClick={() => setActiveTab('channels')}
                className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === 'channels'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Channels
                </div>
              </button>

              <button
                onClick={() => setActiveTab('features')}
                className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === 'features'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                  Features
                </div>
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSave} className="space-y-6">
            {/* Tab Content */}
            <div className="min-h-[500px]">
              {activeTab === 'general' && (
                <div className="space-y-6 animate-fadeIn">
                  <LanguageTimezoneCard settings={settings} setSettings={setSettings} />
                </div>
              )}

              {activeTab === 'access' && (
                <div className="space-y-6 animate-fadeIn">
                  <ManagerAccessCard 
                    settings={settings} 
                    setSettings={setSettings} 
                    roles={roles}
                    rolePermissions={rolePermissions}
                    setRolePermissions={setRolePermissions}
                  />
                </div>
              )}

              {activeTab === 'automation' && (
                <div className="space-y-6 animate-fadeIn">
                  <AutomationCard settings={settings} setSettings={setSettings} />
                </div>
              )}

              {activeTab === 'channels' && (
                <div className="space-y-6 animate-fadeIn">
                  <ChannelsCard settings={settings} setSettings={setSettings} channels={channels} />
                  <VoiceChannelsCard settings={settings} setSettings={setSettings} guildId={guildId!} />
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-6 animate-fadeIn">
                  <StatisticsCard settings={settings} setSettings={setSettings} channels={channels} roles={roles} />
                  <ParticipantNotesCard settings={settings} setSettings={setSettings} channels={channels} />
                </div>
              )}
            </div>

            {/* Save Button - Fixed at bottom */}
            <div className="sticky bottom-0 py-6 bg-gradient-to-t from-gray-100 dark:from-gray-800 to-transparent">
              <button 
                type="submit" 
                disabled={saving}
                className={`w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.settings.savingSettings}
                  </span>
                ) : (
                  t.settings.saveSettings
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
