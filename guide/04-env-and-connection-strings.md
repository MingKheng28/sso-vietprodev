# Env and Connection Strings

Tài liệu này hướng dẫn cách cấu hình biến môi trường và quản lý connection string an toàn.

## Nguyên tắc bảo mật

1. **Không commit `.env` thật lên Git.** Luôn dùng `.env.example` làm mẫu.
2. **Production phải dùng secret store** (Kubernetes Secret, AWS Secrets Manager, Azure Key Vault, v.v.).
3. **Mỗi môi trường có secret riêng**: dev, staging, production không dùng chung.
4. **SSO DB production phải trỏ tới PgBouncer/HAProxy endpoint**, không trỏ thẳng vào PostgreSQL node.

## Các biến môi trường chính

### Database URLs

| Biến | Mô tả | Ví dụ local | Ví dụ production |
|---|---|---|---|
| `SSO_LOGIN_PRIMARY_URL` | PostgreSQL SSO DB chính | `localhost:5432` | `pgbouncer.internal:6432` |
| `SSO_LOGIN_BACKUP_URL` | PostgreSQL SSO DB backup | `localhost:5432` | `pgbouncer-backup.internal:6432` |
| `PROJECT_A_DATABASE_URL` | PostgreSQL Project A | `localhost:5432/project_a` | `project-a.internal:5432/project_a` |
| `PROJECT_B_DATABASE_URL` | PostgreSQL Project B | `localhost:5432/project_b` | `project-b.internal:5432/project_b` |
| `MONGODB_AUDIT_URL` | MongoDB audit cluster | `localhost:27017` | `mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0` |

### OIDC Configuration

| Biến | Mô tả |
|---|---|
| `OIDC_ISSUER` | Issuer URL, phải khớp với thực tế. Local: `http://localhost:3000`, Production: `https://sso.domain.com` |
| `OIDC_PRIVATE_JWK_PATH` | Đường dẫn tới private key cho signing token |
| `OIDC_PUBLIC_JWKS_PATH` | Đường dẫn tới public JWKS |
| `OIDC_COOKIE_KEYS` | Danh sách key cho oidc-provider cookie, phân cách bằng dấu phẩy |
| `OIDC_ACCESS_TOKEN_TTL` | TTL access token (giây). Khuyến nghị: 900 (15 phút) |
| `OIDC_REFRESH_TOKEN_TTL` | TTL refresh token (giây). Khuyến nghị: 2592000 (30 ngày) |

### Security

| Biến | Mô tả |
|---|---|
| `SESSION_SECRET` | Secret cho cookie-parser, tối thiểu 32 ký tự |
| `ADMIN_API_KEY` | API key cho admin endpoints |
| `COOKIE_SECURE` | `true` cho HTTPS, `false` cho HTTP local |
| `SSO_RATE_LIMIT_ENABLED` | Bật/tắt rate limiting |
| `SSO_BRUTE_FORCE_LOCKOUT_THRESHOLD` | Số lần login sai trước khi khóa (mặc định: 5) |
| `SSO_BRUTE_FORCE_LOCKOUT_DURATION_MINUTES` | Thời gian khóa (phút, mặc định: 15) |

### HA Infrastructure

| Biến | Mô tả |
|---|---|
| `HAPROXY_STATS_URL` | HAProxy stats endpoint (CSV) |
| `PATRONI_API_URL` | Patroni REST API endpoint |
| `PGBOUNCER_DATABASE_URL` | PgBouncer admin connection |

## Connection String Format

### PostgreSQL URL

```
postgresql://[user]:[password]@[host]:[port]/[database][?params]
```

Ví dụ:

```
postgresql://sso_app_user:ChangeMe@pgbouncer.internal:6432/sso_login?sslmode=require
```

### MongoDB URL

```
mongodb://[user]:[password]@[host1]:[port],[host2]:[port]/[database]?replicaSet=[rs]&[params]
```

Ví dụ:

```
mongodb://mongo_user:ChangeMe@mongo1:27017,mongo2:27017,mongo3:27017/sso_audit?replicaSet=rs0&authSource=admin
```

## Cách điền .env

### 1. Copy từ .env.example

```cmd
copy .env.example .env
```

### 2. Điền connection strings

Đối với local dev:

```
SSO_LOGIN_PRIMARY_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
SSO_LOGIN_BACKUP_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
PROJECT_A_DATABASE_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
PROJECT_B_DATABASE_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
MONGODB_AUDIT_URL=mongodb://localhost:27017/sso_audit
```

### 3. Điền OIDC issuer

```
OIDC_ISSUER=http://localhost:3000
```

### 4. Tạo SESSION_SECRET

Dùng tool tạo secret ngẫu nhiên, ví dụ:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 5. Tạo ADMIN_API_KEY

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Sửa .env cho local đơn giản

Khi dùng `docker-compose.local.yml` (PostgreSQL ở port `5432` trực tiếp, không qua PgBouncer):

```
SSO_LOGIN_PRIMARY_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
SSO_LOGIN_BACKUP_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
```

Khi dùng `docker-compose.ha.yml` (qua PgBouncer ở port `6432`):

```
SSO_LOGIN_PRIMARY_URL=postgresql://sso_app_user:password@localhost:6432/sso_login
SSO_LOGIN_BACKUP_URL=postgresql://sso_app_user:password@localhost:6432/sso_login
```

## Production Kubernetes Secret

Ví dụ Kubernetes Secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: sso-api-secrets
  namespace: sso-prod
type: Opaque
stringData:
  SSO_LOGIN_PRIMARY_URL: "postgresql://sso_app_user:CHANGE_ME@pgbouncer.internal:6432/sso_login"
  SSO_LOGIN_BACKUP_URL: "postgresql://sso_app_user:CHANGE_ME@pgbouncer.internal:6432/sso_login"
  MONGODB_AUDIT_URL: "mongodb://mongo_user:CHANGE_ME@mongo1:27017,mongo2:27017,mongo3:27017/sso_audit?replicaSet=rs0"
  SESSION_SECRET: "CHANGE_ME_random_secret_32_chars_minimum"
  ADMIN_API_KEY: "CHANGE_ME"
  OIDC_PRIVATE_JWK_PATH: "/run/secrets/oidc-private.jwk"
```

## Checklist

- [ ] `.env` không có trong Git (đã có trong `.gitignore`)
- [ ] Connection strings dùng đúng port (5432 local, 6432 PgBouncer)
- [ ] Passwords đủ mạnh (không dùng `password` cho production)
- [ ] `SESSION_SECRET` có ít nhất 32 ký tự
- [ ] `OIDC_ISSUER` khớp với thực tế
- [ ] `COOKIE_SECURE=true` cho production HTTPS
- [ ] Production dùng Kubernetes Secret hoặc secret manager
