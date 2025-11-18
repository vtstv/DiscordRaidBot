import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

interface Analytics {
  totalGuilds: number;
  totalEvents: number;
  totalTemplates: number;
  totalParticipants: number;
  activeEvents: number;
  scheduledEvents: number;
  completedEvents: number;
  eventsByMonth: Array<{ month: string; count: number }>;
  topGuilds: Array<{ name: string; eventCount: number }>;
  participationRate: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-3xl font-bold text-white">System Analytics</h1>
          <p className="text-purple-200 mt-2">System-wide statistics and metrics</p>
        </div>

        {analytics && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Guilds</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalGuilds}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Events</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Participants</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalParticipants}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Active Events</p>
                    <p className="text-2xl font-bold text-white">{analytics.activeEvents}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-6">Event Status Breakdown</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Scheduled</span>
                      <span>{analytics.scheduledEvents}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${(analytics.scheduledEvents / analytics.totalEvents) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Active</span>
                      <span>{analytics.activeEvents}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${(analytics.activeEvents / analytics.totalEvents) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Completed</span>
                      <span>{analytics.completedEvents}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div 
                        className="bg-gray-500 h-3 rounded-full transition-all"
                        style={{ width: `${(analytics.completedEvents / analytics.totalEvents) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-6">Top Active Guilds</h2>
                {analytics.topGuilds && analytics.topGuilds.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topGuilds.slice(0, 5).map((guild, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-white font-medium">{guild.name}</span>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                          {guild.eventCount} events
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    No guild data available
                  </div>
                )}
              </div>
            </div>

            {/* Participation Rate */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Overall Participation Rate</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-white/10 rounded-full h-6">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all"
                      style={{ width: `${analytics.participationRate || 0}%` }}
                    >
                      {analytics.participationRate?.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{analytics.participationRate?.toFixed(1)}%</p>
                  <p className="text-sm text-gray-400">Average participation</p>
                </div>
              </div>
            </div>
          </>
        )}
        <Footer />
      </div>
    </div>
  );
}
