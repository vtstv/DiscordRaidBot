// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Settings.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, GuildSettings, DiscordRole, DiscordChannel } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';

export default function Settings() {
  const { guildId } = useParams<{ guildId: string }>();
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loading, setLoading] = useState(true);

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
      await api.updateGuildSettings(guildId, settings);
      alert('Settings saved!');
    }
  };

  if (loading) return <Layout><div className="loading">Loading settings...</div></Layout>;
  if (!settings) return <Layout><div className="error">Settings not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Server Settings
        </h1>
        
        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Basic Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <input 
                  type="text" 
                  value={settings.timezone || ''} 
                  onChange={e => setSettings({...settings, timezone: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                  placeholder="UTC, Europe/London, America/New_York, etc."
                />
                <p className="text-sm text-gray-500 mt-1">IANA timezone (e.g., Europe/London, America/New_York)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Locale</label>
                <select 
                  value={settings.locale || 'en'} 
                  onChange={e => setSettings({...settings, locale: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                >
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Command Prefix</label>
                <input 
                  type="text" 
                  value={settings.commandPrefix || ''} 
                  onChange={e => setSettings({...settings, commandPrefix: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                  placeholder="!"
                  maxLength={3}
                />
                <p className="text-sm text-gray-500 mt-1">Prefix for text commands (e.g., !, $, #)</p>
              </div>
            </div>
          </div>

          {/* Channel Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Channel Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Log Channel</label>
                <select 
                  value={settings.logChannelId || ''} 
                  onChange={e => setSettings({...settings, logChannelId: e.target.value || undefined})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                >
                  <option value="">-- No log channel --</option>
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">Channel for audit logs and event notifications</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Archive Channel</label>
                <select 
                  value={settings.archiveChannelId || ''} 
                  onChange={e => setSettings({...settings, archiveChannelId: e.target.value || undefined})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                >
                  <option value="">-- No archive channel --</option>
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">Channel where completed events are archived</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Channels</label>
                <div className="space-y-2">
                  {channels.map(channel => (
                    <label key={channel.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <input 
                        type="checkbox"
                        checked={(settings.approvalChannels || []).includes(channel.id)}
                        onChange={e => {
                          const current = settings.approvalChannels || [];
                          const updated = e.target.checked
                            ? [...current, channel.id]
                            : current.filter(id => id !== channel.id);
                          setSettings({...settings, approvalChannels: updated});
                        }}
                        className="w-4 h-4 text-purple-600 bg-gray-50 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">#{channel.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">Channels requiring approval for participants</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thread Channels</label>
                <div className="space-y-2">
                  {channels.map(channel => (
                    <label key={channel.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <input 
                        type="checkbox"
                        checked={(settings.threadChannels || []).includes(channel.id)}
                        onChange={e => {
                          const current = settings.threadChannels || [];
                          const updated = e.target.checked
                            ? [...current, channel.id]
                            : current.filter(id => id !== channel.id);
                          setSettings({...settings, threadChannels: updated});
                        }}
                        className="w-4 h-4 text-purple-600 bg-gray-50 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">#{channel.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">Channels where event threads auto-create</p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Permissions</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager Role</label>
              <select 
                value={settings.managerRoleId || ''} 
                onChange={e => setSettings({...settings, managerRoleId: e.target.value || undefined})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
              >
                <option value="">-- No manager role --</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    @{role.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Role that can manage bot (create events, templates, etc.)</p>
            </div>
          </div>

          {/* Reminders & Automation */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Reminders & Automation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Intervals</label>
                <input 
                  type="text" 
                  value={(settings.reminderIntervals || []).join(', ')} 
                  onChange={e => setSettings({...settings, reminderIntervals: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                  placeholder="1h, 15m"
                />
                <p className="text-sm text-gray-500 mt-1">When to send reminders before event start (e.g., 1h, 30m, 15m)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Delete After (hours)</label>
                <input 
                  type="number" 
                  min="0"
                  value={settings.autoDeleteHours || ''} 
                  onChange={e => setSettings({...settings, autoDeleteHours: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                  placeholder="24"
                />
                <p className="text-sm text-gray-500 mt-1">Hours after archiving to auto-delete event message (0 = never delete)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Log Retention (days)</label>
                <input 
                  type="number" 
                  min="0"
                  value={settings.logRetentionDays || ''} 
                  onChange={e => setSettings({...settings, logRetentionDays: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                  placeholder="90"
                />
                <p className="text-sm text-gray-500 mt-1">Days to keep audit logs (0 = keep forever)</p>
              </div>
            </div>
          </div>

          {/* Statistics Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">📊 Participant Statistics</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="statsEnabled"
                  checked={settings.statsEnabled || false} 
                  onChange={e => setSettings({...settings, statsEnabled: e.target.checked})}
                  className="w-5 h-5 text-purple-600 bg-gray-50 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <label htmlFor="statsEnabled" className="ml-3 text-sm font-medium text-gray-700">
                  Enable Statistics Tracking
                </label>
              </div>
              <p className="text-sm text-gray-500">Track participant attendance, completions, and no-shows. Shows leaderboard with medals 🥇🥈🥉</p>

              {settings.statsEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stats Channel</label>
                    <select 
                      value={settings.statsChannelId || ''} 
                      onChange={e => setSettings({...settings, statsChannelId: e.target.value || undefined})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                    >
                      <option value="">-- Select stats channel --</option>
                      {channels.map(channel => (
                        <option key={channel.id} value={channel.id}>
                          #{channel.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">Channel where leaderboard will be posted and updated automatically</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Interval</label>
                    <select 
                      value={settings.statsUpdateInterval || 'daily'} 
                      onChange={e => setSettings({...settings, statsUpdateInterval: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">How often to update the leaderboard in the stats channel</p>
                  </div>

                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="statsAutoRoleEnabled"
                      checked={settings.statsAutoRoleEnabled || false} 
                      onChange={e => setSettings({...settings, statsAutoRoleEnabled: e.target.checked})}
                      className="w-5 h-5 text-purple-600 bg-gray-50 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <label htmlFor="statsAutoRoleEnabled" className="ml-3 text-sm font-medium text-gray-700">
                      Enable Auto-Role for Top 10
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">Automatically assign a special role to top 10 participants</p>

                  {settings.statsAutoRoleEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Top 10 Role</label>
                        <select 
                          value={settings.statsTop10RoleId || ''} 
                          onChange={e => setSettings({...settings, statsTop10RoleId: e.target.value || undefined})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                        >
                          <option value="">-- Select role --</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              @{role.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-sm text-gray-500 mt-1">Role to assign to top 10 participants (updates hourly)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Events for Auto-Role</label>
                        <input 
                          type="number" 
                          min="1"
                          value={settings.statsMinEvents || 5} 
                          onChange={e => setSettings({...settings, statsMinEvents: e.target.value ? parseInt(e.target.value) : 5})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                          placeholder="5"
                        />
                        <p className="text-sm text-gray-500 mt-1">Minimum completed events required to qualify for top 10 role</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Save Settings
          </button>
        </form>
      </div>
      <Footer />
    </Layout>
  );
}
