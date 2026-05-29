import axios from 'axios';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { base64UrlRandom, sha256Base64Url } from './crypto';
import { User } from './models';
import { createProjectSession } from './session.service';
import { toPublicUser } from './local-auth.service';

const stateStore = new Map<string, { codeVerifier: string; createdAt: number }>();

export function startSso(_req: Request, res: Response) {
  const state = base64UrlRandom(24);
  const codeVerifier = base64UrlRandom(48);
  const codeChallenge = sha256Base64Url(codeVerifier);
  stateStore.set(state, { codeVerifier, createdAt: Date.now() });
  const url = new URL('/oauth/authorize', config.sso.issuer);
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
  if (error) return res.status(400).json({ error, error_description });
  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') return res.status(400).json({ message: 'Missing code or state' });
  const stored = stateStore.get(state);
  stateStore.delete(state);
  if (!stored) return res.status(400).json({ message: 'Invalid state' });
  const tokenResponse = await axios.post(config.sso.issuer + '/oauth/token', new URLSearchParams({ grant_type: 'authorization_code', client_id: config.sso.clientId, redirect_uri: config.sso.redirectUri, code, code_verifier: stored.codeVerifier }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  const idToken = tokenResponse.data.id_token as string | undefined;
  const decoded = idToken ? (jwt.decode(idToken) as any) : undefined;
  const email = decoded?.email ?? 'sso-user@example.com';
  const [user] = await User.findOrCreate({ where: { email }, defaults: { email, username: decoded?.preferred_username ?? email.split('@')[0], first_name: decoded?.name ?? 'SSO', last_name: 'User', status: 'active' } as any });
  await createProjectSession(user, req, res);
  return res.json({ message: 'SSO login success', appCode: config.appCode, user: toPublicUser(user) });
}
