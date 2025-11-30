// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/contexts/ClickModeContext.tsx
// Context for click-based participant assignment on mobile

import { createContext, useContext, useState, ReactNode } from 'react';
import { Participant } from '../types/composition';

interface ClickModeContextType {
  isClickMode: boolean;
  isTouchDevice: boolean;
  forceClickMode: boolean;
  setForceClickMode: (value: boolean) => void;
  selectedParticipant: { participant: Participant; sourceGroupId?: string; sourcePositionId?: string } | null;
  selectParticipant: (participant: Participant, sourceGroupId?: string, sourcePositionId?: string) => void;
  clearSelection: () => void;
  assignToPosition: (groupId: string, positionId: string, onAssign: (participant: Participant, sourceGroupId?: string, sourcePositionId?: string) => void) => void;
}

const ClickModeContext = createContext<ClickModeContextType | undefined>(undefined);

export function ClickModeProvider({ children }: { children: ReactNode }) {
  const [selectedParticipant, setSelectedParticipant] = useState<{ participant: Participant; sourceGroupId?: string; sourcePositionId?: string } | null>(null);
  const [forceClickMode, setForceClickMode] = useState(false);

  // Detect if device is touch-enabled (mobile/tablet)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isClickMode = isTouchDevice || forceClickMode;

  const selectParticipant = (participant: Participant, sourceGroupId?: string, sourcePositionId?: string) => {
    setSelectedParticipant({ participant, sourceGroupId, sourcePositionId });
  };

  const clearSelection = () => {
    setSelectedParticipant(null);
  };

  const assignToPosition = (
    groupId: string,
    positionId: string,
    onAssign: (participant: Participant, sourceGroupId?: string, sourcePositionId?: string) => void
  ) => {
    if (selectedParticipant) {
      onAssign(selectedParticipant.participant, selectedParticipant.sourceGroupId, selectedParticipant.sourcePositionId);
      clearSelection();
    }
  };

  return (
    <ClickModeContext.Provider value={{
      isClickMode,
      isTouchDevice,
      forceClickMode,
      setForceClickMode,
      selectedParticipant,
      selectParticipant,
      clearSelection,
      assignToPosition,
    }}>
      {children}
    </ClickModeContext.Provider>
  );
}

export function useClickMode() {
  const context = useContext(ClickModeContext);
  if (!context) {
    throw new Error('useClickMode must be used within ClickModeProvider');
  }
  return context;
}
