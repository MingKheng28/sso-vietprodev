import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env ${name}`);
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  appName: process.env.APP_NAME ?? 'demo-project-api',
  appCode: required('APP_CODE'),
  databaseUrl: required('DATABASE_URL'),
  sso: {
    issuer: required('SSO_ISSUER'),
    clientId: required('SSO_CLIENT_ID'),
    redirectUri: required('SSO_REDIRECT_URI'),
    postLogoutRedirectUri: process.env.SSO_POST_LOGOUT_REDIRECT_URI,
    scopes: process.env.SSO_SCOPES ?? 'openid profile email offline_access',
  },
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
    refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2592000),
  },
  cookies: {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as 'lax' | 'strict' | 'none',
  },
};
