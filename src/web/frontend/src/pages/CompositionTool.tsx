// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/CompositionTool.tsx
// Raid Composition Tool - Orchestrator

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
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import Layout from '../components/Layout';
import PresetModal from '../components/PresetModal';
import { Group } from '../types/composition';
import { Event, RaidPlanData } from './composition-tool/types';
import {
  loadEvent,
  loadRaidPlan,
  createRaidPlan,
  updateRaidPlan,
  savePreset,
} from './composition-tool/api';
import { createDefaultGroups, getUnassignedParticipants, regeneratePresetGroups } from './composition-tool/utils';
import { handleDragEnd } from './composition-tool/dragHandlers';
import {
  renameGroup,
  deleteGroup,
  addGroup,
  addPosition,
  removePosition,
  editPositionLabel,
  removeParticipant,
} from './composition-tool/groupActions';
import Header from './composition-tool/Header';
import TitleEditor from './composition-tool/TitleEditor';
import UnassignedPanel from './composition-tool/UnassignedPanel';
import GroupsPanel from './composition-tool/GroupsPanel';

export default function CompositionTool() {
  const { guildId, eventId } = useParams<{ guildId: string; eventId: string }>();
  const navigate = useNavigate();
  const [raidPlan, setRaidPlan] = useState<RaidPlanData | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, [eventId, guildId]);

  const loadData = async () => {
    try {
      const eventData = await loadEvent(eventId!, guildId!);
      setEvent(eventData);

      const planData = await loadRaidPlan(eventId!, guildId!);

      if (planData) {
        setRaidPlan(planData);
        setGroups(planData.groups || []);
      } else {
        const newPlan = await createNewRaidPlan(eventData);
        setRaidPlan(newPlan);
        setGroups(newPlan.groups);
      }
    } catch (error) {
      console.error('Failed to load raid plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewRaidPlan = async (eventData: Event): Promise<RaidPlanData> => {
    const defaultGroups = createDefaultGroups();
    return createRaidPlan(eventId!, guildId!, `Raid Plan: ${eventData.title}`, defaultGroups);
  };

  const saveGroups = async (updatedGroups: Group[], title?: string) => {
    if (!raidPlan) return;

    setSaving(true);
    try {
      await updateRaidPlan(raidPlan.id, guildId!, title || raidPlan.title, updatedGroups);
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

  const handleDragEndWrapper = (event: any) => {
    setActiveId(null);
    handleDragEnd(event, groups, (newGroups) => {
      setGroups(newGroups);
      saveGroups(newGroups);
    });
  };

  const handleTitleSave = (newTitle: string) => {
    if (raidPlan) {
      saveGroups(groups, newTitle);
      setRaidPlan({ ...raidPlan, title: newTitle });
    }
  };

  const handleRenameGroup = (groupId: string, name: string) => {
    const updated = renameGroup(groups, groupId, name);
    setGroups(updated);
    saveGroups(updated);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm('Delete this group?')) return;
    const updated = deleteGroup(groups, groupId);
    setGroups(updated);
    saveGroups(updated);
  };

  const handleAddGroup = () => {
    const updated = addGroup(groups);
    setGroups(updated);
    saveGroups(updated);
  };

  const handleAddPosition = (groupId: string) => {
    const updated = addPosition(groups, groupId);
    setGroups(updated);
    saveGroups(updated);
  };

  const handleRemovePosition = (groupId: string, positionId: string) => {
    const updated = removePosition(groups, groupId, positionId);
    setGroups(updated);
    saveGroups(updated);
  };

  const handleEditPositionLabel = (groupId: string, positionId: string, label: string) => {
    const updated = editPositionLabel(groups, groupId, positionId, label);
    setGroups(updated);
    saveGroups(updated);
  };

  const handleRemoveParticipant = (groupId: string, positionId: string) => {
    const updated = removeParticipant(groups, groupId, positionId);
    setGroups(updated);
    saveGroups(updated);
  };

  const handleLoadPreset = (presetGroups: any) => {
    const newGroups = regeneratePresetGroups(presetGroups);
    setGroups(newGroups);
    saveGroups(newGroups);
  };

  const handleSavePreset = async (name: string, description: string) => {
    try {
      await savePreset(guildId!, name, description, groups);
      alert('Preset saved successfully!');
    } catch (error) {
      console.error('Failed to save preset:', error);
      alert('Failed to save preset');
    }
  };

  const unassignedParticipants = getUnassignedParticipants(event, groups);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <Header
            guildId={guildId!}
            eventId={eventId!}
            saving={saving}
            onBack={() => navigate(`/guild/${guildId}/events/${eventId}`)}
            onOpenPresets={() => setShowPresetModal(true)}
          />

          <div className="mb-4">
            <TitleEditor
              title={raidPlan?.title || 'Raid Composition'}
              onSave={handleTitleSave}
            />
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEndWrapper}
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1">
                <UnassignedPanel participants={unassignedParticipants} />
              </div>

              <div className="lg:col-span-3">
                <GroupsPanel
                  groups={groups}
                  participants={event?.participants || []}
                  onRenameGroup={handleRenameGroup}
                  onDeleteGroup={handleDeleteGroup}
                  onAddPosition={handleAddPosition}
                  onRemovePosition={handleRemovePosition}
                  onEditPositionLabel={handleEditPositionLabel}
                  onRemoveParticipant={handleRemoveParticipant}
                  onAddGroup={handleAddGroup}
                />
              </div>
            </div>

            <DragOverlay>
              {activeId && activeId.startsWith('participant-') ? (
                <div className="px-3 py-2 bg-white dark:bg-gray-700 border-2 border-purple-500 rounded-lg shadow-lg text-xs">
                  Dragging...
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <PresetModal
            isOpen={showPresetModal}
            onClose={() => setShowPresetModal(false)}
            onLoad={handleLoadPreset}
            onSave={handleSavePreset}
            guildId={guildId!}
          />
        </div>
      </div>
    </Layout>
  );
}
