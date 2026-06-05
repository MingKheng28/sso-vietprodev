# Hướng dẫn vận hành SSO VietProDev

## Mục lục

1. [Bắt đầu nhanh](#1-bắt-đầu-nhanh)
2. [Thứ tự đọc khuyến nghị](#2-thứ-tự-đọc-khuyến-nghị)
3. [Lưu ý về Project A/B thật](#3-lưu-ý-về-project-ab-thật)
4. [Vai trò và hướng đọc](#4-vai-trò-và-hướng-đọc)

---

## 1. Bắt đầu nhanh

Đọc [00-setup-and-run-local-full.md](00-setup-and-run-local-full.md) nếu bạn chưa từng mở dự án này. File đó hướng dẫn chi tiết từ cài phần mềm, chạy local, kiểm tra health và test OIDC login.

Tóm tắt nhanh nếu đã quen:

```bash
npm install
copy .env.example .env
# Sửa SSO_LOGIN_PRIMARY_URL dùng port 5432
docker compose -f docker-compose.local.yml up -d
npm run migration:run
npm run seed
npm run jwks:generate
npm run start:dev
```

Kiểm tra:

```
http://localhost:3000/health/live
http://localhost:3000/.well-known/openid-configuration
http://localhost:3000/metrics
```

---

## 2. Thứ tự đọc khuyến nghị

### Local setup

| Bước | File | Mục đích |
|-------|------|-----------|
| 1 | [00-setup-and-run-local-full.md](00-setup-and-run-local-full.md) | Setup toàn diện từ đầu |
| 2 | [01-local-setup.md](01-local-setup.md) | Tóm tắt setup local |
| 3 | [02-pgadmin4-postgresql-setup.md](02-pgadmin4-postgresql-setup.md) | Thao tác PostgreSQL bằng pgAdmin4 |
| 4 | [03-mongodb-compass-cluster-setup.md](03-mongodb-compass-cluster-setup.md) | Thao tác MongoDB bằng Compass |
| 5 | [04-env-and-connection-strings.md](04-env-and-connection-strings.md) | Cấu hình `.env` và connection string |

### OIDC & Integration

| Bước | File | Mục đích |
|-------|------|-----------|
| 6 | [05-oidc-client-registration.md](05-oidc-client-registration.md) | Đăng ký OAuth2/OIDC client |
| 7 | [06-project-db-onboarding.md](06-project-db-onboarding.md) | Thêm project mới vào SSO |
| 8 | [13-demo-backend-multi-project-sso.md](13-demo-backend-multi-project-sso.md) | Test demo backend multi-project SSO |
| 9 | [14-demo-db-schema-sql.md](14-demo-db-schema-sql.md) | Schema SQL cho demo DB |

### Production & Operations

| Bước | File | Mục đích |
|-------|------|-----------|
| 10 | [07-patroni-etcd-haproxy-pgbouncer.md](07-patroni-etcd-haproxy-pgbouncer.md) | PostgreSQL HA production |
| 11 | [08-kubernetes-helm-deployment.md](08-kubernetes-helm-deployment.md) | Deploy Kubernetes/Helm |
| 12 | [09-monitoring-prometheus-grafana-alertmanager.md](09-monitoring-prometheus-grafana-alertmanager.md) | Monitoring/alerting |
| 13 | [10-cicd-release-rollback.md](10-cicd-release-rollback.md) | CI/CD, release, rollback |
| 14 | [11-security-production-checklist.md](11-security-production-checklist.md) | Checklist bảo mật production |
| 15 | [12-incident-response-runbook.md](12-incident-response-runbook.md) | Xử lý sự cố |

---

## 3. Lưu ý về Project A/B thật

Project A (`https://vcci-news.vercel.app/`) và Project B (`https://sied-dev.meucorp.com/`) là hệ thống thật của công ty, **chưa được phép sửa code**. Vì vậy:

- Các guide OIDC/onboarding hiện là bước **chuẩn bị tích hợp / readiness**, chưa phải go-live SSO vào Project A/B thật.
- Demo backend (Demo A/B) trong `demo-projects/` mô phỏng Project A/B để test SSO flow mà không ảnh hưởng hệ thống thật.
- Chiến lược chi tiết: xem [plans/sso-project-plan.md](../plans/sso-project-plan.md) sections 1.1–1.4.

---

## 4. Vai trò và hướng đọc

| Vai trò | Đọc |
|---------|------|
| Developer mới | `00-setup-and-run-local-full.md` → demo SSO (`13-demo...md`) → coding rules |
| Developer | Setup local, OIDC client, demo backend, coding rules |
| DevOps | HA (`07-...`), Kubernetes (`08-...`), monitoring (`09-...`), CI/CD (`10-...`), security (`11-...`) |
| Admin | pgAdmin4 (`02-...`), MongoDB (`03-...`), onboarding (`06-...`), incident response (`12-...`) |
