// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Settings.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, GuildSettings, DiscordRole, DiscordChannel } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';

// Timezone list - same as Discord bot
const COMMON_TIMEZONES = [
  // Americas
  { name: 'Pacific Time - Los Angeles', value: 'America/Los_Angeles' },
  { name: 'Mountain Time - Denver', value: 'America/Denver' },
  { name: 'Central Time - Chicago', value: 'America/Chicago' },
  { name: 'Eastern Time - New York', value: 'America/New_York' },
  { name: 'Atlantic Time - Halifax', value: 'America/Halifax' },
  { name: 'Brazil Time - São Paulo', value: 'America/Sao_Paulo' },
  { name: 'Argentina - Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
  // Europe
  { name: 'Western Europe - London', value: 'Europe/London' },
  { name: 'Central Europe - Berlin', value: 'Europe/Berlin' },
  { name: 'Eastern Europe - Bucharest', value: 'Europe/Bucharest' },
  { name: 'Russia - Moscow', value: 'Europe/Moscow' },
  { name: 'Turkey - Ankara', value: 'Europe/Istanbul' },
  // Asia
  { name: 'India - Kolkata', value: 'Asia/Kolkata' },
  { name: 'Bangladesh - Dhaka', value: 'Asia/Dhaka' },
  { name: 'China - Shanghai', value: 'Asia/Shanghai' },
  { name: 'Japan - Tokyo', value: 'Asia/Tokyo' },
  { name: 'Korea - Seoul', value: 'Asia/Seoul' },
  { name: 'Singapore', value: 'Asia/Singapore' },
  { name: 'Thailand - Bangkok', value: 'Asia/Bangkok' },
  { name: 'UAE - Dubai', value: 'Asia/Dubai' },
  // Australia & Pacific
  { name: 'Australia - Sydney', value: 'Australia/Sydney' },
  { name: 'Australia - Melbourne', value: 'Australia/Melbourne' },
  { name: 'Australia - Perth', value: 'Australia/Perth' },
  { name: 'New Zealand - Auckland', value: 'Pacific/Auckland' },
  // UTC offsets
  { name: 'UTC', value: 'UTC' },
  { name: 'GMT', value: 'GMT' },
];

function getCurrentTime(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(now);
  } catch {
    return '';
  }
}

// Icon components
const ChevronLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const HashtagIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);

const InfoIcon = ({ onClick }: { onClick?: () => void }) => (
  <svg 
    onClick={onClick}
    className={`w-4 h-4 text-gray-400 dark:text-gray-500 ${onClick ? 'cursor-pointer hover:text-gray-600 dark:hover:text-gray-300' : ''}`} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ResetIcon = ({ onClick }: { onClick?: () => void }) => (
  <svg 
    onClick={onClick}
    className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-red-500 dark:hover:text-red-400" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function Settings() {
  const { guildId } = useParams<{ guildId: string }>();
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (guildId) {
      Promise.all([
        api.getGuildSettings(guildId),
        api.getGuildRoles(guildId),
        api.getGuildChannels(guildId),
      ]).then(([settingsData, rolesData, channelsData]) => {
        setSettings(settingsData);
        setRoles(rolesData.filter(r => !r.managed).sort((a, b) => b.position - a.position));
        setChannels(channelsData.filter(c => c.type === 0 || c.type === 5).sort((a, b) => a.position - b.position));
      }).finally(() => setLoading(false));
    }
  }, [guildId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guildId && settings) {
      setSaving(true);
      try {
        await api.updateGuildSettings(guildId, settings);
        alert('✅ Settings saved successfully!');
      } catch (error) {
        alert('❌ Failed to save settings');
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
            <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!settings) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
          <div className="text-center text-red-500 dark:text-red-400">
            <p className="text-xl">❌ Settings not found</p>
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
              <span className="ml-1">Back</span>
            </button>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Configure your server preferences</p>
          </div>
          
          <form onSubmit={handleSave} className="space-y-6">{/* Settings Grid - Compact Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                
                {/* Language & Timezone Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🌍 Language & Timezone</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                        <select 
                          value={settings.locale || 'en'} 
                          onChange={e => setSettings({...settings, locale: e.target.value})}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="en">🇬🇧 English</option>
                          <option value="ru">🇷🇺 Русский</option>
                          <option value="de">🇩🇪 Deutsch</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          Timezone
                          <InfoIcon onClick={() => alert('Select your server timezone. Events will be displayed in this timezone.')} />
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={settings.timezone || 'UTC'} 
                            onChange={e => setSettings({...settings, timezone: e.target.value})}
                            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          >
                            {COMMON_TIMEZONES.map(tz => (
                              <option key={tz.value} value={tz.value}>
                                {tz.name} | Current time: {getCurrentTime(tz.value)}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setSettings({...settings, timezone: 'UTC'})}
                            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                            title="Reset to UTC"
                          >
                            <ResetIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manager & Permissions Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👤 Manager & Access</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          Manager Role
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                            @Manager
                          </span>
                        </label>
                        <select 
                          value={settings.managerRoleId || ''} 
                          onChange={e => setSettings({...settings, managerRoleId: e.target.value || undefined})}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">-- No manager role --</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              @{role.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          Dashboard Access Roles
                          <InfoIcon onClick={() => alert('Select roles that can access the dashboard. If empty, only managers can access. Hold Ctrl/Cmd to select multiple roles.')} />
                        </label>
                        <select 
                          multiple
                          value={settings.dashboardRoles || []} 
                          onChange={e => {
                            const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                            setSettings({...settings, dashboardRoles: selected});
                          }}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-h-[120px]"
                        >
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              @{role.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {settings.dashboardRoles && settings.dashboardRoles.length > 0 
                            ? `${settings.dashboardRoles.length} role(s) selected` 
                            : 'No additional roles selected (managers only)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reminders & Automation */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⏰ Automation</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reminder Intervals</label>
                        <input 
                          type="text" 
                          value={(settings.reminderIntervals || []).join(', ')} 
                          onChange={e => setSettings({...settings, reminderIntervals: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="1h, 30m, 15m"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          Auto-Delete After
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            24h
                          </span>
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          value={settings.autoDeleteHours || ''} 
                          onChange={e => setSettings({...settings, autoDeleteHours: e.target.value ? parseInt(e.target.value) : undefined})}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="24"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Log Retention (days)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={settings.logRetentionDays || ''} 
                          onChange={e => setSettings({...settings, logRetentionDays: e.target.value ? parseInt(e.target.value) : undefined})}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="90"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                
                {/* Channels Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <HashtagIcon />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Channels</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          Logging channel
                          <InfoIcon onClick={() => alert('Channel where bot outputs audit logs for event actions (create, edit, signup, etc.)')} />
                        </label>
                        <select 
                          value={settings.logChannelId || ''} 
                          onChange={e => setSettings({...settings, logChannelId: e.target.value || undefined})}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">Select a channel.</option>
                          {channels.map(channel => (
                            <option key={channel.id} value={channel.id}>
                              # {channel.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          Archive channel
                          <InfoIcon onClick={() => alert('Channel where completed events are archived after specified hours')} />
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <select 
                            value={settings.archiveChannelId || ''} 
                            onChange={e => setSettings({...settings, archiveChannelId: e.target.value || undefined})}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          >
                            <option value="">Select a channel.</option>
                            {channels.map(channel => (
                              <option key={channel.id} value={channel.id}>
                                # {channel.name}
                              </option>
                            ))}
                          </select>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Archive after (hours)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={settings.autoDeleteHours || 24} 
                              onChange={e => setSettings({...settings, autoDeleteHours: e.target.value ? parseInt(e.target.value) : 24})}
                              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                              placeholder="24"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Statistics</h2>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Statistics Tracking</span>
                        <input 
                          type="checkbox" 
                          checked={settings.statsEnabled || false} 
                          onChange={e => setSettings({...settings, statsEnabled: e.target.checked})}
                          className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-purple-500"
                        />
                      </label>

                      {settings.statsEnabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stats Channel</label>
                            <select 
                              value={settings.statsChannelId || ''} 
                              onChange={e => setSettings({...settings, statsChannelId: e.target.value || undefined})}
                              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                              <option value="">-- Select channel --</option>
                              {channels.map(channel => (
                                <option key={channel.id} value={channel.id}>
                                  # {channel.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Update Interval</label>
                            <div className="grid grid-cols-3 gap-2">
                              {['daily', 'weekly', 'monthly'].map(interval => (
                                <button
                                  key={interval}
                                  type="button"
                                  onClick={() => setSettings({...settings, statsUpdateInterval: interval})}
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    settings.statsUpdateInterval === interval
                                      ? 'bg-purple-600 text-white shadow-md'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {interval.charAt(0).toUpperCase() + interval.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>

                          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-Role for Top 10</span>
                            <input 
                              type="checkbox" 
                              checked={settings.statsAutoRoleEnabled || false} 
                              onChange={e => setSettings({...settings, statsAutoRoleEnabled: e.target.checked})}
                              className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-purple-500"
                            />
                          </label>

                          {settings.statsAutoRoleEnabled && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top 10 Role</label>
                                <select 
                                  value={settings.statsTop10RoleId || ''} 
                                  onChange={e => setSettings({...settings, statsTop10RoleId: e.target.value || undefined})}
                                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                >
                                  <option value="">-- Select role --</option>
                                  {roles.map(role => (
                                    <option key={role.id} value={role.id}>
                                      @{role.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min. Events Required</label>
                                <input 
                                  type="number" 
                                  min="1"
                                  value={settings.statsMinEvents || 5} 
                                  onChange={e => setSettings({...settings, statsMinEvents: e.target.value ? parseInt(e.target.value) : 5})}
                                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                  placeholder="5"
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Participant Notes Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Participant Notes</h2>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow participant notes</span>
                        <input
                          type="checkbox"
                          checked={settings.allowParticipantNotes || false}
                          onChange={e => setSettings({...settings, allowParticipantNotes: e.target.checked})}
                          className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Show 'View online' button</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Display link to public event view in Discord messages</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.showViewOnlineButton !== false}
                          onChange={e => setSettings({...settings, showViewOnlineButton: e.target.checked})}
                          className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-purple-500"
                        />
                      </label>

                      {settings.allowParticipantNotes && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              Max note length
                              <InfoIcon onClick={() => alert('Maximum characters allowed in participant notes (default: 30)')} />
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="200"
                              value={settings.participantNoteMaxLength || 30}
                              onChange={e => setSettings({...settings, participantNoteMaxLength: e.target.value ? parseInt(e.target.value) : 30})}
                              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                              placeholder="30"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              Note channels
                              <InfoIcon onClick={() => alert('Channels where participants can add notes to their signups. If empty, notes are allowed in all channels.')} />
                            </label>
                            <div className="space-y-2">
                              {/* Current note channels list */}
                              {(settings.noteChannels || []).length > 0 && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current channels:</div>
                                  <div className="flex flex-wrap gap-2">
                                    {(settings.noteChannels || []).map(channelId => {
                                      const channel = channels.find(c => c.id === channelId);
                                      return (
                                        <span key={channelId} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full">
                                          #{channel?.name || 'Unknown'}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const current = settings.noteChannels || [];
                                              setSettings({...settings, noteChannels: current.filter(id => id !== channelId)});
                                            }}
                                            className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Add channel */}
                              <div className="flex gap-2">
                                <select
                                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select channel to add</option>
                                  {channels
                                    .filter(channel => !(settings.noteChannels || []).includes(channel.id))
                                    .map(channel => (
                                      <option key={channel.id} value={channel.id}>
                                        # {channel.name}
                                      </option>
                                    ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const select = e.currentTarget.previousElementSibling as HTMLSelectElement;
                                    const channelId = select.value;
                                    if (channelId) {
                                      const current = settings.noteChannels || [];
                                      setSettings({...settings, noteChannels: [...current, channelId]});
                                      select.value = '';
                                    }
                                  }}
                                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                                >
                                  Add
                                </button>
                              </div>

                              {/* Clear all button */}
                              {(settings.noteChannels || []).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSettings({...settings, noteChannels: []})}
                                  className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 rounded-xl transition-colors text-sm"
                                >
                                  Clear all channels
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

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
                    Saving...
                  </span>
                ) : (
                  'SAVE'
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
