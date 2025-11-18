// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/contexts/GuildContext.tsx
// Guild selection context

import { createContext, useContext, useState, ReactNode } from 'react';
import { Guild } from '../services/api';

interface GuildContextType {
  selectedGuild: Guild | null;
  setSelectedGuild: (guild: Guild | null) => void;
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
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);

  const value = {
    selectedGuild,
    setSelectedGuild,
  };

  return <GuildContext.Provider value={value}>{children}</GuildContext.Provider>;
}
