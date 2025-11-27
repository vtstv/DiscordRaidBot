// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/settings/types.ts
// Settings page types

export interface RolePermissions {
  canAccessEvents: boolean;
  canAccessCompositions: boolean;
  canAccessTemplates: boolean;
  canAccessSettings: boolean;
}

export type RolePermissionsMap = Record<string, RolePermissions>;
