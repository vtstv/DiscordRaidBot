// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/oauth-state.ts
// OAuth state management

import { getModuleLogger } from '../../../utils/logger.js';

const logger = getModuleLogger('oauth-state');

interface StateData {
  created: number;
  returnTo?: string;
}

// Temporary in-memory store for OAuth states (in production, use Redis)
const stateStore = new Map<string, StateData>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.created > 10 * 60 * 1000) { // 10 minutes
      stateStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

/**
 * Store OAuth state
 */
export function storeState(state: string, returnTo?: string): void {
  stateStore.set(state, { created: Date.now(), returnTo });
  logger.debug({ state, returnTo }, 'OAuth state stored');
}

/**
 * Verify and consume OAuth state
 * Returns state data if valid, null otherwise
 */
export function consumeState(state: string): StateData | null {
  if (!stateStore.has(state)) {
    logger.warn({ state }, 'Invalid OAuth state');
    return null;
  }

  const stateData = stateStore.get(state)!;
  stateStore.delete(state);
  logger.debug({ state }, 'OAuth state consumed');
  return stateData;
}
