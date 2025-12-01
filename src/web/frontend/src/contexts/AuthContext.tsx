// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/contexts/AuthContext.tsx
// Authentication context

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { DiscordUser, Guild } from '../services/api';

interface AuthContextType {
  user: DiscordUser | null;
  adminGuilds: Guild[];
  isBotAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [adminGuilds, setAdminGuilds] = useState<Guild[]>([]);
  const [isBotAdmin, setIsBotAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMe();
      setUser(data.user);
      setAdminGuilds(data.adminGuilds || []);
      setIsBotAdmin(data.isBotAdmin || false);
    } catch (err: any) {
      setUser(null);
      setAdminGuilds([]);
      setIsBotAdmin(false);
      // Don't set error or log for 401 (not authenticated) - this is expected on first load
      if (err?.status !== 401) {
        console.error('Failed to refresh user:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = () => {
    window.location.href = '/auth/login';
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      setAdminGuilds([]);
      setIsBotAdmin(false);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const value = {
    user,
    adminGuilds,
    isBotAdmin,
    loading,
    error,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
