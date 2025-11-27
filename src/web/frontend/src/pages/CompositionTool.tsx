// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/CompositionTool.tsx
// Simplified raid composition tool (drag-and-drop can be added later with @dnd-kit)

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

interface Participant {
  id: string;
  userId: string;
  username: string;
  role?: string;
  spec?: string;
}

interface Position {
  id: string;
  participantId?: string;
  label?: string;
}

interface Group {
  id: string;
  name: string;
  positions: Position[];
}

interface RaidPlan {
  id: string;
  eventId: string;
  title: string;
  groups: Group[];
  event?: {
    title: string;
    participants: Participant[];
  };
}

export default function CompositionTool() {
  const { guildId, eventId } = useParams<{ guildId: string; eventId: string }>();
  const navigate = useNavigate();
  const [raidPlan, setRaidPlan] = useState<RaidPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRaidPlan();
  }, [guildId, eventId]);

  const loadRaidPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/raidplans/event/${eventId}?guildId=${guildId}`);
      
      if (response.status === 404) {
        const createResponse = await fetch('/api/raidplans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, guildId, createdBy: 'current-user' }),
        });
        
        if (createResponse.ok) {
          const newPlan = await createResponse.json();
          setRaidPlan(newPlan);
        }
      } else if (response.ok) {
        const plan = await response.json();
        setRaidPlan(plan);
      }
    } catch (error) {
      console.error('Error loading raid plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRaidPlan = async (updatedGroups: Group[]) => {
    if (!raidPlan) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/raidplans/${raidPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, groups: updatedGroups }),
      });

      if (response.ok) {
        const updated = await response.json();
        setRaidPlan(updated);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    if (!raidPlan) return;
    const updatedGroups = raidPlan.groups.map(g =>
      g.id === groupId ? { ...g, name: newName } : g
    );
    setRaidPlan({ ...raidPlan, groups: updatedGroups });
    saveRaidPlan(updatedGroups);
  };

  const handleAddPosition = (groupId: string) => {
    if (!raidPlan) return;
    const updatedGroups = raidPlan.groups.map(g =>
      g.id === groupId ? { ...g, positions: [...g.positions, { id: `pos-${Date.now()}`, label: '' }] } : g
    );
    setRaidPlan({ ...raidPlan, groups: updatedGroups });
    saveRaidPlan(updatedGroups);
  };

  const handleAssignParticipant = (groupId: string, positionId: string, participantId: string) => {
    if (!raidPlan) return;
    const updatedGroups = raidPlan.groups.map(g =>
      g.id === groupId ? {
        ...g,
        positions: g.positions.map(p => p.id === positionId ? { ...p, participantId } : p)
      } : g
    );
    setRaidPlan({ ...raidPlan, groups: updatedGroups });
    saveRaidPlan(updatedGroups);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
        </div>
      </Layout>
    );
  }

  if (!raidPlan) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load composition tool</p>
          <button onClick={() => navigate(`/guild/${guildId}/events/${eventId}`)} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
            Back to Event
          </button>
        </div>
      </Layout>
    );
  }

  const unassignedParticipants = raidPlan.event?.participants.filter(p =>
    !raidPlan.groups.some(g => g.positions.some(pos => pos.participantId === p.id))
  ) || [];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{raidPlan.title}</h1>
            <div className="flex gap-2">
              {saving && <span className="text-sm text-gray-500">Saving...</span>}
              <button onClick={() => navigate(`/guild/${guildId}/events/${eventId}`)} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                GO TO EVENT
              </button>
            </div>
          </div>

          {raidPlan.event && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{raidPlan.event.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{unassignedParticipants.length} unassigned of {raidPlan.event.participants.length} total</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unassigned Participants */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Unassigned Participants ({unassignedParticipants.length})</h3>
              <div className="space-y-2">
                {unassignedParticipants.map(p => (
                  <div key={p.id} className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{p.username}</span>
                    {p.role && <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded">{p.role}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Groups */}
            <div className="space-y-4">
              {raidPlan.groups.map(group => (
                <div key={group.id} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-300 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{group.name}</h4>
                    <button onClick={() => handleAddPosition(group.id)} className="text-purple-600 dark:text-purple-400">+</button>
                  </div>
                  <div className="space-y-2">
                    {group.positions.map(pos => {
                      const participant = raidPlan.event?.participants.find(p => p.id === pos.participantId);
                      return (
                        <div key={pos.id} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                          {participant ? (
                            <span className="text-sm text-gray-900 dark:text-white">{participant.username}</span>
                          ) : (
                            <select onChange={(e) => e.target.value && handleAssignParticipant(group.id, pos.id, e.target.value)} className="w-full bg-white dark:bg-gray-600 rounded text-sm">
                              <option value="">Empty slot</option>
                              {unassignedParticipants.map(p => (
                                <option key={p.id} value={p.id}>{p.username}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
