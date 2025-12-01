// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/BotNotInGuildError.tsx
// Component for "Bot not in guild" error

import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';

interface BotNotInGuildErrorProps {
  guildName?: string;
  message?: string;
}

export default function BotNotInGuildError({ guildName, message }: BotNotInGuildErrorProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const inviteBot = () => {
    // Get client ID from window.ENV (injected by backend)
    const clientId = (window as any).ENV?.DISCORD_CLIENT_ID;
    if (!clientId) {
      console.error('Discord client ID not available');
      return;
    }
    
    const permissions = '8'; // Administrator permission
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
    window.open(inviteUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-200 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-lg text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {t.errors?.botNotInGuild?.title || 'Bot Not In Guild'}
        </h2>

        {/* Guild Name */}
        {guildName && (
          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4">
            {guildName}
          </p>
        )}

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          {message || t.errors?.botNotInGuild?.message || 'The bot is not present in this guild. Please invite the bot to use the dashboard.'}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={inviteBot}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 font-semibold"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            {t.errors?.botNotInGuild?.inviteButton || 'Invite Bot'}
          </button>

          <button
            onClick={() => navigate('/servers')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all hover:scale-105 border border-gray-200 dark:border-gray-600 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.errors?.botNotInGuild?.backButton || 'Back to Servers'}
          </button>
        </div>
      </div>
    </div>
  );
}
