import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

interface SystemSettings {
  maintenanceMode: boolean;
  allowNewGuilds: boolean;
  maxEventsPerGuild: number;
  maxTemplatesPerGuild: number;
  defaultLanguage: string;
  logLevel: string;
  enableAnalytics: boolean;
  webhookUrl: string;
}

export default function SystemSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowNewGuilds: true,
    maxEventsPerGuild: 100,
    maxTemplatesPerGuild: 50,
    defaultLanguage: 'en',
    logLevel: 'info',
    enableAnalytics: true,
    webhookUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load settings');
      
      const data = await response.json();
      setSettings(data.settings || settings);
    } catch (error) {
      console.error('Settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/a')}
            className="text-purple-300 hover:text-white transition-colors mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-purple-200 mt-2">Configure global bot settings</p>
        </div>

        {/* Settings Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 space-y-8">
          {/* General Settings */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">General Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">Maintenance Mode</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Prevent all bot interactions during maintenance
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">Allow New Guilds</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Allow the bot to join new Discord servers
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowNewGuilds}
                    onChange={(e) => setSettings({ ...settings, allowNewGuilds: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">Enable Analytics</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Collect anonymous usage statistics
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAnalytics}
                    onChange={(e) => setSettings({ ...settings, enableAnalytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Limits */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Resource Limits</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Max Events per Guild
                </label>
                <input
                  type="number"
                  value={settings.maxEventsPerGuild}
                  onChange={(e) => setSettings({ ...settings, maxEventsPerGuild: parseInt(e.target.value) })}
                  min="1"
                  max="1000"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum number of events a guild can create</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Max Templates per Guild
                </label>
                <input
                  type="number"
                  value={settings.maxTemplatesPerGuild}
                  onChange={(e) => setSettings({ ...settings, maxTemplatesPerGuild: parseInt(e.target.value) })}
                  min="1"
                  max="500"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum number of templates a guild can create</p>
              </div>
            </div>
          </div>

          {/* Localization */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Localization</h2>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Default Language
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="de">Deutsch</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Default language for new guilds</p>
            </div>
          </div>

          {/* Logging */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Logging & Monitoring</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Log Level
                </label>
                <select
                  value={settings.logLevel}
                  onChange={(e) => setSettings({ ...settings, logLevel: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="error">Error Only</option>
                  <option value="warn">Warnings</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Minimum log level to record</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Webhook URL (Optional)
                </label>
                <input
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">Discord webhook for critical alerts</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-white/20">
            <button
              onClick={() => navigate('/a')}
              className="px-6 py-3 bg-white/5 border border-white/20 text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
