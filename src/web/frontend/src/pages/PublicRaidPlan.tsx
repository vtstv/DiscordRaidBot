// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/PublicRaidPlan.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BOT_VERSION } from '@config/version';

interface Participant {
  id: string;
  username: string;
  role?: string;
}

interface Position {
  id: string;
  participantId?: string;
  label?: string;
}

interface Group {
  id: string;
  name: string;
  positions: Position[];
}

interface RaidPlan {
  id: string;
  title: string;
  strategy?: string;
  groups: Group[];
  event?: {
    title: string;
    participants: Participant[];
  };
}

export default function PublicRaidPlan() {
  const { raidPlanId } = useParams<{ raidPlanId: string }>();
  const [raidPlan, setRaidPlan] = useState<RaidPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategyPosition, setStrategyPosition] = useState<'top' | 'bottom'>('top');
  const [isStrategyExpanded, setIsStrategyExpanded] = useState(false);

  useEffect(() => {
    if (raidPlanId) {
      fetch(`/api/raidplans/${raidPlanId}/public`)
        .then(response => response.ok ? response.json() : null)
        .then(data => setRaidPlan(data))
        .finally(() => setLoading(false));
    }
  }, [raidPlanId]);

  const toggleStrategyPosition = () => {
    setStrategyPosition(prev => prev === 'top' ? 'bottom' : 'top');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!raidPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Raid Plan Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">This raid plan may not exist or is not publicly accessible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{raidPlan.title}</h1>
          {raidPlan.event && (
            <p className="text-lg text-gray-600 dark:text-gray-400">{raidPlan.event.title}</p>
          )}
        </div>

        {/* Strategy Position Toggle */}
        {raidPlan.strategy && (
          <div className="mb-2 flex justify-end">
            <button
              onClick={toggleStrategyPosition}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1"
              title="Toggle strategy position"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Strategy {strategyPosition === 'top' ? 'above' : 'below'} groups
            </button>
          </div>
        )}

        {/* Strategy - shown above groups */}
        {raidPlan.strategy && strategyPosition === 'top' && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Strategy
            </h2>
            <div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {isStrategyExpanded || raidPlan.strategy.length <= 200
                    ? raidPlan.strategy
                    : `${raidPlan.strategy.slice(0, 200)}...`}
                </p>
              </div>
              {raidPlan.strategy.length > 200 && (
                <button
                  onClick={() => setIsStrategyExpanded(!isStrategyExpanded)}
                  className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  {isStrategyExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {raidPlan.groups.map(group => (
            <div key={group.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{group.name}</h2>
              <div className="space-y-2">
                {group.positions.map((pos, index) => {
                  const participant = raidPlan.event?.participants.find(p => p.id === pos.participantId);
                  return (
                    <div key={pos.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[20px]">{index + 1}.</span>
                      {participant ? (
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{participant.username}</p>
                          {participant.role && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{participant.role}</p>
                          )}
                        </div>
                      ) : (
                        <p className="flex-1 text-gray-400 dark:text-gray-600 italic">{pos.label || 'Empty slot'}</p>
                      )}
                    </div>
                  );
                })}
                {group.positions.length === 0 && (
                  <div className="p-4 text-center text-gray-400 dark:text-gray-600 text-sm">No positions</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Strategy - shown below groups */}
        {raidPlan.strategy && strategyPosition === 'bottom' && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Strategy
            </h2>
            <div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {isStrategyExpanded || raidPlan.strategy.length <= 200
                    ? raidPlan.strategy
                    : `${raidPlan.strategy.slice(0, 200)}...`}
                </p>
              </div>
              {raidPlan.strategy.length > 200 && (
                <button
                  onClick={() => setIsStrategyExpanded(!isStrategyExpanded)}
                  className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  {isStrategyExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-400 dark:text-gray-600">
            <p>© 2025 <a href="https://github.com/vtstv" target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Murr</a> • RaidBot v{BOT_VERSION}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
