// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/create-template/utils.ts

import type { TemplateFormData } from './types';

/**
 * Parse template config and convert to form data format
 */
export function templateToFormData(template: any): TemplateFormData {
  const config = template.config as any;
  
  const roleLimitsStr = config.limits && typeof config.limits === 'object'
    ? Object.entries(config.limits)
        .filter(([key]) => key !== 'total')
        .map(([role, limit]) => `${role}:${limit}`)
        .join(', ')
    : '';

  return {
    name: template.name,
    description: template.description || '',
    maxParticipants: config.limits?.total || 0,
    allowedRoles: config.roles?.join(', ') || '',
    roleLimits: roleLimitsStr,
    emojiMapping: config.emojiMap 
      ? Object.entries(config.emojiMap).map(([role, emoji]) => `${role}:${emoji}`).join(', ')
      : '',
    imageUrl: config.imageUrl || '',
  };
}

/**
 * Convert form data to template config object
 */
export function formDataToConfig(formData: TemplateFormData) {
  const rolesArray = formData.allowedRoles
    .split(',')
    .map(r => r.trim())
    .filter(r => r);

  const emojiMap: Record<string, string> = {};
  if (formData.emojiMapping) {
    formData.emojiMapping.split(',').forEach(pair => {
      const [role, emoji] = pair.split(':').map(s => s.trim());
      if (role && emoji) {
        emojiMap[role] = emoji;
      }
    });
  }

  const limits: Record<string, number> = {};
  if (formData.maxParticipants > 0) {
    limits.total = formData.maxParticipants;
  }
  
  if (formData.roleLimits) {
    formData.roleLimits.split(',').forEach(pair => {
      const [role, limit] = pair.split(':').map(s => s.trim());
      if (role && limit) {
        limits[role] = parseInt(limit);
      }
    });
  }

  return {
    roles: rolesArray,
    limits: limits,
    emojiMap: Object.keys(emojiMap).length > 0 ? emojiMap : undefined,
    imageUrl: formData.imageUrl || undefined,
  };
}
