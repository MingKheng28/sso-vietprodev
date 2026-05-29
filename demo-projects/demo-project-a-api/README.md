# Demo Project A API

Backend demo mô phỏng Project A/B thật để test multi-project SSO.

## Stack

- Express.js + TypeScript + Node.js.
- Sequelize + PostgreSQL.
- Resource-style route convention mô phỏng `express-automatic-routes`.
- JWT access/refresh token nội bộ.
- HttpOnly cookies `access_token`, `refresh_token`.
- OIDC Authorization Code Flow + PKCE `S256` tới SSO core.

## Chuẩn bị DB

1. Tạo database `demo_project_a`.
2. Chạy schema SQL trong `../../guide/14-demo-db-schema-sql.md` vào database `demo_project_a`.

## Chạy local

```cmd
copy .env.example .env
npm install
npm run start:dev
```

Sửa `DATABASE_URL` trong `.env` theo user/password PostgreSQL local thực tế trước khi chạy.

## URL test

```text
http://localhost:3001/health
http://localhost:3001/auth/sso/start
http://localhost:3001/auth/me
```

## Kiểm tra typecheck

```cmd
npm run typecheck
```
