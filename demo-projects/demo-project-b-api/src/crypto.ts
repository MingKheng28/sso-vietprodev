import crypto from 'crypto';

export function hashToken(token: string): Buffer {
  return crypto.createHash('sha256').update(token).digest();
}

export function base64UrlRandom(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256Base64Url(value: string): string {
  return crypto.createHash('sha256').update(value).digest('base64url');
}
