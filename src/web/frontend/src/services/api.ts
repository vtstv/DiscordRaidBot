// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/services/api.ts
// API client service

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  hasBot?: boolean;
  memberCount?: number;
}

export interface Event {
  id: string;
  guildId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  status: string;
  maxParticipants?: number;
  channelId?: string;
  templateId?: string;
  createdBy: string;
  _count?: {
    participants: number;
  };
  guild?: {
    name: string;
  };
  participants?: Array<{
    id: string;
    userId: string;
    role?: string;
    status?: string;
    note?: string;
    // Enriched fields from Discord
    username?: string;
    discordUsername?: string;
    discordDisplayName?: string;
    discordAvatar?: string;
  }>;
  // Enriched creator info
  createdByUser?: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
}

export interface Template {
  id: string;
  guildId: string;
  name: string;
  description?: string;
  config: any;
  createdAt: string;
  guild?: {
    name: string;
  };
}

export interface GuildSettings {
  id: string;
  name: string;
  timezone?: string;
  locale?: string;
  logChannelId?: string;
  archiveChannelId?: string;
  managerRoleId?: string;
  commandPrefix?: string;
  approvalChannels?: string[];
  reminderIntervals?: string[];
  autoDeleteHours?: number;
  logRetentionDays?: number;
  threadChannels?: string[];
  noteChannels?: string[];
  // Statistics settings
  statsEnabled?: boolean;
  statsChannelId?: string;
  statsUpdateInterval?: string;
  statsAutoRoleEnabled?: boolean;
  statsTop10RoleId?: string;
  statsMinEvents?: number;
  allowParticipantNotes?: boolean;
  participantNoteMaxLength?: number;
  showViewOnlineButton?: boolean;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  parent_id?: string;
}

class ApiService {
  private baseUrl = '';

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    // Handle 204 No Content responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // Auth
  async getMe(): Promise<{ user: DiscordUser; adminGuilds: Guild[]; isBotAdmin: boolean }> {
    return this.request('/auth/me');
  }

  async getAdminGuilds(): Promise<{ guilds: Guild[] }> {
    return this.request('/auth/guilds');
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { 
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  // Guilds
  async getUserGuilds(): Promise<Guild[]> {
    return this.request('/api/guilds');
  }

  async getGuildSettings(guildId: string): Promise<GuildSettings> {
    return this.request(`/api/guilds/${guildId}/settings`);
  }

  async updateGuildSettings(guildId: string, settings: Partial<GuildSettings>): Promise<GuildSettings> {
    return this.request(`/api/guilds/${guildId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getGuildStats(guildId: string): Promise<any> {
    return this.request(`/api/guilds/${guildId}/stats`);
  }

  async getGuildRoles(guildId: string): Promise<DiscordRole[]> {
    return this.request(`/api/guilds/${guildId}/roles`);
  }

  async getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
    return this.request(`/api/guilds/${guildId}/channels`);
  }

  // Events
  async getEvents(guildId: string, status?: string): Promise<Event[]> {
    const params = new URLSearchParams({ guildId });
    if (status) params.append('status', status);
    return this.request(`/api/events?${params}`);
  }

  async getEvent(guildId: string, eventId: string, enrich: boolean = true): Promise<Event> {
    const params = enrich ? '?enrich=true' : '';
    return this.request(`/api/events/${eventId}${params}`);
  }

  async createEvent(event: any): Promise<Event> {
    return this.request('/api/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async updateEvent(eventId: string, event: any): Promise<Event> {
    return this.request(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  async deleteEvent(guildId: string, eventId: string): Promise<void> {
    await this.request(`/api/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async bulkDeleteEvents(eventIds: string[]): Promise<{ deleted: number }> {
    return this.request('/api/events/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ eventIds }),
    });
  }

  async searchEvents(params: {
    q?: string;
    status?: string;
    guildId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: Event[]; total: number }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    return this.request(`/api/events/search?${searchParams}`);
  }

  // Templates
  async getTemplates(guildId: string): Promise<Template[]> {
    return this.request(`/api/templates?guildId=${guildId}`);
  }

  async getTemplate(templateId: string): Promise<Template> {
    return this.request(`/api/templates/${templateId}`);
  }

  async createTemplate(template: any): Promise<Template> {
    return this.request('/api/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateTemplate(templateId: string, template: any): Promise<Template> {
    return this.request(`/api/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await this.request(`/api/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  async bulkDeleteTemplates(templateIds: string[]): Promise<{ deleted: number }> {
    return this.request('/api/templates/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ templateIds }),
    });
  }

  async searchTemplates(params: {
    q?: string;
    guildId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ templates: Template[]; total: number }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    return this.request(`/api/templates/search?${searchParams}`);
  }
}

export const api = new ApiService();
export default api;
