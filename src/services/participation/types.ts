// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/participation/types.ts
// Shared types for participation service

export interface JoinEventParams {
  eventId: string;
  userId: string;
  username: string;
  role?: string;
  spec?: string;
  userRoleIds?: string[]; // Discord role IDs of the user
}

export interface ParticipationResult {
  success: boolean;
  message: string;
  waitlisted?: boolean;
}

export interface ApprovalResult {
  success: boolean;
  message: string;
  approved?: number;
  rejected?: number;
}
