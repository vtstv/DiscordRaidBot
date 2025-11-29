// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Landing.tsx
// Landing page for unauthenticated users
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@config/api';

export default function Landing() {
  const { user, isBotAdmin, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Password auth state
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);
  const [passwordAuthEnabled, setPasswordAuthEnabled] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if password auth is enabled
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/config`)
      .then(res => res.json())
      .then(data => {
        setPasswordAuthEnabled(data.passwordAuthEnabled || false);
      })
      .catch(() => {
        setPasswordAuthEnabled(false);
      });
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        // Password auth redirects to admin panel only
        window.location.href = '/a';
      } else {
        const error = await response.json();
        setAuthError(error.error || 'Invalid credentials');
      }
    } catch (error) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 transition-colors duration-200">
      {/* Theme toggle button in top right corner */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200 dark:border-gray-700"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

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
              <div className="flex flex-col items-center gap-6">
                {/* Discord OAuth Login */}
                <button 
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
                  onClick={login}
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Login with Discord
                </button>

                {/* Password Auth Toggle */}
                {passwordAuthEnabled && (
                  <>
                    <button
                      onClick={() => setShowPasswordAuth(!showPasswordAuth)}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {showPasswordAuth ? '← Back to Discord Login' : 'Or login with password →'}
                    </button>

                    {/* Password Login Form */}
                    {showPasswordAuth && (
                      <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Admin Login</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
                          Password authentication provides access to admin panel only
                        </p>
                        <form onSubmit={handlePasswordLogin} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Username
                            </label>
                            <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                              placeholder="Enter username"
                              required
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Password
                            </label>
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                              placeholder="Enter password"
                              required
                              disabled={isLoading}
                            />
                          </div>
                          {authError && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                              {authError}
                            </div>
                          )}
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Logging in...' : 'Login'}
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>
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
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">Powerful Features</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto">
          Everything you need to organize and manage Discord events professionally
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Event Scheduling */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">📅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Event Scheduling</h3>
            <p className="text-gray-600 dark:text-gray-400">Create events with custom dates, times, timezones, and participant limits. Calendar view included!</p>
          </div>

          {/* Participant Management */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart Participant System</h3>
            <p className="text-gray-600 dark:text-gray-400">Role-based signup, waitlists, bench overflow, and participant notes for better organization</p>
          </div>

          {/* Event Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Event Templates</h3>
            <p className="text-gray-600 dark:text-gray-400">Save time with reusable templates including roles, limits, and custom configurations</p>
          </div>

          {/* Reminders & Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">🔔</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Reminders & DMs</h3>
            <p className="text-gray-600 dark:text-gray-400">Automatic reminders before events, DM notifications, and configurable reminder intervals</p>
          </div>

          {/* Statistics & Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Statistics & Leaderboards</h3>
            <p className="text-gray-600 dark:text-gray-400">Track participation, no-shows, auto-roles for top participants, and detailed analytics</p>
          </div>

          {/* Voice Channels */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">🎙️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Auto Voice Channels</h3>
            <p className="text-gray-600 dark:text-gray-400">Automatic voice channel creation and cleanup with participant restrictions</p>
          </div>

          {/* Threads & Organization */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/50 dark:to-cyan-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Thread Management</h3>
            <p className="text-gray-600 dark:text-gray-400">Auto-create event threads for discussions, with cleanup and archiving options</p>
          </div>

          {/* Multi-language Support */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/50 dark:to-pink-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">🌍</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Multi-language</h3>
            <p className="text-gray-600 dark:text-gray-400">Support for English and Russian with easy extensibility for more languages</p>
          </div>

          {/* Web Dashboard */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">🌐</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Web Dashboard</h3>
            <p className="text-gray-600 dark:text-gray-400">Full-featured web interface with dark mode, calendar view, and mobile support</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 mt-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 RaidBot. Created by{' '}
              <a
                href="https://github.com/vtstv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                Murr
              </a>
            </div>
            <div className="text-gray-500 dark:text-gray-500 text-sm">
              Version 1.0.0
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
