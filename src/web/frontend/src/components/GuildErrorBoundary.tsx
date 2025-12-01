// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/GuildErrorBoundary.tsx
// Error boundary for guild pages

import { useEffect, useState, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BotNotInGuildError from './BotNotInGuildError';
import { ApiError } from '../services/api';

interface GuildErrorBoundaryProps {
  children: ReactNode;
  error?: Error | null;
  loading?: boolean;
}

export default function GuildErrorBoundary({ children, error, loading }: GuildErrorBoundaryProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const [displayError, setDisplayError] = useState<ApiError | Error | null>(null);

  useEffect(() => {
    setDisplayError(error || null);
  }, [error]);

  // If loading, show children (which should handle loading state)
  if (loading) {
    return <>{children}</>;
  }

  // If ApiError with "Bot Not In Guild" code or 404 status
  if (displayError instanceof ApiError) {
    if (displayError.code === 'Bot Not In Guild' || displayError.status === 404) {
      return (
        <BotNotInGuildError
          guildName={displayError.guildName}
          message={displayError.message}
        />
      );
    }
  }

  // If no error, render children
  if (!displayError) {
    return <>{children}</>;
  }

  // Generic error fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-200 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-lg text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Error
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          {displayError.message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/servers')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Servers
          </button>
        </div>
      </div>
    </div>
  );
}
