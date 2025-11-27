// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/contexts/GuildContext.tsx
// Guild selection context

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { Guild } from '../services/api';

interface GuildPermissions {
  events: boolean;
  compositions: boolean;
  templates: boolean;
  settings: boolean;
  isManager: boolean;
}

interface GuildContextType {
  selectedGuild: Guild | null;
  setSelectedGuild: (guild: Guild | null) => void;
  permissions: GuildPermissions | null;
  loadingPermissions: boolean;
}

const GuildContext = createContext<GuildContextType | undefined>(undefined);

export function useGuild() {
  const context = useContext(GuildContext);
  if (!context) {
    throw new Error('useGuild must be used within GuildProvider');
  }
  return context;
}

interface GuildProviderProps {
  children: ReactNode;
}

export function GuildProvider({ children }: GuildProviderProps) {
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(() => {
    const stored = localStorage.getItem('selectedGuild');
    return stored ? JSON.parse(stored) : null;
  });
  const [permissions, setPermissions] = useState<GuildPermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    if (selectedGuild) {
      localStorage.setItem('selectedGuild', JSON.stringify(selectedGuild));
      // Fetch permissions for this guild
      setLoadingPermissions(true);
      api.getMyPermissions(selectedGuild.id)
        .then(setPermissions)
        .catch((err) => {
          console.error('Failed to load permissions:', err);
          // Set default permissions (no access) on error
          setPermissions({
            events: false,
            compositions: false,
            templates: false,
            settings: false,
            isManager: false,
          });
        })
        .finally(() => setLoadingPermissions(false));
    } else {
      localStorage.removeItem('selectedGuild');
      setPermissions(null);
    }
  }, [selectedGuild]);

  const value = {
    selectedGuild,
    setSelectedGuild,
    permissions,
    loadingPermissions,
  };

  return <GuildContext.Provider value={value}>{children}</GuildContext.Provider>;
}
