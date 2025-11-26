// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Landing.tsx
// Landing page for unauthenticated users
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const { user, isBotAdmin, login, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 transition-colors duration-200">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl mb-8">
              <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            
            <h1 className="text-6xl font-extrabold text-gray-900 dark:text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              RaidBot
            </h1>
            <p className="text-2xl text-gray-700 dark:text-gray-300 font-semibold mb-4 max-w-3xl mx-auto">
              Professional Discord Event Management System
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Organize raids, events, and activities with ease. Manage participants,
              templates, and schedules all in one place.
            </p>
            
            {!user ? (
              <button 
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
                onClick={login}
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Login with Discord
              </button>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  {user.avatar && (
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      className="w-16 h-16 rounded-full border-4 border-purple-200 dark:border-purple-900 shadow-md"
                    />
                  )}
                  <div className="text-left">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user.username}!</p>
                    {isBotAdmin && (
                      <span className="inline-block mt-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold rounded-full">
                        ⚡ Bot Administrator
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <button 
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    onClick={() => navigate('/servers')}
                  >
                    📋 Select Server
                  </button>
                  
                  {isBotAdmin && (
                    <button 
                      className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                      onClick={() => navigate('/select-panel')}
                    >
                      🔧 Admin Panel
                    </button>
                  )}
                  
                  <button 
                    className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-lg transition-all"
                    onClick={logout}
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">Powerful Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">📅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Event Scheduling</h3>
            <p className="text-gray-600 dark:text-gray-400">Create and manage events with customizable dates, times, and participant limits</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Participant Management</h3>
            <p className="text-gray-600 dark:text-gray-400">Track signups, manage roles, and organize participants efficiently</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Event Templates</h3>
            <p className="text-gray-600 dark:text-gray-400">Save time with reusable templates for recurring events</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">🔔</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Reminders</h3>
            <p className="text-gray-600 dark:text-gray-400">Automatic reminders before events start to keep everyone informed</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/50 dark:to-pink-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">⚙️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Flexible Configuration</h3>
            <p className="text-gray-600 dark:text-gray-400">Customize settings per server with role-based permissions</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Statistics</h3>
            <p className="text-gray-600 dark:text-gray-400">Track event participation and server activity with detailed stats</p>
          </div>
        </div>
      </div>
    </div>
  );
}
