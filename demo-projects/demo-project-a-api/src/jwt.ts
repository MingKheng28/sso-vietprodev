import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from './config';
import { User } from './models';

export interface DemoJwtPayload {
  sub: string;
  email: string;
  username?: string | null;
  appCode: string;
  tokenVersion: number;
}

function signProjectToken(user: User, tokenVersion: number, secret: string, expiresIn: number): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign({
    sub: user.id,
    email: user.email,
    username: user.username,
    appCode: config.appCode,
    tokenVersion,
  }, secret, options);
}

export function signAccessToken(user: User, tokenVersion: number): string {
  return signProjectToken(user, tokenVersion, config.jwt.accessSecret, config.jwt.accessTtlSeconds);
}

export function signRefreshToken(user: User, tokenVersion: number): string {
  return signProjectToken(user, tokenVersion, config.jwt.refreshSecret, config.jwt.refreshTtlSeconds);
}

export function verifyAccessToken(token: string): DemoJwtPayload {
  return jwt.verify(token, config.jwt.accessSecret) as DemoJwtPayload;
}

export function verifyRefreshToken(token: string): DemoJwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as DemoJwtPayload;
}
