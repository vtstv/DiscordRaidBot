// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/App.tsx
// Main application component

import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GuildProvider } from './contexts/GuildContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './contexts/I18nContext';
import { loadConfig, getConfig } from './config';
import { api } from './services/api';

// Lazy load pages for code splitting
const Landing = lazy(() => import('./pages/Landing'));
const ServerSelect = lazy(() => import('./pages/ServerSelect'));
const PanelSelect = lazy(() => import('./pages/PanelSelect'));
const BotAdminPanel = lazy(() => import('./pages/BotAdminPanel'));
const GlobalSearch = lazy(() => import('./pages/admin/GlobalSearch'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const ManageGuilds = lazy(() => import('./pages/admin/ManageGuilds'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const BulkOperations = lazy(() => import('./pages/admin/BulkOperations'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Events = lazy(() => import('./pages/Events'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const EventCalendar = lazy(() => import('./pages/EventCalendar'));
const Templates = lazy(() => import('./pages/Templates'));
const CreateTemplate = lazy(() => import('./pages/CreateTemplate'));
const Settings = lazy(() => import('./pages/Settings'));
const PublicEvent = lazy(() => import('./pages/PublicEvent'));
const CompositionTool = lazy(() => import('./pages/CompositionTool'));
const PublicRaidPlan = lazy(() => import('./pages/PublicRaidPlan'));
const PublicRoll = lazy(() => import('./pages/PublicRoll'));
const Compositions = lazy(() => import('./pages/Compositions'));

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <Routes>
        {/* Public routes */}
        <Route path="/event/:eventId" element={<PublicEvent />} />
        <Route path="/raidplan/:raidPlanId" element={<PublicRaidPlan />} />
        <Route path="/roll/:rollId" element={<PublicRoll />} />

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
    </Suspense>
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
      <I18nProvider>
        <AuthProvider>
          <GuildProvider>
            <ThemeProvider>
              <AppRoutes />
            </ThemeProvider>
          </GuildProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
