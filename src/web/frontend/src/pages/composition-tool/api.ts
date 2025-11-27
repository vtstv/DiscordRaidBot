// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/api.ts

import { Group } from '../../types/composition';
import type { Event, RaidPlanData } from './types';

/**
 * Load event data
 */
export async function loadEvent(eventId: string, guildId: string): Promise<Event> {
  const response = await fetch(`/api/events/${eventId}?guildId=${guildId}`);
  if (!response.ok) {
    throw new Error('Failed to load event');
  }
  return response.json();
}

/**
 * Load raid plan for event
 */
export async function loadRaidPlan(eventId: string, guildId: string): Promise<RaidPlanData | null> {
  const response = await fetch(`/api/raidplans/event/${eventId}?guildId=${guildId}`);
  if (response.ok) {
    return response.json();
  }
  return null;
}

/**
 * Create new raid plan
 */
export async function createRaidPlan(
  eventId: string,
  guildId: string,
  title: string,
  groups: Group[]
): Promise<RaidPlanData> {
  const response = await fetch('/api/raidplans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      eventId,
      guildId,
      title,
      groups,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create raid plan');
  }

  return response.json();
}

/**
 * Update existing raid plan
 */
export async function updateRaidPlan(
  raidPlanId: string,
  guildId: string,
  title: string,
  groups: Group[]
): Promise<void> {
  const response = await fetch(`/api/raidplans/${raidPlanId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guildId,
      title,
      groups,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update raid plan');
  }
}

/**
 * Save composition preset
 */
export async function savePreset(
  guildId: string,
  name: string,
  description: string,
  groups: Group[]
): Promise<void> {
  const response = await fetch('/api/composition-presets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      guildId,
      name,
      description,
      groups,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save preset');
  }
}
