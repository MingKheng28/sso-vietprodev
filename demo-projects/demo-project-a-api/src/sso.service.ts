import axios from 'axios';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { base64UrlRandom, sha256Base64Url } from './crypto';
import { User } from './models';
import { createProjectSession } from './session.service';
import { toPublicUser } from './local-auth.service';
import { discoverSsoEndpoints } from './sso-discovery';

const stateStore = new Map<string, { codeVerifier: string; createdAt: number }>();
const STATE_TTL_MS = 5 * 60 * 1000;

function sanitizeError(error: unknown): Record<string, unknown> {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const safe: Record<string, unknown> = {
      message: e.message ?? 'Unknown error',
      status: e.status ?? (e.response as any)?.status,
    };
    if (e.error && typeof e.error === 'string') safe.oauthError = e.error;
    if (e.error_description && typeof e.error_description === 'string') safe.errorDescription = e.error_description;
    return safe;
  }
  return { message: 'Unknown error' };
}

function pruneStateStore() {
  const now = Date.now();
  for (const [key, val] of stateStore.entries()) {
    if (now - val.createdAt > STATE_TTL_MS) stateStore.delete(key);
  }
}

setInterval(pruneStateStore, 60_000);
pruneStateStore();

export async function startSso(_req: Request, res: Response) {
  const discovery = await discoverSsoEndpoints(config.sso.issuer);

  const state = base64UrlRandom(24);
  const codeVerifier = base64UrlRandom(48);
  const codeChallenge = sha256Base64Url(codeVerifier);
  stateStore.set(state, { codeVerifier, createdAt: Date.now() });

  const url = new URL(discovery.authorizationEndpoint);
  url.searchParams.set('client_id', config.sso.clientId);
  url.searchParams.set('redirect_uri', config.sso.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', config.sso.scopes);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return res.redirect(url.toString());
}

export async function ssoCallback(req: Request, res: Response) {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.status(400).json(sanitizeError({ error, error_description }));
  }

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    return res.status(400).json({ message: 'Missing code or state' });
  }

  const stored = stateStore.get(state);
  stateStore.delete(state);

  if (!stored) {
    return res.status(400).json({ message: 'Invalid or expired state' });
  }

  try {
    const discovery = await discoverSsoEndpoints(config.sso.issuer);

    const tokenResponse = await axios.post(
      discovery.tokenEndpoint,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.sso.clientId,
        redirect_uri: config.sso.redirectUri,
        code,
        code_verifier: stored.codeVerifier,
      }),
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } },
    );

    const idToken = tokenResponse.data?.id_token as string | undefined;
    if (!idToken) {
      return res.status(400).json({ message: 'No id_token received from SSO' });
    }

    const decoded = jwt.decode(idToken) as jwt.JwtPayload | null;
    if (!decoded) {
      return res.status(400).json({ message: 'Failed to decode id_token' });
    }

    const email = decoded.email ?? decoded.preferred_username ?? 'sso-user@example.com';
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        email,
        username: decoded.preferred_username ?? email.split('@')[0],
        first_name: decoded.name ?? 'SSO',
        last_name: 'User',
        status: 'active',
      } as any,
    });

    await createProjectSession(user, req, res);
    return res.json({ message: 'SSO login success', appCode: config.appCode, user: toPublicUser(user) });
  } catch (err) {
    return res.status(400).json(sanitizeError(err));
  }
}
