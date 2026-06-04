import axios from 'axios';

let discoveryCache: Record<string, string> | null = null;

export async function discoverSsoEndpoints(issuer: string): Promise<Record<string, string>> {
  if (discoveryCache) return discoveryCache;
  try {
    const meta = await axios.get(`${issuer}/.well-known/openid-configuration`, { timeout: 5000 });
    discoveryCache = {
      authorizationEndpoint: meta.data.authorization_endpoint,
      tokenEndpoint: meta.data.token_endpoint,
      userinfoEndpoint: meta.data.userinfo_endpoint,
      jwksUri: meta.data.jwks_uri,
      issuer: meta.data.issuer,
    };
    return discoveryCache;
  } catch {
    return {
      authorizationEndpoint: `${issuer}/oauth/authorize`,
      tokenEndpoint: `${issuer}/oauth/token`,
      userinfoEndpoint: `${issuer}/oauth/userinfo`,
      jwksUri: `${issuer}/oauth/jwks`,
      issuer,
    };
  }
}

export function clearDiscoveryCache() {
  discoveryCache = null;
}
