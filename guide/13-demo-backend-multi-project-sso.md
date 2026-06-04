# Guide demo backend multi-project SSO

Guide này mô tả cách test sau khi tạo 2 backend demo mô phỏng Project A/B thật.

## 1. Mục tiêu test

Chứng minh SSO hoạt động giống Google cho nhiều project:

1. User vào Demo Project A.
2. Demo Project A redirect sang SSO.
3. User login tại SSO.
4. Demo Project A nhận callback và tự tạo session nội bộ.
5. User mở Demo Project B.
6. Demo Project B redirect sang SSO.
7. Vì SSO session còn hiệu lực, user không cần nhập lại password.
8. Demo Project B nhận callback và tự tạo session nội bộ riêng.

## 2. Setup local cần thêm gì?

Khi tạo Demo Project A/B, bạn cần thêm **PostgreSQL database riêng cho từng demo project**. Các thành phần khác hầu như giữ nguyên.

| Thành phần | Có cần thêm/sửa không? | Ghi chú |
|---|---|---|
| PostgreSQL | Có | Tạo thêm DB `demo_project_a` và `demo_project_b`, có thể tạo bằng pgAdmin4 hoặc migration script |
| pgAdmin4 | Có thể dùng | Chỉ là công cụ thao tác DB, không bắt buộc nếu script tự tạo DB/schema |
| Docker | Không bắt buộc sửa nếu đang dùng PostgreSQL hiện có | Nếu dùng [`docker-compose.local.yml`](../docker-compose.local.yml) hiện tại thì vẫn dùng chung container PostgreSQL port `5432` |
| MongoDB | Không cần tạo thêm DB riêng | SSO vẫn dùng MongoDB audit `sso_audit`; demo backend không cần MongoDB ở giai đoạn này |
| SSO `.env` | Có thể cần thêm connection string demo nếu SSO cần health/readiness tới demo DB | Ví dụ `DEMO_PROJECT_A_DATABASE_URL`, `DEMO_PROJECT_B_DATABASE_URL` |
| Demo project `.env` | Có | Mỗi demo backend cần DB URL, JWT secrets nội bộ, SSO issuer/client config |
| SSO DB `clients` | Có | Cần seed/register thêm `demo-project-a-api`, `demo-project-b-api` với callback đúng |

Kết luận ngắn gọn: trước mắt bạn chỉ cần tạo thêm 2 database PostgreSQL cho demo. Docker/MongoDB không phải đổi nếu local hiện tại đã chạy ổn.

## 3. Cổng local dự kiến

| Service | URL |
|---|---|
| SSO API | `http://localhost:3000` |
| Demo Project A API | `http://localhost:3001` |
| Demo Project B API | `http://localhost:3002` |
| PostgreSQL local | `localhost:5432` |
| MongoDB audit local | `localhost:27017` |

## 4. Tạo database demo bằng pgAdmin4

Nếu bạn dùng pgAdmin4 như ảnh hiện tại, làm như sau:

1. Mở pgAdmin4.
2. Chọn server PostgreSQL đang dùng local.
3. Chuột phải vào `Databases`.
4. Chọn `Create` -> `Database`.
5. Tạo DB thứ nhất:

```text
demo_project_a
```

6. Tạo DB thứ hai:

```text
demo_project_b
```

7. Owner có thể để user PostgreSQL hiện tại, ví dụ `postgres` hoặc `sso_app_user` tùy kết nối local của bạn.

Sau khi tạo xong, trong pgAdmin4 bạn sẽ thấy thêm 2 DB mới dưới `Databases`.

## 5. Tạo database demo bằng SQL

Nếu muốn tạo nhanh bằng Query Tool trong pgAdmin4, chạy:

```sql
CREATE DATABASE demo_project_a;
CREATE DATABASE demo_project_b;
```

Nếu database đã tồn tại, PostgreSQL sẽ báo lỗi `already exists`; khi đó bỏ qua hoặc xóa DB cũ nếu muốn reset.

## 6. Connection string dự kiến cho demo backend

Mỗi demo backend sẽ có file `.env` riêng.

Demo Project A:

```env
PORT=3001
APP_CODE=DEMO_PROJECT_A
DATABASE_URL=postgresql://sso_app_user:password@localhost:5432/demo_project_a
SSO_ISSUER=http://localhost:3000
SSO_CLIENT_ID=demo-project-a-api
SSO_REDIRECT_URI=http://localhost:3001/auth/sso/callback
JWT_ACCESS_SECRET=demo-a-access-secret-change-me
JWT_REFRESH_SECRET=demo-a-refresh-secret-change-me
COOKIE_SECURE=false
```

Demo Project B:

```env
PORT=3002
APP_CODE=DEMO_PROJECT_B
DATABASE_URL=postgresql://sso_app_user:password@localhost:5432/demo_project_b
SSO_ISSUER=http://localhost:3000
SSO_CLIENT_ID=demo-project-b-api
SSO_REDIRECT_URI=http://localhost:3002/auth/sso/callback
JWT_ACCESS_SECRET=demo-b-access-secret-change-me
JWT_REFRESH_SECRET=demo-b-refresh-secret-change-me
COOKIE_SECURE=false
```

Nếu local PostgreSQL của bạn dùng user `postgres` thay vì `sso_app_user`, đổi connection string tương ứng, ví dụ:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/demo_project_a
```

## 7. Có cần sửa Docker Compose không?

Có 2 lựa chọn.

### Lựa chọn A: Không sửa Docker Compose

Dùng PostgreSQL local/container hiện có và tạo DB `demo_project_a`, `demo_project_b` bằng pgAdmin4.

Đây là cách đơn giản nhất cho giai đoạn hiện tại.

### Lựa chọn B: Sửa Docker Compose sau này

Sau khi code demo ổn, có thể cập nhật [`docker-compose.local.yml`](../docker-compose.local.yml) để tự init thêm DB demo bằng script. Cách này phù hợp khi muốn người khác clone project và chạy tự động hoàn toàn.

Giai đoạn này ưu tiên Lựa chọn A để tránh làm phức tạp setup.

## 8. Có cần sửa MongoDB không?

Không cần.

MongoDB hiện dùng cho audit log của SSO. Demo Project A/B không cần MongoDB riêng. Khi Demo A/B login qua SSO, audit vẫn ghi ở SSO vào MongoDB `sso_audit` như hiện tại.

## 9. SQL schema cho demo DB

Sau khi tạo `demo_project_a` và `demo_project_b`, chạy schema SQL trong từng DB theo file:

- [`14-demo-db-schema-sql.md`](14-demo-db-schema-sql.md)

File này chứa:

- SQL tạo bảng `users`, `user_auth`, `roles`, `permissions`, `user_roles`, `role_permissions`, `user_sessions`.
- SQL tạo view `active_users`, `user_role_details`, `user_sessions_detailed`.
- SQL seed role/permission/user demo.
- Query kiểm tra sau khi chạy.
- Query reset schema demo nếu cần.

## 10. Sau khi tạo DB thì code demo nằm ở đâu?

Code demo backend đã được scaffold trong workspace hiện tại:

```text
demo-projects/
  demo-project-a-api/
  demo-project-b-api/
```

Mỗi demo backend có source code, package riêng, `.env` riêng và chạy port riêng:

- SSO core: `http://localhost:3000`.
- Demo Project A API: `http://localhost:3001`.
- Demo Project B API: `http://localhost:3002`.

Cấu trúc chính của mỗi demo:

```text
demo-project-a-api/
  package.json
  tsconfig.json
  .env.example
  src/
    app.ts
    server.ts
    config.ts
    database.ts
    models.ts
    auth.middleware.ts
    local-auth.service.ts
    session.service.ts
    sso.service.ts
    routes/
```

Demo backend hiện có:

- Express.js + TypeScript + Node.js.
- Sequelize model mapping theo schema demo.
- Resource-style route convention mô phỏng `express-automatic-routes`.
- JWT access/refresh token nội bộ.
- HttpOnly cookies `access_token`, `refresh_token`.
- Bảng `user_sessions` lưu hash token dạng `BYTEA`, không lưu plaintext token.
- OIDC Authorization Code Flow + PKCE `S256` tới SSO.

## 11. Thứ tự làm việc trong VS Code

Sau khi DB đã có, thứ tự đúng là:

### Bước 1: Hoàn tất DB schema

Trong pgAdmin4:

1. Chọn `demo_project_a`.
2. Chạy SQL schema từ [`14-demo-db-schema-sql.md`](14-demo-db-schema-sql.md).
3. Chọn `demo_project_b`.
4. Chạy cùng SQL schema.

### Bước 2: Kiểm tra code demo backend đã scaffold

Code đã nằm tại:

```text
demo-projects/demo-project-a-api
demo-projects/demo-project-b-api
```

Dependency đã được cài bằng `npm install` trong từng demo project. Typecheck 2 demo project đã pass.

Nếu cần cài lại dependency sau khi clone mới, chạy:

```cmd
npm install
```

trong từng thư mục demo project.

### Bước 3: Tạo `.env` cho từng demo

Demo A:

```text
demo-projects/demo-project-a-api/.env
```

Demo B:

```text
demo-projects/demo-project-b-api/.env
```

Nội dung lấy theo mục 6 của guide này.

### Bước 4: Register client demo trong SSO

Seed SSO đã được cập nhật để register/upsert client demo trong [`seed-demo-clients.ts`](../seeds/seed-demo-clients.ts).

SSO DB cần có client:

```text
demo-project-a-api
```

và:

```text
demo-project-b-api
```

với redirect URI:

```text
http://localhost:3001/auth/sso/callback
http://localhost:3002/auth/sso/callback
```

Chạy seed SSO từ root project sau khi PostgreSQL/SSO DB đã sẵn sàng:

```cmd
npm run seed
```

Nếu SSO server đang chạy trước khi seed client demo, restart SSO để `oidc-provider` load lại danh sách client active từ DB.

### Bước 5: Chạy 3 server

Terminal 1 chạy SSO:

```cmd
npm run start:dev
```

Terminal 2 chạy Demo A tại [`demo-project-a-api`](../demo-projects/demo-project-a-api):

```cmd
copy .env.example .env
npm run start:dev
```

Terminal 3 chạy Demo B tại [`demo-project-b-api`](../demo-projects/demo-project-b-api):

```cmd
copy .env.example .env
npm run start:dev
```

Lưu ý:

- Terminal 2 và Terminal 3 phải chạy đúng thư mục project demo tương ứng.
- Sửa `DATABASE_URL` trong từng `.env` theo user/password PostgreSQL local thực tế của bạn.
- Trước khi chạy demo server, DB `demo_project_a` và `demo_project_b` phải có schema từ [`14-demo-db-schema-sql.md`](14-demo-db-schema-sql.md).

### Bước 6: Test luồng SSO nhiều project

1. Mở Demo A `/auth/sso/start`.
2. Login ở SSO.
3. Demo A nhận callback và tạo session nội bộ.
4. Mở Demo B `/auth/sso/start`.
5. Demo B dùng SSO session hiện có và tạo session nội bộ riêng.

## 12. URL test dự kiến

### 12.1. Kiểm tra SSO

```text
http://localhost:3000/health/live
http://localhost:3000/.well-known/openid-configuration
```

### 12.2. Kiểm tra Demo A

```text
http://localhost:3001/health
http://localhost:3001/auth/me
http://localhost:3001/auth/sso/start
```

### 12.3. Kiểm tra Demo B

```text
http://localhost:3002/health
http://localhost:3002/auth/me
http://localhost:3002/auth/sso/start
```

## 13. Kịch bản test chính

### Bước 1: Mở Demo A

Mở:

```text
http://localhost:3001/auth/sso/start
```

Kỳ vọng:

- Trình duyệt được redirect sang SSO `/oauth/authorize`.
- SSO hiển thị login UI nếu chưa có SSO session.

### Bước 2: Login tại SSO

Dùng user seed SSO:

```text
Email: admin@sso.local
Password: ChangeMeAdmin123!
```

Kỳ vọng:

- SSO redirect về `http://localhost:3001/auth/sso/callback`.
- Demo A đổi authorization code lấy token.
- Demo A tạo JWT access/refresh token nội bộ.
- Demo A set HttpOnly cookies.

### Bước 3: Kiểm tra session Demo A

Mở:

```text
http://localhost:3001/auth/me
```

Kỳ vọng:

- Trả thông tin user nội bộ của Demo A.
- Không trả token plaintext.

### Bước 4: Mở Demo B

Mở:

```text
http://localhost:3002/auth/sso/start
```

Kỳ vọng:

- Demo B redirect sang SSO.
- Vì SSO session còn hiệu lực, user không cần nhập lại password hoặc chỉ cần confirm rất nhanh tùy config interaction.
- SSO redirect về `http://localhost:3002/auth/sso/callback`.
- Demo B tạo session nội bộ riêng.

### Bước 5: Kiểm tra session Demo B

Mở:

```text
http://localhost:3002/auth/me
```

Kỳ vọng:

- Trả thông tin user nội bộ của Demo B.
- Session Demo B độc lập với session Demo A.

## 14. Swagger UI - Test API bằng giao diện

Cả Demo A và Demo B đã được tích hợp Swagger UI. Đây là cách test API tốt nhất thay vì dùng browser trực tiếp.

### Mở Swagger UI

| Project | Swagger URL |
|---------|-----------|
| Demo A | `http://localhost:3001/docs` |
| Demo B | `http://localhost:3002/docs` |

### Cách test SSO flow qua Swagger

**Bước 1:** Mở `http://localhost:3001/docs` trên trình duyệt.

**Bước 2:** Trong Swagger UI, tìm section **Auth - SSO**, click **GET /auth/sso/start**, click **Try it out**, rồi click **Execute**.

Swagger sẽ gửi request và hiển thị:
- **Response Code**: `302` (Redirect)
- **Response Headers**: `Location` chứa URL SSO authorize

**Bước 3:** Copy URL từ `Location` header (hoặc click link trong Swagger response nếu có).

**Bước 4:** Dán URL vào trình duyệt mới (hoặc tab mới trong cùng trình duyệt). Trình duyệt sẽ redirect đến trang login SSO.

**Bước 5:** Đăng nhập bằng:
```
Email: admin@sso.local
Password: ChangeMeAdmin123!
```

**Bước 6:** Sau khi login, SSO redirect về Demo A callback URL. Trình duyệt sẽ hiển thị JSON response chứa thông tin user.

**Bước 7:** Copy giá trị `access_token` từ cookie (mở DevTools → Application → Cookies → localhost:3001 → access_token).

**Bước 8:** Quay lại Swagger UI, click **GET /auth/me**, click **Try it out**, paste `access_token` vào ô **Authorization** (dạng: `Bearer <token>`), click **Execute**.

**Kỳ vọng**: Response 200 với thông tin user.

### Ưu điểm của Swagger so với browser

| Browser trực tiếp | Swagger UI |
|---|---|
| Cookie không persist giữa redirects | Giữ auth state qua `persistAuthorization` |
| Khó copy token/cookie | Copy/paste dễ dàng |
| Không hiển thị request/response chi tiết | Full request/response details |
| Không phân biệt environments | Mỗi project 1 Swagger riêng |

### Restart sau khi cài Swagger

Nếu demo project đang chạy, cần restart để nhận Swagger:

1. Tắt terminal đang chạy Demo A/B (Ctrl+C)
2. Chạy lại:

```cmd
cd demo-projects\demo-project-a-api
npm run start:dev
```

Mở tab mới:

```cmd
cd demo-projects\demo-project-b-api
npm run start:dev
```

## 15. Kịch bản lỗi cần test

| Tình huống | Kỳ vọng |
|---|---|
| Sai `redirect_uri` | SSO từ chối hoặc redirect lỗi theo chuẩn OIDC |
| Sai `state` | Demo callback từ chối request |
| Sai `code_verifier` | Token endpoint từ chối |
| Xóa cookie Demo A | Demo A mất session, Demo B không bị ảnh hưởng |
| Logout Demo A | Session Demo A bị deactivate, Demo B không bị ảnh hưởng |
| SSO session hết hạn | Demo B redirect sang SSO và yêu cầu login lại |

## 16. Kiểm tra build/typecheck hiện tại

Các lệnh đã pass trong giai đoạn scaffold:

```cmd
npm run typecheck
```

ở [`demo-project-a-api`](../demo-projects/demo-project-a-api) và [`demo-project-b-api`](../demo-projects/demo-project-b-api).

```cmd
npm run build
```

ở root SSO project.

## 17. Kết quả dùng để xin duyệt Project thật

Sau khi demo pass, cần ghi lại:

- Ảnh hoặc video flow Demo A sang SSO rồi quay lại Demo A.
- Ảnh hoặc video flow mở Demo B không cần nhập lại password.
- Log audit SSO.
- DB `user_sessions` của Demo A và Demo B chứng minh session nội bộ riêng.
- Code callback Resource object để làm mẫu áp dụng cho Project A/B thật.

## 18. Nguyên tắc không được vi phạm

- Không dùng DB thật Project A/B trong demo nếu chưa được phê duyệt.
- Không copy secret thật của Project A/B.
- Không ghi vào `user_sessions` của Project A/B thật.
- Không deploy bất kỳ thay đổi nào vào Project A/B thật trong giai đoạn demo.
