// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/UnassignedPanel.tsx

import { useState } from 'react';
import DraggableParticipant from '../../components/DraggableParticipant';
import { Participant } from '../../types/composition';
import { useI18n } from '../../contexts/I18nContext';

interface UnassignedPanelProps {
  participants: Participant[];
}

export default function UnassignedPanel({ participants }: UnassignedPanelProps) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredParticipants = searchTerm
    ? participants.filter(p =>
        p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : participants;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-4">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
        {t.compositionTool.unassigned} ({participants.length})
      </h2>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.compositionTool.searchParticipants}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {filteredParticipants.map(participant => (
          <DraggableParticipant key={participant.id} participant={participant} />
        ))}
        {filteredParticipants.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">
            {searchTerm ? t.compositionTool.noMatches : t.compositionTool.allAssigned}
          </p>
        )}
      </div>
    </div>
  );
}
