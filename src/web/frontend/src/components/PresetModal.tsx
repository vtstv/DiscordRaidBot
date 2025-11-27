// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/PresetModal.tsx

import { useState, useEffect } from 'react';

interface Preset {
  id: string;
  name: string;
  description?: string;
  groups: any;
}

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (groups: any) => void;
  onSave: (name: string, description: string) => void;
  guildId: string;
}

export default function PresetModal({ isOpen, onClose, onLoad, onSave, guildId }: PresetModalProps) {
  const [mode, setMode] = useState<'load' | 'save'>('load');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && mode === 'load') {
      loadPresets();
    }
  }, [isOpen, mode]);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/composition-presets?guildId=${guildId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPresets(data);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = () => {
    const preset = presets.find(p => p.id === selectedPreset);
    if (preset) {
      onLoad(preset.groups);
      onClose();
    }
  };

  const handleSave = () => {
    if (saveName.trim()) {
      onSave(saveName, saveDescription);
      setSaveName('');
      setSaveDescription('');
      onClose();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this preset?')) return;
    
    try {
      await fetch(`/api/composition-presets/${id}?guildId=${guildId}`, { 
        method: 'DELETE',
        credentials: 'include',
      });
      loadPresets();
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Composition Profiles</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Save your current Composition into a profile and load it later. The profiles are saved so that other managers of this server can use them as well.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => setMode('save')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                mode === 'save'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Save Profile
            </button>
            <button
              onClick={() => setMode('load')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                mode === 'load'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Load Profile
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {mode === 'save' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter a profile name..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading presets...</div>
              ) : presets.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No presets found. Save one first!</div>
              ) : (
                presets.map(preset => (
                  <div
                    key={preset.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedPreset === preset.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                    }`}
                    onClick={() => setSelectedPreset(preset.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">{preset.name}</h3>
                        {preset.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{preset.description}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {preset.groups.length} groups • {preset.groups.reduce((sum: number, g: any) => sum + g.positions.length, 0)} positions
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(preset.id);
                        }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            Cancel
          </button>
          {mode === 'save' ? (
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          ) : (
            <button
              onClick={handleLoad}
              disabled={!selectedPreset}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
