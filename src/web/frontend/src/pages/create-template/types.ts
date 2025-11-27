// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/create-template/types.ts

export interface TemplateFormData {
  name: string;
  description: string;
  maxParticipants: number;
  allowedRoles: string;
  roleLimits: string;
  emojiMapping: string;
  imageUrl: string;
}
