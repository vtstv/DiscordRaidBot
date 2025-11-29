// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/types/session.ts
// Session type definitions

declare module 'fastify' {
  interface Session {
    user?: {
      id: string;
      username: string;
      avatar: string | null;
    };
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    adminGuilds?: Array<{
      id: string;
      name: string;
      icon: string | null;
      owner: boolean;
    }>;
  }
}

export {};
