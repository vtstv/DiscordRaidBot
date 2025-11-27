// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/CompositionTool.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Layout from '../components/Layout';
import SortableGroup from '../components/SortableGroup';
import DraggableParticipant from '../components/DraggableParticipant';
import { Group, Participant, RaidPlan } from '../types/composition';

interface Event {
  id: string;
  title: string;
  participants: Participant[];
}

export default function CompositionTool() {
  const { guildId, eventId } = useParams<{ guildId: string; eventId: string }>();
  const navigate = useNavigate();
  const [raidPlan, setRaidPlan] = useState<RaidPlan | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadRaidPlan();
  }, [eventId, guildId]);

  const loadRaidPlan = async () => {
    try {
      const eventRes = await fetch(`/api/events/${eventId}?guildId=${guildId}`);
      const eventData = await eventRes.json();
      setEvent(eventData);

      const res = await fetch(`/api/raidplans/event/${eventId}?guildId=${guildId}`);
      
      if (res.ok) {
        const data = await res.json();
        setRaidPlan(data);
        setGroups(data.groups || []);
        setTitleValue(data.title);
      } else {
        const newPlan = await createDefaultRaidPlan(eventData);
        setRaidPlan(newPlan);
        setGroups(newPlan.groups);
        setTitleValue(newPlan.title);
      }
    } catch (error) {
      console.error('Failed to load raid plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultRaidPlan = async (eventData: Event) => {
    const defaultGroups: Group[] = Array.from({ length: 5 }, (_, i) => ({
      id: `group-${Date.now()}-${i}`,
      name: `Group ${i + 1}`,
      positions: Array.from({ length: 5 }, (_, j) => ({
        id: `pos-${Date.now()}-${i}-${j}`,
      })),
    }));

    const response = await fetch('/api/raidplans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        guildId,
        title: `Raid Plan: ${eventData.title}`,
        groups: defaultGroups,
      }),
    });

    return response.json();
  };

  const saveRaidPlan = async (updatedGroups: Group[], title?: string) => {
    if (!raidPlan) return;

    setSaving(true);
    try {
      await fetch(`/api/raidplans/${raidPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId,
          title: title || raidPlan.title,
          groups: updatedGroups,
        }),
      });
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save raid plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Participant dragged to position
    if (activeData?.type === 'participant' && overData?.type === 'position') {
      const participant = activeData.participant as Participant;
      const targetGroupId = overData.groupId;
      const targetPositionId = overData.positionId;

      const updatedGroups = groups.map(group => {
        if (group.id === targetGroupId) {
          return {
            ...group,
            positions: group.positions.map(pos =>
              pos.id === targetPositionId
                ? { ...pos, participantId: participant.id }
                : pos
            ),
          };
        }
        return group;
      });

      setGroups(updatedGroups);
      saveRaidPlan(updatedGroups);
    }

    // Group reordering
    if (activeData?.type === 'group' && overData?.type === 'group') {
      const oldIndex = groups.findIndex(g => `group-${g.id}` === active.id);
      const newIndex = groups.findIndex(g => `group-${g.id}` === over.id);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(groups, oldIndex, newIndex);
        setGroups(reordered);
        saveRaidPlan(reordered);
      }
    }
  };

  const handleRenameGroup = (groupId: string, name: string) => {
    const updated = groups.map(g => g.id === groupId ? { ...g, name } : g);
    setGroups(updated);
    saveRaidPlan(updated);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm('Delete this group?')) return;
    const updated = groups.filter(g => g.id !== groupId);
    setGroups(updated);
    saveRaidPlan(updated);
  };

  const handleAddGroup = () => {
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: `Group ${groups.length + 1}`,
      positions: [{ id: `pos-${Date.now()}` }],
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    saveRaidPlan(updated);
  };

  const handleAddPosition = (groupId: string) => {
    const updated = groups.map(g =>
      g.id === groupId
        ? { ...g, positions: [...g.positions, { id: `pos-${Date.now()}` }] }
        : g
    );
    setGroups(updated);
    saveRaidPlan(updated);
  };

  const handleRemovePosition = (groupId: string, positionId: string) => {
    const updated = groups.map(g =>
      g.id === groupId
        ? { ...g, positions: g.positions.filter(p => p.id !== positionId) }
        : g
    );
    setGroups(updated);
    saveRaidPlan(updated);
  };

  const handleEditPositionLabel = (groupId: string, positionId: string, label: string) => {
    const updated = groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            positions: g.positions.map(p =>
              p.id === positionId ? { ...p, label } : p
            ),
          }
        : g
    );
    setGroups(updated);
    saveRaidPlan(updated);
  };

  const handleRemoveParticipant = (groupId: string, positionId: string) => {
    const updated = groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            positions: g.positions.map(p =>
              p.id === positionId ? { ...p, participantId: undefined } : p
            ),
          }
        : g
    );
    setGroups(updated);
    saveRaidPlan(updated);
  };

  const handleSaveTitle = () => {
    if (raidPlan) {
      saveRaidPlan(groups, titleValue);
      setRaidPlan({ ...raidPlan, title: titleValue });
    }
    setIsEditingTitle(false);
  };

  const assignedParticipantIds = new Set(
    groups.flatMap(g => g.positions.map(p => p.participantId).filter(Boolean))
  );

  const unassignedParticipants = (event?.participants || []).filter(
    p => !assignedParticipantIds.has(p.id)
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate(`/guild/${guildId}/events/${eventId}`)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Event
            </button>
            {saving && <span className="text-sm text-purple-600 dark:text-purple-400">Saving...</span>}
          </div>

          {/* Title */}
          <div className="mb-6">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="text-3xl font-bold px-4 py-2 border-2 border-purple-300 dark:border-purple-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                title="Click to edit title"
              >
                {raidPlan?.title || 'Raid Composition'}
              </h1>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Unassigned Participants */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Unassigned ({unassignedParticipants.length})
                  </h2>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {unassignedParticipants.map(participant => (
                      <DraggableParticipant key={participant.id} participant={participant} />
                    ))}
                    {unassignedParticipants.length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-4">
                        All participants assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Groups */}
              <div className="lg:col-span-3">
                <SortableContext
                  items={groups.map(g => `group-${g.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {groups.map(group => (
                      <SortableGroup
                        key={group.id}
                        group={group}
                        participants={event?.participants || []}
                        onRenameGroup={handleRenameGroup}
                        onDeleteGroup={handleDeleteGroup}
                        onAddPosition={handleAddPosition}
                        onRemovePosition={handleRemovePosition}
                        onEditPositionLabel={handleEditPositionLabel}
                        onRemoveParticipant={handleRemoveParticipant}
                      />
                    ))}
                  </div>
                </SortableContext>

                <button
                  onClick={handleAddGroup}
                  className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-medium"
                >
                  + Add Group
                </button>
              </div>
            </div>

            <DragOverlay>
              {activeId && activeId.startsWith('participant-') ? (
                <div className="p-3 bg-white dark:bg-gray-700 border-2 border-purple-500 rounded-xl shadow-lg">
                  Dragging...
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </Layout>
  );
}
