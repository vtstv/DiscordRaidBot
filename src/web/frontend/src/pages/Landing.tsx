// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Landing.tsx
// Landing page for unauthenticated users with sections/slides
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HamburgerMenu } from '../components/landing/HamburgerMenu';
import { DesktopControls } from '../components/landing/DesktopControls';

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

      {/* Desktop controls - theme and language */}
      <DesktopControls theme={theme} toggleTheme={toggleTheme} />

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
