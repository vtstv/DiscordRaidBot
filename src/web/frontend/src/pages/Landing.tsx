// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Landing.tsx
// Landing page for unauthenticated users
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@config/api';
import { WEB_VERSION } from '../../../../config/version.js';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 transition-colors duration-300">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-300/20 dark:bg-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Theme toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all hover:scale-110 border border-gray-200/50 dark:border-gray-700/50 group"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5 text-amber-500 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 sm:pt-32 sm:pb-24">
          <div className="text-center relative z-10">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-8 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative p-5 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-3xl shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
            </div>
            
            {/* Heading */}
            <h1 className="text-7xl sm:text-8xl font-black mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-400 dark:via-pink-400 dark:to-rose-400">
                RaidBot
              </span>
            </h1>
            
            <p className="text-2xl sm:text-3xl text-gray-800 dark:text-gray-200 font-bold mb-4 max-w-4xl mx-auto leading-snug">
              Next-Generation Event Management for Discord
            </p>
            
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Powerful, flexible, and intuitive. Organize raids, events, and activities with advanced scheduling, templates, and participant management.
            </p>
            
            {!user ? (
              <div className="flex flex-col items-center gap-5">
                {/* Discord OAuth Login */}
                <button 
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/40 dark:hover:shadow-purple-700/40 transition-all duration-300 overflow-hidden"
                  onClick={login}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-rose-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg className="w-7 h-7 relative z-10 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span className="relative z-10 group-hover:tracking-wide transition-all">Login with Discord</span>
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
      <div className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Everything you need to organize and manage Discord events at scale
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Event Scheduling */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">📅</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Event Scheduling</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Create events with custom dates, times, timezone support, and participant limits. Calendar view included!</p>
          </div>

          {/* Participant Management */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">👥</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Smart Participants</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Role-based signup, waitlists, bench overflow, and participant notes for better organization</p>
          </div>

          {/* Event Templates */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Event Templates</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Save time with reusable templates including roles, limits, and custom configurations</p>
          </div>

          {/* Reminders & Notifications */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">🔔</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Reminders & DMs</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Automatic reminders before events, DM notifications, and configurable reminder intervals</p>
          </div>

          {/* Statistics & Analytics */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">📊</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Statistics & Leaderboards</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Track participation, no-shows, auto-roles for top participants, and detailed analytics</p>
          </div>

          {/* Voice Channels */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">🎙️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Auto Voice Channels</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Automatic voice channel creation and cleanup with participant restrictions</p>
          </div>

          {/* Threads & Organization */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Thread Management</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Auto-create event threads for discussions, with cleanup and archiving options</p>
          </div>

          {/* Multi-language Support */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">🌍</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Multi-language</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Support for English and Russian with easy extensibility for more languages</p>
          </div>

          {/* Web Dashboard */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-4xl">🌐</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Web Dashboard</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Full-featured web interface with dark mode, calendar view, and mobile support</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200/50 dark:border-gray-700/50 py-12 mt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  © 2025 RaidBot
                </div>
                <div className="text-xs">
                  Made with <span className="text-red-500">❤️</span> by{' '}
                  <a
                    href="https://github.com/vtstv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold hover:underline transition-colors"
                  >
                    Murr
                  </a>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-sm text-gray-500 dark:text-gray-500 font-medium">
                v{WEB_VERSION}
              </div>
              <a
                href="https://github.com/vtstv/DiscordRaidBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                title="View on GitHub"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
