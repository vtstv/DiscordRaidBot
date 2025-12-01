// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/routes/auth/login.ts
// Login route handler

import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { getAuthorizationUrl } from '../../auth/discord-oauth.js';
import { config } from '../../../config/env.js';
import { getModuleLogger } from '../../../utils/logger.js';
import { storeState } from './oauth-state.js';

const logger = getModuleLogger('auth-login');

/**
 * GET /auth/login
 * Redirect to Discord OAuth
 */
export async function loginHandler(
  request: FastifyRequest<{ Querystring: { returnTo?: string } }>,
  reply: FastifyReply
): Promise<void> {
  const state = crypto.randomBytes(16).toString('hex');
  const returnTo = request.query.returnTo || '/';
  
  storeState(state, returnTo);

  const authUrl = getAuthorizationUrl(config.DISCORD_OAUTH_REDIRECT_URI, state);
  
  logger.info({ state, returnTo }, 'Redirecting to Discord OAuth');
  reply.redirect(authUrl);
}
