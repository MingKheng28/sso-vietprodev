const issuer = process.env.OIDC_ISSUER ?? 'http://localhost:3000';
async function main() { const res = await fetch(issuer + '/.well-known/openid-configuration'); console.log('discovery', res.status); console.log(await res.text()); }
main().catch((e) => { console.error(e); process.exit(1); });
