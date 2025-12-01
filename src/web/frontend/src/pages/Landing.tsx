// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Landing.tsx
// Landing page for unauthenticated users with sections/slides
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HamburgerMenu } from '../components/landing/HamburgerMenu';

const API_BASE_URL = window.location.origin;

export default function Landing() {
  const { user, isBotAdmin, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Active section tracking for navigation dots
  const [activeSection, setActiveSection] = useState('hero');
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
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

  // Track active section with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);

    return () => observer.disconnect();
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 transition-colors duration-300 scroll-smooth">
      {/* Hamburger menu for mobile */}
      <HamburgerMenu
        user={user}
        login={login}
        logout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
        passwordAuthEnabled={passwordAuthEnabled}
        showPasswordForm={showPasswordAuth}
        setShowPasswordForm={setShowPasswordAuth}
        isBotAdmin={isBotAdmin}
      />

      {/* Top right buttons - fixed (hidden on mobile) */}
      <div className="fixed top-6 right-6 z-50 hidden lg:flex items-center gap-3">
        {/* Add to Discord button */}
        {!user && (
          <a
            href="https://discord.com/oauth2/authorize?client_id=1440026223051800718"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-white/20"
            title="Add RaidBot to your Discord server"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="hidden sm:inline">Add to Discord</span>
          </a>
        )}
        
        {/* Theme toggle */}
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

      {/* Section navigation dots */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
        <a href="#hero" className="group relative">
          <div className={`w-3 h-3 rounded-full transition-all ${
            activeSection === 'hero'
              ? 'bg-purple-600 dark:bg-purple-400 scale-150'
              : 'bg-gray-400 dark:bg-gray-600 hover:scale-150 hover:bg-purple-600 dark:hover:bg-purple-400'
          }`}></div>
          <span className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Home
          </span>
        </a>
        <a href="#features" className="group relative">
          <div className={`w-3 h-3 rounded-full transition-all ${
            activeSection === 'features'
              ? 'bg-purple-600 dark:bg-purple-400 scale-150'
              : 'bg-gray-400 dark:bg-gray-600 hover:scale-150 hover:bg-purple-600 dark:hover:bg-purple-400'
          }`}></div>
          <span className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Features
          </span>
        </a>
      </div>

      {/* Sections with scroll snap */}
      <div className="snap-y snap-mandatory overflow-y-scroll h-screen">
        {/* Hero Section */}
        <div id="hero" ref={heroRef} className="snap-start">
          <HeroSection
            user={user}
            login={login}
            logout={logout}
            passwordAuthEnabled={passwordAuthEnabled}
            showPasswordForm={showPasswordAuth}
            setShowPasswordForm={setShowPasswordAuth}
            passwordUsername={username}
            setPasswordUsername={setUsername}
            passwordPassword={password}
            setPasswordPassword={setPassword}
            authError={authError}
            isLoading={isLoading}
            handlePasswordLogin={handlePasswordLogin}
            isBotAdmin={isBotAdmin}
          />
        </div>

        {/* Features Section */}
        <div id="features" ref={featuresRef} className="snap-start">
          <FeaturesSection />
        </div>
      </div>
    </div>
  );
}
