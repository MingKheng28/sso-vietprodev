import { Request, Response } from 'express';
import { config } from './config';
import { hashToken } from './crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt';
import { User, UserSession } from './models';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, { httpOnly: true, secure: config.cookies.secure, sameSite: config.cookies.sameSite, maxAge: config.jwt.accessTtlSeconds * 1000 });
  res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: config.cookies.secure, sameSite: config.cookies.sameSite, maxAge: config.jwt.refreshTtlSeconds * 1000 });
}

function requestDeviceInfo(req: Request) {
  return {
    userAgent: req.headers['user-agent'] ?? null,
    ip: req.ip,
    source: config.appCode,
  };
}

export async function createProjectSession(user: User, req: Request, res: Response) {
  const tokenVersion = 1;
  const accessToken = signAccessToken(user, tokenVersion);
  const refreshToken = signRefreshToken(user, tokenVersion);
  const now = Date.now();

  await UserSession.create({
    user_id: user.id,
    session_token: hashToken(accessToken),
    refresh_token: hashToken(refreshToken),
    token_version: tokenVersion,
    device_info: requestDeviceInfo(req),
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] ?? null,
    expires_at: new Date(now + config.jwt.accessTtlSeconds * 1000),
    refresh_expires_at: new Date(now + config.jwt.refreshTtlSeconds * 1000),
    is_active: true,
    created_at: new Date(now),
    last_activity_at: new Date(now),
  } as any);

  setAuthCookies(res, accessToken, refreshToken);
}

export async function validateSession(accessToken: string): Promise<UserSession | null> {
  const session = await UserSession.findOne({ where: { session_token: hashToken(accessToken), is_active: true } });
  if (!session) return null;
  if (session.expires_at.getTime() < Date.now()) return null;
  await session.update({ last_activity_at: new Date() } as any);
  return session;
}

export async function refreshProjectSession(refreshToken: string | undefined, req: Request, res: Response) {
  if (!refreshToken) return res.status(401).json({ message: 'Missing refresh token' });

  const payload = verifyRefreshToken(refreshToken);
  const session = await UserSession.findOne({ where: { refresh_token: hashToken(refreshToken), is_active: true } });
  if (!session) return res.status(401).json({ message: 'Invalid refresh session' });
  if (session.refresh_expires_at.getTime() < Date.now()) return res.status(401).json({ message: 'Refresh session expired' });
  if (session.token_version !== payload.tokenVersion) return res.status(401).json({ message: 'Refresh token version mismatch' });

  const user = await User.findByPk(payload.sub);
  if (!user || user.status !== 'active') return res.status(401).json({ message: 'User is not active' });

  const nextVersion = session.token_version + 1;
  const accessToken = signAccessToken(user, nextVersion);
  const nextRefreshToken = signRefreshToken(user, nextVersion);
  const now = Date.now();

  await session.update({
    session_token: hashToken(accessToken),
    refresh_token: hashToken(nextRefreshToken),
    token_version: nextVersion,
    device_info: requestDeviceInfo(req),
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] ?? null,
    expires_at: new Date(now + config.jwt.accessTtlSeconds * 1000),
    refresh_expires_at: new Date(now + config.jwt.refreshTtlSeconds * 1000),
    last_activity_at: new Date(now),
  } as any);

  setAuthCookies(res, accessToken, nextRefreshToken);
  return res.json({ ok: true, user: { id: user.id, email: user.email, username: user.username } });
}

export async function deactivateSession(accessToken?: string) {
  if (!accessToken) return;
  await UserSession.update({ is_active: false } as any, { where: { session_token: hashToken(accessToken), is_active: true } });
}
