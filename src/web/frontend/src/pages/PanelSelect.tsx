import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

export default function PanelSelect() {
  const navigate = useNavigate();
  const { user, isBotAdmin, adminGuilds, loading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    // Redirect if not bot admin (only after loading completes)
    if (!loading && !isBotAdmin) {
      if (adminGuilds && adminGuilds.length > 0) {
        navigate('/servers');
      } else {
        navigate('/');
      }
    }
  }, [loading, isBotAdmin, adminGuilds, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.common?.loading || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not bot admin, redirect will happen via useEffect
  // Show a temporary loading state while redirect happens
  if (!isBotAdmin || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            {t.panelSelect.welcome.replace('{username}', user.username)}
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            {t.panelSelect.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Bot Admin Panel */}
          <div
            onClick={() => navigate('/a')}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t.panelSelect.botAdminPanel}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t.panelSelect.botAdminDescription}
              </p>
              <ul className="text-left text-gray-700 dark:text-gray-300 space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2 font-bold">✓</span>
                  <span>{t.panelSelect.botAdminFeature1}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2 font-bold">✓</span>
                  <span>{t.panelSelect.botAdminFeature2}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2 font-bold">✓</span>
                  <span>{t.panelSelect.botAdminFeature3}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2 font-bold">✓</span>
                  <span>{t.panelSelect.botAdminFeature4}</span>
                </li>
              </ul>
              <div className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold group-hover:shadow-lg transition-shadow">
                {t.panelSelect.openBotAdmin}
              </div>
            </div>
          </div>

          {/* Guild Admin Panel */}
          <div
            onClick={() => navigate('/servers')}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t.panelSelect.guildAdminPanel}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t.panelSelect.guildAdminDescription}
              </p>
              <ul className="text-left text-gray-700 dark:text-gray-300 space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2 font-bold">✓</span>
                  <span>{t.panelSelect.guildAdminFeature1}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2 font-bold">✓</span>
                  <span>{t.panelSelect.guildAdminFeature2}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2 font-bold">✓</span>
                  <span>{t.panelSelect.guildAdminFeature3}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2 font-bold">✓</span>
                  <span>{t.panelSelect.guildAdminFeature4}</span>
                </li>
              </ul>
              <div className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold group-hover:shadow-lg transition-shadow">
                {t.panelSelect.chooseServer}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
          >
            {t.panelSelect.backToHome}
          </button>
        </div>
      </div>
    </div>
  );
}
