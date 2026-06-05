# sso-vietprodev

Production SSO Authorization Server — Identity Provider dùng OAuth2/OIDC chuẩn, cho phép đăng nhập một lần vào nhiều dự án.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
copy .env.example .env
# Edit .env — set SSO_LOGIN_PRIMARY_URL to use port 5432 for local

# 3. Start local databases
docker compose -f docker-compose.local.yml up -d

# 4. Run migrations & seeds
npm run migration:run
npm run seed

# 5. Generate OIDC signing keys
npm run jwks:generate

# 6. Start development server
npm run start:dev
# SSO available at http://localhost:3000
```

**Demo credentials:**

```
Email:    admin@sso.local
Password: ChangeMeAdmin123!
```

## Công nghệ

| Lớp | Công nghệ |
|------|-----------|
| Framework | NestJS + TypeScript |
| Authorization Server | `oidc-provider` (RFC 8414) |
| SSO Database | PostgreSQL 16 |
| Audit Log | MongoDB |
| HA Infrastructure | Patroni + etcd + HAProxy + PgBouncer |
| Deployment | Docker, Kubernetes / Helm, GitHub Actions |
| Metrics | Prometheus (`/metrics`) |

## Cấu trúc dự án

```
sso-vietprodev/
├── src/
│   ├── admin/           # Admin API (db-health, clients, users)
│   ├── app.module.ts
│   ├── auth/            # Auth service, session, password
│   ├── audit/           # Audit logger → MongoDB
│   ├── clients/         # OIDC client management
│   ├── config/          # Configuration & validation
│   ├── database/        # PostgreSQL & MongoDB clients
│   ├── db-manager/      # Multi-project DB connection manager
│   ├── health/          # Health check endpoints
│   ├── oidc/            # OIDC provider + interaction views
│   ├── project-integrations/  # User mapping across projects
│   ├── scheduler/       # Cron jobs (backup, health, cleanup)
│   ├── security/        # Rate limiting, brute-force, CSRF
│   └── users/           # Users CRUD
├── demo-projects/       # Demo backend projects (Demo A & B)
├── infrastructure/       # Docker, Helm, K8s, monitoring configs
├── migrations/          # SQL migrations for SSO DB
├── seeds/              # Seed data (admin user, roles, clients)
├── scripts/           # Utility scripts (JWKS, migration, smoke test)
├── config/            # Example configs (db-connections, oidc, clients)
├── guide/             # Vận hành & hướng dẫn chi tiết
├── docs/              # Tài liệu kiến trúc & kỹ thuật
└── plans/             # Kế hoạch phát triển
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Mục đích |
|--------|----------|-----------|
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/dependencies` | Chi tiết dependency status |
| GET | `/metrics` | Prometheus metrics |

### OIDC Endpoints

| Method | Endpoint | Mục đích |
|--------|----------|-----------|
| GET | `/.well-known/openid-configuration` | OIDC Discovery metadata |
| GET | `/oauth/authorize` | Authorization endpoint |
| POST | `/oauth/token` | Token exchange |
| GET | `/oauth/userinfo` | UserInfo |
| GET | `/oauth/jwks` | JWKS public keys |
| POST | `/oauth/introspect` | Token introspection |
| POST | `/oauth/revoke` | Token revocation |
| GET | `/oauth/logout` | RP-initiated logout |

### Admin API (requires `x-admin-api-key` header)

| Method | Endpoint | Mục đích |
|--------|----------|-----------|
| GET | `/admin/db-health` | Health check all DBs |
| GET | `/admin/clients` | List OIDC clients |
| POST | `/admin/clients/test-connection` | Test DB connection |

## Tài liệu

| Tài liệu | Nội dung |
|----------|----------|
| [guide/README.md](guide/README.md) | Mục lục guide — đọc theo thứ tự |
| [guide/01-local-setup.md](guide/01-local-setup.md) | Setup local từ đầu |
| [guide/00-setup-and-run-local-full.md](guide/00-setup-and-run-local-full.md) | Hướng dẫn chi tiết từng bước |
| [guide/13-demo-backend-multi-project-sso.md](guide/13-demo-backend-multi-project-sso.md) | Test demo multi-project SSO |
| [docs/architecture.md](docs/architecture.md) | Kiến trúc hệ thống |
| [docs/oauth2-oidc-flow.md](docs/oauth2-oidc-flow.md) | OAuth2/OIDC flow chi tiết |
| [plans/sso-project-plan.md](plans/sso-project-plan.md) | Kế hoạch tổng thể |
| [plans/sso-register-ui-session-db-ha-update-plan.md](plans/sso-register-ui-session-db-ha-update-plan.md) | Roadmap tiếp theo |
| [guide/rules.md](guide/rules.md) | Coding & security rules |

## Scripts

```bash
npm run start:dev      # Development server
npm run build          # Production build
npm run start:prod    # Production server

npm run lint           # ESLint
npm run format         # Prettier format
npm run typecheck     # TypeScript type check

npm run migration:run  # Run SQL migrations
npm run seed          # Seed database
npm run jwks:generate # Generate OIDC signing keys
npm run db:test       # Test DB connections
npm run smoke:oidc    # Smoke test OIDC discovery

npm test              # Unit tests
npm run test:e2e      # E2E tests
```

## Demo Projects

2 backend demo mô phỏng Project A/B thật, dùng để test multi-project SSO flow.

```
demo-projects/
├── demo-project-a-api/   # Port 3001
└── demo-project-b-api/   # Port 3002
```

Mỗi demo project chạy độc lập và kết nối SSO tại `http://localhost:3000`. Xem chi tiết tại [demo-projects/demo-project-a-api/README.md](demo-projects/demo-project-a-api/README.md).

## Bảo mật

- Password hash bằng Argon2id
- PKCE bắt buộc (`S256`) cho public clients
- Redirect URI exact match — không wildcard
- Refresh token rotation
- Rate limiting & brute-force protection
- Audit log (MongoDB) cho mọi auth event
- Không commit `.env`, private key, secret
