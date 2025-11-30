// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/PublicRoll.tsx
// Public roll generator view page

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

interface Roll {
  userId: string;
  username: string;
  rollValue: number;
  rolledAt: string;
}

interface RollGenerator {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'active' | 'closed';
  maxRoll: number;
  showUsernames: boolean;
  maxShown: number;
  maxUsers: number | null;
  uniqueUsers: number;
  totalRolls: number;
  timeRemaining: string | null;
  startTime: Date | null;
  endTime: Date | null;
  rolls: Roll[];
}

export default function PublicRoll() {
  const { rollId } = useParams<{ rollId: string }>();
  const [rollGenerator, setRollGenerator] = useState<RollGenerator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRollGenerator = async () => {
      if (!rollId) return;

      try {
        const response = await fetch(`/api/roll/${rollId}`);
        
        if (!response.ok) {
          throw new Error('Roll generator not found');
        }

        const data = await response.json();
        setRollGenerator(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roll generator');
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    setLoading(true);
    fetchRollGenerator();

    // Auto-refresh every 20 seconds (only data, no page reload)
    const interval = setInterval(() => {
      // Fetch in background without showing loading state
      fetchRollGenerator();
    }, 20000);
    
    return () => clearInterval(interval);
  }, [rollId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading roll generator...</div>
      </div>
    );
  }

  if (error || !rollGenerator) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Roll Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">{error || 'This roll generator does not exist.'}</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">⏳ Pending</span>;
      case 'active':
        return <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✅ Active</span>;
      case 'closed':
        return <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">🔒 Closed</span>;
      default:
        return null;
    }
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {rollGenerator.title}
                </h1>
                <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>
              {rollGenerator.description && (
                <p className="text-gray-600 dark:text-gray-400">{rollGenerator.description}</p>
              )}
            </div>
            <div className="ml-4">
              {getStatusBadge(rollGenerator.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">1-{rollGenerator.maxRoll}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Roll Range</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{rollGenerator.uniqueUsers}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{rollGenerator.totalRolls}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Rolls</div>
            </div>
            {rollGenerator.timeRemaining && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{rollGenerator.timeRemaining}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
              </div>
            )}
          </div>

          {rollGenerator.maxUsers && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Capacity</span>
                <span className="text-gray-900 dark:text-white">{rollGenerator.uniqueUsers}/{rollGenerator.maxUsers}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((rollGenerator.uniqueUsers / rollGenerator.maxUsers) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🎲 Results {rollGenerator.showUsernames ? '' : '(Usernames Hidden)'}
          </h2>

          {rollGenerator.rolls.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">No rolls yet!</p>
          ) : (
            <div className="space-y-2">
              {rollGenerator.rolls.map((roll, index) => (
                <div
                  key={`${roll.userId}-${roll.rollValue}`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl w-8">{getMedalEmoji(index)}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        <a
                          href={`https://discord.com/users/${roll.userId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          @{roll.username}
                        </a>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(roll.rolledAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {roll.rollValue}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 dark:text-gray-400 text-sm">
          <p>Updates automatically every 3 seconds</p>
        </div>
      </div>
    </div>
  );
}
