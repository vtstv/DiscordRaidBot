// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/config.ts
// Application configuration

export interface AppConfig {
  apiBaseUrl: string;
  oauthEnabled: boolean;
  discordClientId?: string;
}

let config: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (config) return config;
  
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error('Failed to load config');
    }
    config = await response.json();
    return config!;
  } catch (error) {
    console.error('Failed to load config, using defaults:', error);
    // Fallback to defaults
    config = {
      apiBaseUrl: window.location.origin,
      oauthEnabled: true,
    };
    return config;
  }
}

export function getConfig(): AppConfig {
  if (!config) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return config;
}
