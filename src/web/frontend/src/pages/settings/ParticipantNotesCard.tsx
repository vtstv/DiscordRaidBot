// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/settings/ParticipantNotesCard.tsx
// Participant Notes settings card

import { GuildSettings, DiscordChannel } from '../../services/api';
import { InfoIcon } from './icons';

interface ParticipantNotesCardProps {
  settings: GuildSettings;
  setSettings: (settings: GuildSettings) => void;
  channels: DiscordChannel[];
}

export default function ParticipantNotesCard({ settings, setSettings, channels }: ParticipantNotesCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Participant Notes</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow participant notes</span>
            <input
              type="checkbox"
              checked={settings.allowParticipantNotes || false}
              onChange={e => setSettings({...settings, allowParticipantNotes: e.target.checked})}
              className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-purple-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Show 'View online' button</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Display link to public event view in Discord messages</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showViewOnlineButton !== false}
              onChange={e => setSettings({...settings, showViewOnlineButton: e.target.checked})}
              className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-purple-500"
            />
          </label>

          {settings.allowParticipantNotes && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  Max note length
                  <InfoIcon onClick={() => alert('Maximum characters allowed in participant notes (default: 30)')} />
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={settings.participantNoteMaxLength || 30}
                  onChange={e => setSettings({...settings, participantNoteMaxLength: e.target.value ? parseInt(e.target.value) : 30})}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  Note channels
                  <InfoIcon onClick={() => alert('Channels where participants can add notes to their signups. If empty, notes are allowed in all channels.')} />
                </label>
                <div className="space-y-2">
                  {/* Current note channels list */}
                  {(settings.noteChannels || []).length > 0 && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current channels:</div>
                      <div className="flex flex-wrap gap-2">
                        {(settings.noteChannels || []).map(channelId => {
                          const channel = channels.find(c => c.id === channelId);
                          return (
                            <span key={channelId} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full">
                              #{channel?.name || 'Unknown'}
                              <button
                                type="button"
                                onClick={() => {
                                  const current = settings.noteChannels || [];
                                  setSettings({...settings, noteChannels: current.filter(id => id !== channelId)});
                                }}
                                className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add channel */}
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      defaultValue=""
                    >
                      <option value="" disabled>Select channel to add</option>
                      {channels
                        .filter(channel => !(settings.noteChannels || []).includes(channel.id))
                        .map(channel => (
                          <option key={channel.id} value={channel.id}>
                            # {channel.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={(e) => {
                        const select = e.currentTarget.previousElementSibling as HTMLSelectElement;
                        const channelId = select.value;
                        if (channelId) {
                          const current = settings.noteChannels || [];
                          setSettings({...settings, noteChannels: [...current, channelId]});
                          select.value = '';
                        }
                      }}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Clear all button */}
                  {(settings.noteChannels || []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSettings({...settings, noteChannels: []})}
                      className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 rounded-xl transition-colors text-sm"
                    >
                      Clear all channels
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
