// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/Layout.tsx

import { ReactNode } from 'react';
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
  const { selectedGuild } = useGuild();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <div className="layout dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <nav className="sidebar dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
        <div className="sidebar-header dark:border-gray-700">
          <h2 className="dark:text-white font-bold text-xl">{selectedGuild?.name || 'RaidBot'}</h2>
          <button 
            className="mt-2 w-full px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" 
            onClick={() => navigate('/servers')}
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
          >
            <span>📊</span> Dashboard
          </Link>
          <Link 
            to={`/guild/${guildId}/events`} 
            className={`nav-link rounded-lg px-4 py-2 flex items-center gap-3 transition-colors ${
              isActive('events') 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <span>📅</span> Events
          </Link>
          <Link 
            to={`/guild/${guildId}/templates`} 
            className={`nav-link rounded-lg px-4 py-2 flex items-center gap-3 transition-colors ${
              isActive('templates') 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <span>📋</span> Templates
          </Link>
          <Link 
            to={`/guild/${guildId}/settings`} 
            className={`nav-link rounded-lg px-4 py-2 flex items-center gap-3 transition-colors ${
              isActive('settings') 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <span>⚙️</span> Settings
          </Link>
        </div>

        <div className="sidebar-footer dark:border-gray-700 mt-auto p-4 border-t border-gray-200">
          <div className="flex flex-col gap-3">
             <button 
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Light Mode
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Dark Mode
                </>
              )}
            </button>
            
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{user?.username}</span>
              <button 
                className="text-xs px-2 py-1 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" 
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content dark:bg-gray-900 transition-colors duration-200">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
