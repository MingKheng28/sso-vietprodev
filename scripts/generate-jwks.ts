import { generateKeyPair, exportJWK } from 'jose';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
async function main() { const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true }); const privateJwk = await exportJWK(privateKey); const publicJwk = await exportJWK(publicKey); privateJwk.use = 'sig'; publicJwk.use = 'sig'; privateJwk.kid = publicJwk.kid = 'sso-default'; const privatePath = process.env.OIDC_PRIVATE_JWK_PATH ?? './secrets/oidc-private.jwk.json'; const publicPath = process.env.OIDC_PUBLIC_JWKS_PATH ?? './secrets/oidc-jwks.json'; mkdirSync(dirname(privatePath), { recursive: true }); writeFileSync(privatePath, JSON.stringify(privateJwk, null, 2)); writeFileSync(publicPath, JSON.stringify({ keys: [publicJwk] }, null, 2)); console.log('JWKS generated'); }
main();
