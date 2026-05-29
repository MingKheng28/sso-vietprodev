export default () => ({
  app: { name: process.env.APP_NAME ?? 'sso-vietprodev', port: Number(process.env.PORT ?? 3000), env: process.env.NODE_ENV ?? 'development' },
  oidc: { issuer: process.env.OIDC_ISSUER ?? 'http://localhost:3000', accessTokenTtl: Number(process.env.OIDC_ACCESS_TOKEN_TTL ?? 900), refreshTokenTtl: Number(process.env.OIDC_REFRESH_TOKEN_TTL ?? 2592000), privateJwkPath: process.env.OIDC_PRIVATE_JWK_PATH ?? './secrets/oidc-private.jwk.json', publicJwksPath: process.env.OIDC_PUBLIC_JWKS_PATH ?? './secrets/oidc-jwks.json' },
  database: { ssoPrimaryUrl: process.env.SSO_LOGIN_PRIMARY_URL, ssoBackupUrl: process.env.SSO_LOGIN_BACKUP_URL },
  audit: { mongoUrl: process.env.MONGODB_AUDIT_URL, database: process.env.MONGODB_AUDIT_DATABASE ?? 'sso_audit' },
});
