# Kiến trúc SSO

Theo kế hoạch tại `plans/sso-project-plan.md`, SSO dùng NestJS, `oidc-provider`, PostgreSQL HA endpoint qua PgBouncer/HAProxy và MongoDB audit.

## Mô hình tổng thể

SSO đóng vai trò OAuth2/OIDC Authorization Server trung tâm. Các project tích hợp đóng vai trò OAuth/OIDC client hoặc relying party.

Các khối chính:

- SSO API: authorize, token, userinfo, JWKS, logout, admin API.
- SSO PostgreSQL: users, clients, mappings, sessions, refresh tokens.
- Project DB connections: kết nối PostgreSQL tới DB từng project bằng connection string.
- MongoDB audit: lưu login/logout/token/db/failover events.
- Observability: health endpoints và Prometheus metrics.

## Project A/B hiện tại

Project A và Project B là hệ thống thật, dùng Express.js + TypeScript + Node.js, Sequelize và `express-automatic-routes`. Hai project đang có custom JWT session riêng bằng access/refresh token, HttpOnly cookie và bảng `user_sessions`.

Vì hiện tại chưa được sửa code Project A/B, kiến trúc tích hợp phải tách rõ:

- SSO core vẫn triển khai đầy đủ.
- Project A/B chỉ kết nối read-only/readiness.
- Full OIDC callback/session bridge chờ phê duyệt sửa code.

Chi tiết xem `docs/project-ab-integration-strategy.md`.
