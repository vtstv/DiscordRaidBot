// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/create-event/types.ts

export interface EventFormData {
  title: string;
  description: string;
  startTime: string;
  maxParticipants: number;
  templateId?: string;
  channelId: string;
  createVoiceChannel?: boolean;
  voiceChannelName?: string;
  voiceChannelRestricted?: boolean;
  voiceChannelCreateBefore?: number;
}

export interface Channel {
  id: string;
  name: string;
  type: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
}
