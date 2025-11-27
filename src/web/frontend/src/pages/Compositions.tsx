// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Compositions.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Event } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import { useI18n } from '../contexts/I18nContext';

interface RaidPlan {
  id: string;
  eventId: string;
  title: string;
  groups: any;
}

interface EventWithComposition extends Event {
  raidPlan?: RaidPlan;
}

export default function Compositions() {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [events, setEvents] = useState<EventWithComposition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guildId) {
      loadCompositions();
    }
  }, [guildId]);

  const loadCompositions = async () => {
    try {
      // Get events with raid plans using optimized endpoint
      const response = await fetch(`/api/raidplans/guild/${guildId}/events-with-plans`, {
        credentials: 'include',
      });

      if (response.ok) {
        const eventsWithPlans = await response.json();
        setEvents(eventsWithPlans);
      } else {
        console.error('Failed to load compositions:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to load compositions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGroupStats = (groups: any[]) => {
    if (!groups || !Array.isArray(groups)) return { total: 0, filled: 0 };
    
    let total = 0;
    let filled = 0;
    
    groups.forEach(group => {
      if (group.positions && Array.isArray(group.positions)) {
        total += group.positions.length;
        filled += group.positions.filter((p: any) => p.participantId).length;
      }
    });
    
    return { total, filled };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t.compositions.loading}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.compositions.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.compositions.eventsWithPlans}
          </p>
        </div>

        {/* Compositions list */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t.compositions.noCompositions}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.compositions.noCompositionsDesc}
            </p>
            <button
              onClick={() => navigate(`/guild/${guildId}/events`)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              {t.compositions.viewEvents}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => {
              const stats = getGroupStats(event.raidPlan?.groups || []);
              const fillPercentage = stats.total > 0 ? Math.round((stats.filled / stats.total) * 100) : 0;
              
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden"
                  onClick={() => navigate(`/guild/${guildId}/events/${event.id}/composition`)}
                >
                  {/* Event header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(event.startTime).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Composition stats */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t.compositions.slotsFilled}
                      </span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {stats.filled} / {stats.total}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                        style={{ width: `${fillPercentage}%` }}
                      ></div>
                    </div>

                    {/* Groups count */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>
                        {event.raidPlan?.groups?.length || 0} {t.compositions.groups}
                      </span>
                    </div>

                    {/* Composition title if different from event */}
                    {event.raidPlan?.title && event.raidPlan.title !== event.title && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                          "{event.raidPlan.title}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <button className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                      {t.compositions.viewComposition} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </Layout>
  );
}
