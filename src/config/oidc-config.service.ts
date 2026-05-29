import { Injectable } from '@nestjs/common';
@Injectable()
export class OidcConfigService {
  get issuer() { return process.env.OIDC_ISSUER ?? 'http://localhost:3000'; }
  get accessTokenTtl() { return Number(process.env.OIDC_ACCESS_TOKEN_TTL ?? 900); }
  get refreshTokenTtl() { return Number(process.env.OIDC_REFRESH_TOKEN_TTL ?? 2592000); }
  get cookieKeys() { return (process.env.OIDC_COOKIE_KEYS ?? 'dev-cookie-key').split(',').filter(Boolean); }
}
