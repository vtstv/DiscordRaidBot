// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Dashboard.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import GuildErrorBoundary from '../components/GuildErrorBoundary';
import { useI18n } from '../contexts/I18nContext';

export default function Dashboard() {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (guildId) {
      api.getGuildStats(guildId)
        .then(setStats)
        .catch(err => setError(err))
        .finally(() => setLoading(false));
    }
  }, [guildId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t.dashboard.loadingDashboard}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <GuildErrorBoundary error={error} loading={loading}>
      <DashboardContent stats={stats} guildId={guildId} navigate={navigate} t={t} />
    </GuildErrorBoundary>
  );
}

function DashboardContent({ stats, guildId, navigate, t }: any) {
  return (
    <Layout>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-4 lg:py-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-2 lg:px-4">
          {/* Header - Desktop only */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{t.dashboard.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t.dashboard.subtitle}</p>
          </div>

          {/* Mobile compact title */}
          <div className="lg:hidden mb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h1>
          </div>

          {/* Quick Actions - Desktop only */}
          <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => navigate(`/guild/${guildId}/events/create`)}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-semibold">{t.dashboard.createEvent}</span>
            </button>
            <button
              onClick={() => navigate(`/guild/${guildId}/templates`)}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:scale-105 border border-gray-200 dark:border-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <span className="font-semibold">{t.nav.templates}</span>
            </button>
            <button
              onClick={() => navigate(`/guild/${guildId}/settings`)}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:scale-105 border border-gray-200 dark:border-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-semibold">{t.nav.settings}</span>
            </button>
          </div>

          {/* Mobile Quick Actions - Compact horizontal scroll */}
          <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto pb-2 -mx-2 px-2">
            <button
              onClick={() => navigate(`/guild/${guildId}/events/create`)}
              className="flex-shrink-0 flex flex-col items-center gap-1 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-md active:scale-95 transition-transform min-w-[80px]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-medium whitespace-nowrap">{t.dashboard.createEvent.split(' ')[0]}</span>
            </button>
            <button
              onClick={() => navigate(`/guild/${guildId}/templates`)}
              className="flex-shrink-0 flex flex-col items-center gap-1 p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm active:scale-95 transition-transform border border-gray-200 dark:border-gray-700 min-w-[80px]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <span className="text-xs font-medium whitespace-nowrap">{t.nav.templates}</span>
            </button>
            <button
              onClick={() => navigate(`/guild/${guildId}/settings`)}
              className="flex-shrink-0 flex flex-col items-center gap-1 p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm active:scale-95 transition-transform border border-gray-200 dark:border-gray-700 min-w-[80px]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium whitespace-nowrap">{t.nav.settings}</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t.dashboard.stats.totalEvents}</h3>
              <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalEvents || 0}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t.dashboard.stats.activeEvents}</h3>
              <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats?.activeEvents || 0}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t.dashboard.stats.templates}</h3>
              <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalTemplates || 0}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="p-2 sm:p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t.dashboard.stats.totalParticipants}</h3>
              <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalParticipants || 0}</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 transition-colors duration-200">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-3 lg:mb-4">{t.dashboard.quickAccess}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
              <button
                onClick={() => navigate(`/guild/${guildId}/events`)}
                className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg lg:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-98 transition-all text-left"
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="p-1.5 lg:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">{t.dashboard.quickActions.viewAllEvents}</div>
                    <div className="hidden lg:block text-sm text-gray-600 dark:text-gray-400">{t.dashboard.quickActions.viewAllEventsDesc}</div>
                  </div>
                </div>
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => navigate(`/guild/${guildId}/calendar`)}
                className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg lg:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-98 transition-all text-left"
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="p-1.5 lg:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">{t.dashboard.quickActions.eventCalendar}</div>
                    <div className="hidden lg:block text-sm text-gray-600 dark:text-gray-400">{t.dashboard.quickActions.eventCalendarDesc}</div>
                  </div>
                </div>
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
