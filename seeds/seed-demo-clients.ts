import { Pool } from 'pg';

const demoClients = [
  {
    appCode: 'DEMO_PROJECT_A',
    clientId: 'demo-project-a-api',
    name: 'Demo Project A API',
    redirectUris: ['http://localhost:3001/auth/sso/callback'],
    postLogoutRedirectUris: ['http://localhost:3001/'],
  },
  {
    appCode: 'DEMO_PROJECT_B',
    clientId: 'demo-project-b-api',
    name: 'Demo Project B API',
    redirectUris: ['http://localhost:3002/auth/sso/callback'],
    postLogoutRedirectUris: ['http://localhost:3002/'],
  },
];

export async function seedDemoClients(pool: Pool) {
  for (const client of demoClients) {
    await pool.query(
      `INSERT INTO clients(
        app_code,
        client_id,
        name,
        redirect_uris,
        post_logout_redirect_uris,
        grant_types,
        response_types,
        scopes,
        token_endpoint_auth_method,
        require_pkce,
        status
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT(app_code) DO UPDATE SET
        client_id=EXCLUDED.client_id,
        name=EXCLUDED.name,
        redirect_uris=EXCLUDED.redirect_uris,
        post_logout_redirect_uris=EXCLUDED.post_logout_redirect_uris,
        grant_types=EXCLUDED.grant_types,
        response_types=EXCLUDED.response_types,
        scopes=EXCLUDED.scopes,
        token_endpoint_auth_method=EXCLUDED.token_endpoint_auth_method,
        require_pkce=EXCLUDED.require_pkce,
        status=EXCLUDED.status`,
      [
        client.appCode,
        client.clientId,
        client.name,
        client.redirectUris,
        client.postLogoutRedirectUris,
        ['authorization_code', 'refresh_token'],
        ['code'],
        ['openid', 'profile', 'email', 'offline_access'],
        'none',
        true,
        'active',
      ],
    );
  }
}
