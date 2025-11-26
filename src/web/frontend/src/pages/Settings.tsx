// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Settings.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, GuildSettings } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';

export default function Settings() {
  const { guildId } = useParams<{ guildId: string }>();
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guildId) {
      api.getGuildSettings(guildId).then(setSettings).finally(() => setLoading(false));
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Log Channel ID</label>
                <input 
                  type="text" 
                  value={settings.logChannelId || ''} 
                  onChange={e => setSettings({...settings, logChannelId: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                  placeholder="1234567890"
                />
                <p className="text-sm text-gray-500 mt-1">Channel for audit logs and event notifications</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Archive Channel ID</label>
                <input 
                  type="text" 
                  value={settings.archiveChannelId || ''} 
                  onChange={e => setSettings({...settings, archiveChannelId: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                  placeholder="1234567890"
                />
                <p className="text-sm text-gray-500 mt-1">Channel where completed events are archived</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Channels</label>
                <input 
                  type="text" 
                  value={(settings.approvalChannels || []).join(', ')} 
                  onChange={e => setSettings({...settings, approvalChannels: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                  placeholder="1234567890, 0987654321"
                />
                <p className="text-sm text-gray-500 mt-1">Channels requiring approval for participants (comma-separated IDs)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thread Channels</label>
                <input 
                  type="text" 
                  value={(settings.threadChannels || []).join(', ')} 
                  onChange={e => setSettings({...settings, threadChannels: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                  placeholder="1234567890, 0987654321"
                />
                <p className="text-sm text-gray-500 mt-1">Channels where event threads auto-create (comma-separated IDs)</p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Permissions</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager Role ID</label>
              <input 
                type="text" 
                value={settings.managerRoleId || ''} 
                onChange={e => setSettings({...settings, managerRoleId: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                placeholder="1234567890"
              />
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
