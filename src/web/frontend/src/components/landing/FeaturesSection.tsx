export const FeaturesSection: React.FC = () => {
  return (
    <section className="min-h-screen flex items-center justify-center py-12 pb-16 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-indigo-950/30 dark:to-purple-950/30 transition-colors duration-300">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-3">
            Powerful Features
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Everything you need to organize and manage Discord events at scale
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Event Scheduling */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-2xl sm:text-3xl">📅</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Event Scheduling</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Create events with custom dates, times, timezone support, and participant limits. Calendar view included!</p>
          </div>

          {/* Participant Management */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-2xl sm:text-3xl">👥</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Smart Participants</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Role-based signup, waitlists, bench overflow, and participant notes for better organization</p>
          </div>

          {/* Event Templates */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-2xl sm:text-3xl">📋</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Event Templates</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Save time with reusable templates including roles, limits, and custom configurations</p>
          </div>

          {/* Reminders & Notifications */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-2xl sm:text-3xl">🔔</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Reminders & DMs</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Automatic reminders before events, DM notifications, and configurable reminder intervals</p>
          </div>

          {/* Statistics & Analytics */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-2xl sm:text-3xl">📊</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Statistics & Leaderboards</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Track participation, no-shows, auto-roles for top participants, and detailed analytics</p>
          </div>

          {/* Voice Channels */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-2xl sm:text-3xl">🎙️</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Auto Voice Channels</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Automatic voice channel creation and cleanup with participant restrictions</p>
          </div>

          {/* Threads & Organization */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-2xl sm:text-3xl">💬</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Thread Management</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Auto-create event threads for discussions, with cleanup and archiving options</p>
          </div>

          {/* Multi-language Support */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-2xl sm:text-3xl">🌍</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Multi-language</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Support for English and Russian with easy extensibility for more languages</p>
          </div>

          {/* Web Dashboard */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-2xl sm:text-3xl">🌐</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Web Dashboard</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Full-featured web interface with dark mode, calendar view, and mobile support</p>
          </div>
        </div>
      </div>
    </section>
  );
};
