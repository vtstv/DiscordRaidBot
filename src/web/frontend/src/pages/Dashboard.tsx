// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Dashboard.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';

export default function Dashboard() {
  const { guildId } = useParams<{ guildId: string }>();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guildId) {
      api.getGuildStats(guildId).then(setStats).finally(() => setLoading(false));
    }
  }, [guildId]);

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Events</h3>
          <div className="stat-value">{stats?.totalEvents || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Active Events</h3>
          <div className="stat-value">{stats?.activeEvents || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Templates</h3>
          <div className="stat-value">{stats?.totalTemplates || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Participants</h3>
          <div className="stat-value">{stats?.totalParticipants || 0}</div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
