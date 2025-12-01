import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HamburgerMenuProps {
  user: any;
  login: () => void;
  logout: () => void;
  theme: string;
  toggleTheme: () => void;
  passwordAuthEnabled: boolean;
  showPasswordForm: boolean;
  setShowPasswordForm: (show: boolean) => void;
  isBotAdmin: boolean;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  user,
  login,
  logout,
  theme,
  toggleTheme,
  passwordAuthEnabled,
  showPasswordForm,
  setShowPasswordForm,
  isBotAdmin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={toggleMenu}
        className="fixed top-6 right-6 z-[60] lg:hidden p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all hover:scale-110 border border-gray-200/50 dark:border-gray-700/50"
        aria-label="Menu"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span className={`block h-0.5 bg-gray-800 dark:bg-gray-200 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block h-0.5 bg-gray-800 dark:bg-gray-200 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block h-0.5 bg-gray-800 dark:bg-gray-200 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </div>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] lg:hidden"
          onClick={closeMenu}
        ></div>
      )}

      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl z-[58] transform transition-transform duration-300 lg:hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full p-6 pt-24">
          <div className="flex-1 space-y-4">
            {!user && (
              <>
                <button 
                  onClick={() => {
                    login();
                    closeMenu();
                  }}
                  className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>{t.landing.hero.loginWithDiscord}</span>
                </button>

                <a
                  href="https://discord.com/oauth2/authorize?client_id=1440026223051800718"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all border border-white/20"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>Add to Discord</span>
                </a>

                {passwordAuthEnabled && (
                  <button
                    onClick={() => {
                      setShowPasswordForm(!showPasswordForm);
                      closeMenu();
                    }}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline py-2"
                  >
                    {showPasswordForm ? t.landing.hero.hidePasswordLogin : t.landing.hero.adminLogin}
                  </button>
                )}
              </>
            )}

            {user && (
              <>
                {/* User info */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-12 h-12 rounded-full border-2 border-purple-500"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back!</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.username}</p>
                  </div>
                </div>

                {/* Navigation buttons */}
                <button
                  onClick={() => {
                    navigate('/servers');
                    closeMenu();
                  }}
                  className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <span className="text-xl">📋</span>
                  <span>{t.landing.hero.goToDashboard}</span>
                </button>

                {isBotAdmin && (
                  <button
                    onClick={() => {
                      navigate('/a');
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all"
                  >
                    <span className="text-xl">🔧</span>
                    <span>{t.landing.hero.goToAdminPanel}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-full flex items-center gap-3 px-5 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{t.landing.hero.logout}</span>
                </button>
              </>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center justify-between px-5 py-4 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                <span className="font-semibold text-gray-800 dark:text-gray-200">Theme</span>
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <>
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Light</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Dark</span>
                    </>
                  )}
                </div>
              </button>
              
              <div className="px-5 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <span className="font-semibold text-gray-800 dark:text-gray-200 block mb-2 text-sm">Language</span>
                <LanguageSwitcher compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
