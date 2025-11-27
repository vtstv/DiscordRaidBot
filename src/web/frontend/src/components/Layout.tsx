// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/Layout.tsx

import { ReactNode, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuild } from '../contexts/GuildContext';
import { useTheme } from '../contexts/ThemeContext';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const { user, logout } = useAuth();
  const { selectedGuild, permissions } = useGuild();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname.includes(path);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Get Discord avatar URL
  const getAvatarUrl = () => {
    if (!user) return null;
    if (user.avatar) {
      // Check if avatar is already a full URL (from backend)
      if (user.avatar.startsWith('http')) {
        return user.avatar;
      }
      // Otherwise construct URL from hash
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    // Default Discord avatar
    const defaultAvatar = parseInt(user.discriminator || '0') % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
  };

  return (
    <div className="layout dark:bg-gray-900 dark:text-white transition-colors duration-200">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="font-bold text-lg">{selectedGuild?.name || 'RaidBot'}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          {getAvatarUrl() && (
            <img
              src={getAvatarUrl()!}
              alt={user?.username}
              className="w-8 h-8 rounded-full"
              onClick={() => {
                if (window.confirm('Are you sure you want to logout?')) {
                  logout();
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } fixed lg:static inset-y-0 left-0 z-40 w-64`}>
        <div className="sidebar-header dark:border-gray-700 flex flex-col gap-3">
          {/* User info with avatar, theme toggle and logout */}
          <div className="hidden lg:flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getAvatarUrl() && (
                <img
                  src={getAvatarUrl()!}
                  alt={user?.username}
                  className="w-10 h-10 rounded-full border-2 border-purple-300 dark:border-purple-600 cursor-pointer flex-shrink-0"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to logout?')) {
                      logout();
                    }
                  }}
                  title={`${user?.username} - Click to logout`}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{user?.username}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
          
          <h2 className="dark:text-white font-bold text-xl hidden lg:block">{selectedGuild?.name || 'RaidBot'}</h2>
          <button 
            className="w-full px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" 
            onClick={() => {
              navigate('/servers');
              closeSidebar();
            }}
          >
            Change Server
          </button>
        </div>
        
        <div className="nav-links space-y-1 p-4">
          <Link 
            to={`/guild/${guildId}/dashboard`} 
            className={`nav-link rounded-lg px-4 py-2 flex items-center gap-3 transition-colors ${
              isActive('dashboard') 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
            onClick={closeSidebar}
          >
            <span>📊</span> Dashboard
          </Link>
          {(permissions?.events || permissions?.isManager) && (
            <Link 
              to={`/guild/${guildId}/events`} 
              className={`nav-link rounded-lg px-4 py-2 flex items-center gap-3 transition-colors ${
                isActive('events') 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={closeSidebar}
            >
              <span>📅</span> Events
            </Link>
          )}
          {(permissions?.compositions || permissions?.isManager) && (
            <Link 
              to={`/guild/${guildId}/compositions`} 
              className={`nav-link rounded-lg px-4 py-2 flex items-center gap-3 transition-colors ${
                isActive('compositions') 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={closeSidebar}
            >
              <span>👥</span> Compositions
            </Link>
          )}
          <Link 
            to={`/guild/${guildId}/calendar`} 
            className={`nav-link rounded-lg px-4 py-2 flex items-center gap-3 transition-colors ${
              isActive('calendar') 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
            onClick={closeSidebar}
          >
            <span>📆</span> Calendar
          </Link>
          {(permissions?.templates || permissions?.isManager) && (
            <Link 
              to={`/guild/${guildId}/templates`} 
              className={`nav-link rounded-lg px-4 py-2 flex items-center gap-3 transition-colors ${
                isActive('templates') 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={closeSidebar}
            >
              <span>📋</span> Templates
            </Link>
          )}
          {(permissions?.settings || permissions?.isManager) && (
            <Link 
              to={`/guild/${guildId}/settings`} 
              className={`nav-link rounded-lg px-4 py-2 flex items-center gap-3 transition-colors ${
                isActive('settings') 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={closeSidebar}
            >
              <span>⚙️</span> Settings
            </Link>
          )}
        </div>

        <div className="sidebar-footer dark:border-gray-700 mt-auto p-4 border-t border-gray-200 lg:hidden">
          {/* Mobile logout button */}
          <button 
            className="w-full px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium" 
            onClick={() => {
              logout();
              closeSidebar();
            }}
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content dark:bg-gray-900 transition-colors duration-200 pt-16 lg:pt-0">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
