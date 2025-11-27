// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/App.tsx
// Main application component

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GuildProvider } from './contexts/GuildContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { loadConfig, getConfig } from './config';
import { api } from './services/api';

// Pages
import Landing from './pages/Landing';
import ServerSelect from './pages/ServerSelect';
import PanelSelect from './pages/PanelSelect';
import BotAdminPanel from './pages/BotAdminPanel';
import GlobalSearch from './pages/admin/GlobalSearch';
import Analytics from './pages/admin/Analytics';
import AuditLogs from './pages/admin/AuditLogs';
import ManageGuilds from './pages/admin/ManageGuilds';
import SystemSettings from './pages/admin/SystemSettings';
import BulkOperations from './pages/admin/BulkOperations';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import EventCalendar from './pages/EventCalendar';
import Templates from './pages/Templates';
import CreateTemplate from './pages/CreateTemplate';
import Settings from './pages/Settings';
import PublicEvent from './pages/PublicEvent';
import CompositionTool from './pages/CompositionTool';
import PublicRaidPlan from './pages/PublicRaidPlan';
import Compositions from './pages/Compositions';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/event/:eventId" element={<PublicEvent />} />
      <Route path="/raidplan/:raidPlanId" element={<PublicRaidPlan />} />

      {!user ? (
        <>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Landing />} />
          <Route path="/select-panel" element={<PanelSelect />} />
          <Route path="/a" element={<BotAdminPanel />} />
          <Route path="/a/search" element={<GlobalSearch />} />
          <Route path="/a/analytics" element={<Analytics />} />
          <Route path="/a/audit-logs" element={<AuditLogs />} />
          <Route path="/a/guilds" element={<ManageGuilds />} />
          <Route path="/a/settings" element={<SystemSettings />} />
          <Route path="/a/bulk-operations" element={<BulkOperations />} />
          <Route path="/servers" element={<ServerSelect />} />
          <Route path="/guild/:guildId/dashboard" element={<Dashboard />} />
          <Route path="/guild/:guildId/events" element={<Events />} />
          <Route path="/guild/:guildId/events/:eventId" element={<EventDetails />} />
          <Route path="/guild/:guildId/events/:eventId/composition" element={<CompositionTool />} />
          <Route path="/guild/:guildId/events/create" element={<CreateEvent />} />
          <Route path="/guild/:guildId/events/:eventId/edit" element={<CreateEvent />} />
          <Route path="/guild/:guildId/compositions" element={<Compositions />} />
          <Route path="/guild/:guildId/calendar" element={<EventCalendar />} />
          <Route path="/guild/:guildId/templates" element={<Templates />} />
          <Route path="/guild/:guildId/templates/create" element={<CreateTemplate />} />
          <Route path="/guild/:guildId/templates/:templateId/edit" element={<CreateTemplate />} />
          <Route path="/guild/:guildId/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/servers" replace />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    loadConfig().then(() => {
      const config = getConfig();
      api.setBaseUrl(config.apiBaseUrl);
      setConfigLoaded(true);
    });
  }, []);

  if (!configLoaded) {
    return <div className="loading">Initializing...</div>;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <GuildProvider>
          <ThemeProvider>
            <AppRoutes />
          </ThemeProvider>
        </GuildProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
