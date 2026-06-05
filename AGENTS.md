# SSO VietProDev - Project Context

## Overview

**SSO Authorization Server** dùng NestJS + `oidc-provider` + PostgreSQL + MongoDB. Có 2 demo backend (Demo A/B) mô phỏng Project A/B thật để test multi-project SSO.

## Architecture

```
Browser → SSO (NestJS) → oidc-provider
                    ↓
              PostgreSQL (users, clients, sessions, tokens)
                    ↓
              MongoDB (audit logs)

Demo Projects → SSO (OAuth2/OIDC) → Demo Projects
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| SSO Core | NestJS + TypeScript |
| OIDC Provider | `oidc-provider` |
| SSO Database | PostgreSQL 16 |
| Audit Database | MongoDB |
| Demo Projects | Express.js + TypeScript + Sequelize |
| Deployment | Docker + Kubernetes + Helm |
| HA | Patroni + etcd + HAProxy + PgBouncer |

### Key Paths

| Path | Purpose |
|------|---------|
| `src/` | SSO core NestJS application |
| `src/oidc/` | OIDC interactions, views, provider |
| `src/auth/` | Auth service, session, password |
| `src/security/` | Rate limiting, brute-force, CSRF |
| `src/audit/` | Audit logger service |
| `src/users/` | Users CRUD |
| `src/clients/` | OIDC client management |
| `src/db-manager/` | DB health, HA failover |
| `src/health/` | Health check endpoints |
| `src/scheduler/` | Cron jobs (backup verify, DB health, audit cleanup) |
| `src/admin/` | Admin API endpoints |
| `demo-projects/demo-project-a-api/` | Demo Project A |
| `demo-projects/demo-project-b-api/` | Demo Project B |
| `infrastructure/` | Docker, Helm, K8s, monitoring configs |
| `migrations/` | PostgreSQL migration SQL files |
| `seeds/` | Database seeding scripts |

## Conventions

### Code Quality

- Run `npm run lint` and `npm run format` before every commit
- All TypeScript must pass `npm run typecheck`
- Error handlers MUST sanitize sensitive data (never leak tokens, codes, secrets)
- No `any` casts without comment explaining why
- Use `argon2` with `argon2id` for password hashing

### Security Rules

- NEVER log passwords, access tokens, refresh tokens, authorization codes, client secrets, or CSRF tokens
- NEVER commit `.env` files, private keys, JWKS private keys, or real credentials
- Error messages for invalid user and invalid password must be identical (timing-safe)
- PKCE must use `S256` method, never `plain`
- Redirect URIs must be exact match, never wildcard
- Audit write failures must be retried automatically (not silently swallowed)

### Database Rules

- Migrations must be idempotent: use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`
- Migrations must be backward compatible: never drop columns in the same release
- All tables must have indexes on frequently queried columns
- Production DB connections must go through PgBouncer/HAProxy

### OIDC Rules

- OIDC discovery endpoints should be used instead of hardcoded URLs (with fallback)
- All OIDC clients loaded from DB/config, never hardcoded
- Demo project stateStore must have TTL-based cleanup (marked as demo-only)

## Development Setup

```cmd
# 1. Install dependencies
npm install

# 2. Copy and configure environment
copy .env.example .env
# Edit .env with your local PostgreSQL and MongoDB URLs

# 3. Run migrations
npm run migration:run

# 4. Seed initial data
npm run seed

# 5. Start SSO
npm run start:dev
# SSO available at http://localhost:3000
# OIDC issuer: http://localhost:3000

# 6. Start Demo Projects
cd demo-projects/demo-project-a-api
npm install
copy .env.example .env
npm run start:dev

cd demo-projects/demo-project-b-api
npm install
copy .env.example .env
npm run start:dev
```

### Demo Credentials

```
Email: admin@sso.local
Password: ChangeMeAdmin123!
```

## Testing SSO Flow

1. `http://localhost:3001/auth/sso/start` → Demo A redirects to SSO
2. Login at SSO → SSO redirects back to Demo A with code
3. Demo A exchanges code for tokens
4. `http://localhost:3002/auth/sso/start` → Demo B (SSO session still valid, no re-auth needed)

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health/live` | Liveness probe |
| `GET /health/ready` | Readiness probe |
| `GET /health/dependencies` | Detailed dependency status |
| `GET /metrics` | Prometheus metrics |

## OIDC Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /.well-known/openid-configuration` | OIDC Discovery |
| `GET /oauth/authorize` | Authorization |
| `POST /oauth/token` | Token exchange |
| `GET /oauth/userinfo` | UserInfo |
| `GET /oauth/jwks` | JWKS |
| `POST /oauth/introspect` | Token introspection |
| `POST /oauth/revoke` | Token revocation |
| `GET /oauth/logout` | RP-initiated logout |

## Important Notes

- Demo projects use `bindResource()` utility (mô phỏng `express-automatic-routes` convention)
- `codegraph` MCP server pre-indexes the codebase for fast code intelligence
- MongoDB audit logs are append-only (don't delete directly)
- Read/write DB split is TODO (currently both go through same pool)
- For local HA testing: `docker-compose.ha.yml` includes Patroni + etcd + HAProxy + PgBouncer

## Demo Projects Swagger UI

| Project | Swagger URL |
|---------|-------------|
| Demo Project A API | `http://localhost:3001/docs` |
| Demo Project B API | `http://localhost:3002/docs` |

## SSO Flow (for testing via Swagger)

```
1. GET /auth/sso/start     → 302 redirect to SSO
2. Browser → SSO login     → admin@sso.local / ChangeMeAdmin123!
3. SSO → /auth/sso/callback → Demo API exchanges code for tokens
4. GET /auth/me            → Returns authenticated user
```

Each authorization code and state is single-use. If an error occurs (403, invalid state, expired), restart the flow from step 1.
