// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Settings.tsx
// Settings page - refactored with modular components

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
          
          <form onSubmit={handleSave} className="space-y-6">
            {/* Settings Grid - Compact Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                <LanguageTimezoneCard settings={settings} setSettings={setSettings} />
                <ManagerAccessCard 
                  settings={settings} 
                  setSettings={setSettings} 
                  roles={roles}
                  rolePermissions={rolePermissions}
                  setRolePermissions={setRolePermissions}
                />
                <AutomationCard settings={settings} setSettings={setSettings} />
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                <ChannelsCard settings={settings} setSettings={setSettings} channels={channels} />
                <VoiceChannelsCard settings={settings} setSettings={setSettings} guildId={guildId!} />
                <StatisticsCard settings={settings} setSettings={setSettings} channels={channels} roles={roles} />
                <ParticipantNotesCard settings={settings} setSettings={setSettings} channels={channels} />
              </div>
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
