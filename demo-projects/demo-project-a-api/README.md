# Demo Project A API

Backend demo mô phỏng Project A thật để test multi-project SSO.

## Stack

- Express.js + TypeScript + Node.js.
- Sequelize + PostgreSQL.
- Resource-style route convention (bindResource utility mô phỏng `express-automatic-routes`).
- JWT access/refresh token nội bộ.
- HttpOnly cookies `access_token`, `refresh_token`.
- OIDC Authorization Code Flow + PKCE `S256` tới SSO core.
- OIDC Discovery tự động fallback về hardcoded endpoints.

> **Lưu ý:** Package `express-automatic-routes` không còn được maintain (last update 2021). Dự án dùng `bindResource()` utility trong `src/router.ts` để mô phỏng convention tương tự. Đây là demo-only; production nên cân nhắc `express-file-routing` hoặc tự implement routing.

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

## Test SSO Flow end-to-end

### Luồng 1: Demo A -> SSO -> Demo A -> Demo B -> SSO -> Demo B

1. **Khởi động tất cả servers:**

```cmd
# Terminal 1: SSO
cd c:\VietProDev\sso-vietprodev
npm run start:dev

# Terminal 2: Demo A
cd c:\VietProDev\sso-vietprodev\demo-projects\demo-project-a-api
npm run start:dev

# Terminal 3: Demo B
cd c:\VietProDev\sso-vietprodev\demo-projects\demo-project-b-api
npm run start:dev
```

2. **Login Demo A qua SSO:**

```
http://localhost:3001/auth/sso/start
```

Trình duyệt sẽ redirect sang SSO. Login bằng:

```
Email: admin@sso.local
Password: ChangeMeAdmin123!
```

Sau khi login thành công, SSO redirect về Demo A. Kiểm tra:

```
http://localhost:3001/auth/me
```

Kết quả mong đợi: `{ message: "SSO login success", appCode: "DEMO_PROJECT_A", user: {...} }`

3. **Mở Demo B (SSO session còn hiệu lực):**

```
http://localhost:3002/auth/sso/start
```

Vì SSO session còn tồn tại, user được redirect trực tiếp qua callback mà KHÔNG cần nhập lại password.

Kết quả mong đợi: Demo B nhận được callback, tạo session nội bộ riêng.

### Luồng 2: Test logout

1. **Logout SSO:**

```
GET http://localhost:3000/oauth/logout
```

2. **Login lại Demo B:**

```
http://localhost:3002/auth/sso/start
```

Lần này SSO sẽ yêu cầu nhập lại password vì session SSO đã bị xóa.

### Luồng 3: Demo A và Demo B có session riêng biệt

1. Login Demo A.
2. Login Demo B.
3. Logout chỉ Demo B (`POST http://localhost:3002/auth/logout`).
4. Demo A vẫn hoạt động (`http://localhost:3001/auth/me` vẫn trả user).
5. Demo B yêu cầu login lại.

### Vì sao Demo B không cần nhập lại password?

- SSO dùng cookie session riêng.
- Khi Demo B redirect sang SSO với SSO session còn hiệu lực, SSO skip trang login.
- SSO redirect về Demo B với authorization code.
- Demo B đổi code lấy token và tạo session nội bộ riêng.
- Demo A và Demo B có session cookies khác nhau.

## URL test

```text
http://localhost:3001/
http://localhost:3001/health
http://localhost:3001/auth/sso/start
http://localhost:3001/auth/sso/callback
http://localhost:3001/auth/me
http://localhost:3001/auth/refresh
```

## Kiểm tra typecheck

```cmd
npm run typecheck
```

## Security notes

- State + code_verifier được lưu trong Map với TTL 5 phút. Cleanup định kỳ mỗi 60 giây.
- Demo-only: production cần dùng Redis/database cho state store.
- Logging đã sanitize: không log access_token, refresh_token, authorization code, client secret.
