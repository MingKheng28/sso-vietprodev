# Demo Project B API

Backend demo mô phỏng Project B thật để test multi-project SSO.

## Stack

- Express.js + TypeScript + Node.js.
- Sequelize + PostgreSQL.
- Resource-style route convention (bindResource utility mô phỏng `express-automatic-routes`).
- JWT access/refresh token nội bộ.
- HttpOnly cookies `access_token`, `refresh_token`.
- OIDC Authorization Code Flow + PKCE `S256` tới SSO core.
- OIDC Discovery tự động fallback về hardcoded endpoints.

> **Lưu ý:** Package `express-automatic-routes` không còn được maintain (last update 2021). Dự án dùng `bindResource()` utility trong `src/router.ts` để mô phỏng convention tương tự. Đây là demo-only; production nên cân nhức `express-file-routing` hoặc tự implement routing.

## Chuẩn bị DB

1. Tạo database `demo_project_b`.
2. Chạy schema SQL trong `../../guide/14-demo-db-schema-sql.md` vào database `demo_project_b`.

## Chạy local

```cmd
copy .env.example .env
npm install
npm run start:dev
```

Sửa `DATABASE_URL` trong `.env` theo user/password PostgreSQL local thực tế trước khi chạy.

## Test SSO Flow end-to-end

Xem chi tiết tại README của Demo A: `../../demo-project-a-api/README.md`

Tóm tắt nhanh:

1. Login Demo A: `http://localhost:3001/auth/sso/start`
2. Login Demo B: `http://localhost:3002/auth/sso/start` (không cần nhập lại password nếu SSO session còn hiệu lực)
3. Logout Demo B: `POST http://localhost:3002/auth/logout` (chỉ logout Demo B, không ảnh hưởng Demo A hay SSO)
4. Logout SSO: `GET http://localhost:3000/oauth/logout`

## URL test

```text
http://localhost:3002/
http://localhost:3002/health
http://localhost:3002/auth/sso/start
http://localhost:3002/auth/sso/callback
http://localhost:3002/auth/me
http://localhost:3002/auth/refresh
```

## Kiểm tra typecheck

```cmd
npm run typecheck
```

## Security notes

- State + code_verifier được lưu trong Map với TTL 5 phút. Cleanup định kỳ mỗi 60 giây.
- Demo-only: production cần dùng Redis/database cho state store.
- Logging đã sanitize: không log access_token, refresh_token, authorization code, client secret.
