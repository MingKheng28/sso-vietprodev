# sso-vietprodev

Production-ready SSO Authorization Server scaffold theo kế hoạch tại `plans/sso-project-plan.md`.

## Trạng thái tích hợp Project A/B

Project A (`https://vcci-news.vercel.app/`) và Project B (`https://sied-dev.meucorp.com/`) là hệ thống thật của công ty. Hai project hiện dùng Express.js + TypeScript + Node.js, Sequelize, `express-automatic-routes`, backend/frontend riêng và custom JWT access/refresh token bằng HttpOnly cookie + bảng `user_sessions`.

Ràng buộc hiện tại: chưa được sửa bất kỳ code nào của Project A/B. Vì vậy dự án SSO đang triển khai theo hướng an toàn:

- Hoàn thiện SSO core production-ready.
- Kết nối DB Project A/B ở mức read-only/readiness nếu được cấp quyền.
- Chuẩn bị OIDC client config, user mapping, audit, health check và tài liệu callback tương lai.
- Chưa go-live login end-to-end vào Project A/B cho đến khi có phê duyệt thêm callback/token exchange/session bridge trong từng project.

## Stack chính

- NestJS + TypeScript.
- `oidc-provider` cho OAuth2/OIDC Authorization Server.
- PostgreSQL qua HA endpoint PgBouncer/HAProxy, quản lý HA bởi Patroni + etcd.
- MongoDB audit log.
- Prometheus metrics tại `/metrics`.
- Health endpoints: `/health/live`, `/health/ready`, `/health/dependencies`.
- Docker Compose local, Kubernetes/Helm production scaffold, GitHub Actions CI/CD scaffold.

## Chạy local

1. Copy `.env.example` thành `.env` và chỉnh connection string.
2. Chạy `docker compose -f docker-compose.local.yml up -d` nếu cần DB local.
3. Chạy `npm install`.
4. Chạy `npm run migration:run`.
5. Chạy `npm run seed`.
6. Chạy `npm run start:dev`.

## Tài liệu

- Kế hoạch tổng: `plans/sso-project-plan.md`.
- Guide thao tác: `guide/README.md`.
- Setup local chi tiết: `guide/00-setup-and-run-local-full.md`.
- Chiến lược tích hợp Project A/B: `docs/project-ab-integration-strategy.md`.
- Kiến trúc: `docs/architecture.md`.
