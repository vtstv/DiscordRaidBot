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
      <h1>Server Settings</h1>
      <form onSubmit={handleSave} className="settings-form">
        <div className="form-group">
          <label>Timezone</label>
          <input 
            type="text" 
            value={settings.timezone || ''} 
            onChange={e => setSettings({...settings, timezone: e.target.value})}
            placeholder="UTC"
          />
        </div>
        <div className="form-group">
          <label>Locale</label>
          <select 
            value={settings.locale || 'en'} 
            onChange={e => setSettings({...settings, locale: e.target.value})}
          >
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">Save Settings</button>
      </form>
      <Footer />
    </Layout>
  );
}
