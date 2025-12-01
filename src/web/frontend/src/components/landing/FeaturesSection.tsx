import { LandingFooter } from './LandingFooter';
import { useI18n } from '../../contexts/I18nContext';

export const FeaturesSection: React.FC = () => {
  const { t } = useI18n();
  
  return (
    <section className="min-h-screen flex flex-col justify-center pt-6 pb-0 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-indigo-950/30 dark:to-purple-950/30 transition-colors duration-300">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex-grow flex flex-col justify-center">
        <div className="text-center mb-5">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2">
            {t.landing.features.title}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t.landing.features.subtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Event Scheduling */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-xl sm:text-2xl">📅</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">{t.landing.features.eventScheduling.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.landing.features.eventScheduling.description}</p>
          </div>

          {/* Participant Management */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-xl sm:text-2xl">👥</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">{t.landing.features.smartParticipants.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.landing.features.smartParticipants.description}</p>
          </div>

          {/* Event Templates */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-xl sm:text-2xl">📋</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">{t.landing.features.eventTemplates.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.landing.features.eventTemplates.description}</p>
          </div>

          {/* Reminders & Notifications */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-xl sm:text-2xl">🔔</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">{t.landing.features.reminders.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.landing.features.reminders.description}</p>
          </div>

          {/* Statistics & Analytics */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-xl sm:text-2xl">📊</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">{t.landing.features.statistics.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.landing.features.statistics.description}</p>
          </div>

          {/* Voice Channels */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-xl sm:text-2xl">🎙️</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">{t.landing.features.voiceChannels.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.landing.features.voiceChannels.description}</p>
          </div>

          {/* Threads & Organization */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-xl sm:text-2xl">💬</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">{t.landing.features.threads.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.landing.features.threads.description}</p>
          </div>

          {/* Multi-language Support */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-xl sm:text-2xl">🌍</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">{t.landing.features.multiLanguage.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.landing.features.multiLanguage.description}</p>
          </div>

          {/* Web Dashboard */}
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <span className="text-xl sm:text-2xl">🌐</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">{t.landing.features.webDashboard.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.landing.features.webDashboard.description}</p>
          </div>
        </div>
      </div>

      {/* Footer - desktop only on desktop, always visible on mobile */}
      <div className="hidden lg:block">
        <LandingFooter />
      </div>
      <div className="lg:hidden">
        <LandingFooter />
      </div>
    </section>
  );
};
