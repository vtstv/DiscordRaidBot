import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  user: any;
  login: () => void;
  logout: () => void;
  passwordAuthEnabled: boolean;
  showPasswordForm: boolean;
  setShowPasswordForm: (show: boolean) => void;
  passwordUsername: string;
  setPasswordUsername: (username: string) => void;
  passwordPassword: string;
  setPasswordPassword: (password: string) => void;
  authError: string;
  isLoading: boolean;
  handlePasswordLogin: (e: React.FormEvent) => void;
  isBotAdmin: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  user,
  login,
  logout,
  passwordAuthEnabled,
  showPasswordForm,
  setShowPasswordForm,
  passwordUsername,
  setPasswordUsername,
  passwordPassword,
  setPasswordPassword,
  authError,
  isLoading,
  handlePasswordLogin,
  isBotAdmin,
}) => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen flex items-center justify-center relative pb-16">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-300/20 dark:bg-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center mb-8 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative p-2 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-3xl shadow-2xl transform group-hover:scale-105 transition-transform duration-300 ring-1 ring-white/30">
              <img src="/logo.png" alt="RaidBot Logo" className="w-32 h-32 object-contain" />
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
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                  >
                    {showPasswordForm ? 'Hide password login' : 'Admin login with password'}
                  </button>

                  {showPasswordForm && (
                    <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                      <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-700 rounded-lg text-blue-700 dark:text-blue-400 text-sm">
                        ℹ️ Password authentication provides access to admin panel only
                      </div>
                      <form onSubmit={handlePasswordLogin} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            value={passwordUsername}
                            onChange={(e) => setPasswordUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-gray-900 dark:text-gray-100"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Password
                          </label>
                          <input
                            type="password"
                            value={passwordPassword}
                            onChange={(e) => setPasswordPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-gray-900 dark:text-gray-100"
                            required
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
            <div className="hidden lg:flex flex-col items-center gap-6">
              <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-16 h-16 rounded-full border-2 border-purple-500"
                  />
                )}
                <div className="text-left">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back!</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{user.username}</p>
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

      {/* Scroll indicator - moved to bottom of section */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};
