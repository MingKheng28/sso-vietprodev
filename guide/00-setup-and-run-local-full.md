# Hướng dẫn setup và chạy dự án SSO VietProDev từ đầu

Tài liệu này dành cho người mới mở dự án lần đầu và chưa biết cần cài gì, cấu hình gì, chạy lệnh nào, kiểm tra ở đâu.

> Mục tiêu của hướng dẫn: chạy được SSO API ở máy local bằng Node.js, PostgreSQL local, MongoDB local và Docker Compose.

---

## 1. Dự án này là gì?

Dự án này là backend SSO dùng để đăng nhập tập trung cho nhiều project.

### 1.1. Lưu ý quan trọng về Project A/B thật

Project A và Project B hiện là hệ thống thật của công ty:

- Project A: `https://vcci-news.vercel.app/`.
- Project B: `https://sied-dev.meucorp.com/`.

Hai project này dùng Express.js + TypeScript + Node.js, Sequelize, `express-automatic-routes`, backend/frontend riêng, custom JWT access/refresh token, HttpOnly cookie và bảng `user_sessions`.

Hiện tại theo quy định bảo mật công ty, **không được sửa bất kỳ code nào của Project A/B**. Vì vậy khi làm theo guide này cần hiểu đúng:

- Các bước local hiện tại kiểm tra SSO API, PostgreSQL/MongoDB, health, OIDC discovery, metrics và login UI của SSO.
- Chưa thể đăng nhập end-to-end vào Project A/B thật nếu Project A/B chưa có callback route/token exchange/session bridge.
- SSO có thể chuẩn bị kết nối DB, mapping user, audit, OIDC client config và tài liệu tích hợp.
- Không tự ghi session/token/cookie vào DB Project A/B khi chưa có phê duyệt bảo mật.

Stack hiện tại:

- Node.js + NestJS + TypeScript.
- OAuth2/OIDC bằng `oidc-provider`.
- PostgreSQL để lưu user, client, session, token, mapping.
- MongoDB để lưu audit log.
- Docker Compose để bật PostgreSQL và MongoDB local.
- Scripts migration/seed để tạo bảng và dữ liệu mẫu.

Các file quan trọng:

| File/thư mục | Ý nghĩa |
|---|---|
| `package.json` | Danh sách thư viện và lệnh chạy dự án |
| `.env.example` | Mẫu biến môi trường |
| `docker-compose.local.yml` | Bật PostgreSQL và MongoDB local |
| `migrations/` | SQL tạo bảng PostgreSQL |
| `seeds/` | Dữ liệu mẫu: roles, clients, admin user |
| `src/` | Source code NestJS |
| `config/db-connections.example.json` | Cấu hình mẫu kết nối DB SSO và project DB |
| `guide/` | Các guide vận hành theo từng chủ đề |

---

## 2. Cần cài phần mềm gì?

### 2.1. Bắt buộc cài

Bạn cần cài các phần mềm sau trên Windows:

1. Node.js LTS.
2. Docker Desktop.
3. Git.
4. Visual Studio Code.

### 2.2. Nên cài thêm để dễ quản lý DB

1. pgAdmin4 để xem PostgreSQL.
2. MongoDB Compass để xem MongoDB audit log.
3. Postman hoặc Insomnia để test API.

---

## 3. Cài Node.js

### 3.1. Tải Node.js

1. Mở trình duyệt.
2. Vào trang `https://nodejs.org`.
3. Tải bản LTS.
4. Cài đặt bình thường theo wizard.
5. Khi installer hỏi thêm tool, có thể để mặc định.

### 3.2. Kiểm tra Node.js đã cài chưa

Mở CMD hoặc Terminal trong VS Code và chạy:

```cmd
node -v
npm -v
```

Kỳ vọng:

- `node -v` in ra version, ví dụ `v22.x.x` hoặc `v20.x.x`.
- `npm -v` in ra version npm.

Nếu báo không nhận diện lệnh `node`, hãy đóng terminal, mở lại VS Code hoặc restart máy.

---

## 4. Cài Docker Desktop

### 4.1. Tải Docker Desktop

1. Vào `https://www.docker.com/products/docker-desktop/`.
2. Tải Docker Desktop for Windows.
3. Cài đặt theo wizard.
4. Sau khi cài xong, mở Docker Desktop.
5. Chờ Docker Desktop báo trạng thái đang chạy.

### 4.2. Kiểm tra Docker

Mở CMD hoặc Terminal trong VS Code và chạy:

```cmd
docker --version
docker compose version
```

Kỳ vọng:

- Có version Docker.
- Có version Docker Compose.

Nếu Docker báo lỗi engine chưa chạy, hãy mở Docker Desktop và chờ vài phút.

---

## 5. Cài Git

1. Vào `https://git-scm.com/download/win`.
2. Cài Git for Windows.
3. Mở CMD và chạy:

```cmd
git --version
```

Nếu có version là được.

---

## 6. Mở đúng thư mục dự án

Dự án hiện nằm ở:

```text
c:\VietProDev\sso-vietprodev
```

Trong VS Code:

1. Chọn File.
2. Chọn Open Folder.
3. Chọn thư mục `c:\VietProDev\sso-vietprodev`.
4. Mở Terminal trong VS Code bằng menu Terminal -> New Terminal.

Tất cả lệnh trong hướng dẫn này chạy tại thư mục gốc dự án.

Bạn có thể kiểm tra bằng lệnh:

```cmd
cd
```

Kỳ vọng terminal đang ở:

```text
c:\VietProDev\sso-vietprodev
```

---

## 7. Cài dependency Node.js

Chạy lệnh:

```cmd
npm install
```

Lệnh này đọc `package.json` và tải thư viện vào thư mục `node_modules`.

Khi hoàn tất, bạn sẽ thấy thư mục:

```text
node_modules
```

Nếu có cảnh báo `npm audit`, tạm thời chưa cần xử lý để chạy local. Cảnh báo bảo mật sẽ xử lý ở giai đoạn hardening trước production.

---

## 8. Bật PostgreSQL và MongoDB local bằng Docker

Dự án có file `docker-compose.local.yml` để bật nhanh:

- PostgreSQL local ở port `5432`.
- MongoDB local ở port `27017`.

Chạy lệnh:

```cmd
docker compose -f docker-compose.local.yml up -d
```

Kiểm tra container đã chạy:

```cmd
docker ps
```

Kỳ vọng thấy 2 container:

- `postgres:16-alpine`.
- `mongo:7`.

Nếu muốn xem log PostgreSQL:

```cmd
docker compose -f docker-compose.local.yml logs postgres
```

Nếu muốn xem log MongoDB:

```cmd
docker compose -f docker-compose.local.yml logs mongo
```

---

## 9. Tạo file `.env` từ `.env.example`

Dự án không commit file `.env` thật. Bạn cần tự tạo file `.env` local.

Trên Windows CMD, chạy:

```cmd
copy .env.example .env
```

Hoặc trong VS Code:

1. Mở file `.env.example`.
2. Copy toàn bộ nội dung.
3. Tạo file mới tên `.env` ở thư mục gốc.
4. Paste nội dung vào `.env`.

---

## 10. Sửa `.env` để chạy local đơn giản

File `.env.example` đang định hướng production, trong đó SSO PostgreSQL trỏ port `6432` cho PgBouncer. Nhưng `docker-compose.local.yml` hiện chỉ bật PostgreSQL trực tiếp ở port `5432`.

Vì vậy, khi chạy local đơn giản, hãy sửa 2 dòng này trong `.env`:

```env
SSO_LOGIN_PRIMARY_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
SSO_LOGIN_BACKUP_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
```

Giữ MongoDB như sau:

```env
MONGODB_AUDIT_URL=mongodb://localhost:27017/sso_audit
MONGODB_AUDIT_DATABASE=sso_audit
```

Giữ OIDC issuer local:

```env
OIDC_ISSUER=http://localhost:3000
```

Admin API key local có thể giữ:

```env
ADMIN_API_KEY=change-me-admin-api-key
```

### 10.1. `.env` local tối thiểu nên có

Bạn có thể dùng cấu hình tối thiểu sau:

```env
NODE_ENV=development
PORT=3000
APP_NAME=sso-vietprodev
APP_GLOBAL_PREFIX=
CORS_ORIGINS=http://localhost:3001,http://localhost:3002
SESSION_SECRET=change-me-session-secret-at-least-32-chars
COOKIE_SECURE=false

SSO_LOGIN_PRIMARY_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
SSO_LOGIN_BACKUP_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
PROJECT_A_DATABASE_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
PROJECT_B_DATABASE_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
MONGODB_AUDIT_URL=mongodb://localhost:27017/sso_audit
MONGODB_AUDIT_DATABASE=sso_audit

OIDC_ISSUER=http://localhost:3000
OIDC_ACCESS_TOKEN_TTL=900
OIDC_REFRESH_TOKEN_TTL=2592000
OIDC_PRIVATE_JWK_PATH=./secrets/oidc-private.jwk.json
OIDC_PUBLIC_JWKS_PATH=./secrets/oidc-jwks.json
OIDC_COOKIE_KEYS=dev-cookie-key-1,dev-cookie-key-2

ADMIN_API_KEY=change-me-admin-api-key
BACKUP_VERIFY_CRON=*/5 * * * *
DB_HEALTH_CRON=*/30 * * * * *
AUDIT_CLEANUP_CRON=0 3 * * *
AUDIT_RETENTION_DAYS=365
HAPROXY_STATS_URL=http://localhost:8404/stats;csv
PATRONI_API_URL=http://localhost:8008
PGBOUNCER_DATABASE_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
```

Lưu ý: ở local tối thiểu, `PROJECT_A_DATABASE_URL` và `PROJECT_B_DATABASE_URL` có thể tạm trỏ về cùng DB `sso_login` để health check không lỗi connection. Khi có DB Project A/B thật, hãy thay bằng connection string thật.

---

## 11. Chạy migration tạo bảng PostgreSQL

Sau khi Docker PostgreSQL đã chạy và `.env` đã đúng port `5432`, chạy:

```cmd
npm run migration:run
```

Lệnh này sẽ chạy các file SQL trong thư mục `migrations/` để tạo bảng:

- `users`.
- `clients`.
- `project_db_connections`.
- `user_app_mappings`.
- `roles`.
- `permissions`.
- `sessions`.
- `refresh_tokens`.
- `oidc_grants`.
- `failover_events`.

Nếu lệnh báo lỗi connection refused, kiểm tra lại:

1. Docker Desktop đã bật chưa.
2. Container PostgreSQL đã chạy chưa bằng `docker ps`.
3. `.env` có đang dùng port `5432` không.

---

## 12. Chạy seed tạo dữ liệu mẫu

Sau khi migration thành công, chạy:

```cmd
npm run seed
```

Seed sẽ tạo:

- Role `admin`.
- Role `user`.
- Client OIDC mẫu `project-a-web`.
- Client OIDC mẫu `project-b-web`.
- Admin user mẫu.

Admin user mặc định:

```text
Email: admin@sso.local
Password: ChangeMeAdmin123!
```

Bạn có thể đổi thông tin admin seed bằng biến môi trường trong `.env`:

```env
SEED_ADMIN_EMAIL=admin@sso.local
SEED_ADMIN_PASSWORD=ChangeMeAdmin123!
```

---

## 13. Generate JWKS local

OIDC production cần key ký token. Local có thể tạo key dev bằng lệnh:

```cmd
npm run jwks:generate
```

Lệnh này tạo file trong thư mục `secrets/`:

```text
secrets/oidc-private.jwk.json
secrets/oidc-jwks.json
```

Các file secret JSON đã được ignore bởi `.gitignore`, không commit lên Git.

---

## 14. Kiểm tra DB connection

Chạy:

```cmd
npm run db:test
```

Kỳ vọng thấy:

```text
SSO_LOGIN_PRIMARY_URL ok
PROJECT_A_DATABASE_URL ok
PROJECT_B_DATABASE_URL ok
```

Nếu Project A/B chưa có DB riêng, hãy tạm trỏ `PROJECT_A_DATABASE_URL` và `PROJECT_B_DATABASE_URL` về DB local `sso_login` như phần trên.

---

## 15. Chạy app ở chế độ development

Chạy:

```cmd
npm run start:dev
```

Kỳ vọng terminal in log NestJS và không crash.

App chạy ở:

```text
http://localhost:3000
```

Không đóng terminal này nếu muốn app tiếp tục chạy.

---

## 16. Kiểm tra app đã bật chưa

Mở trình duyệt hoặc Postman.

### 16.1. Kiểm tra live health

Mở:

```text
http://localhost:3000/health/live
```

Kỳ vọng trả JSON tương tự:

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 16.2. Kiểm tra ready health

Mở:

```text
http://localhost:3000/health/ready
```

Nếu DB/Mongo đúng, status sẽ là `ok` hoặc có danh sách dependency.

### 16.3. Kiểm tra OIDC discovery

Mở:

```text
http://localhost:3000/.well-known/openid-configuration
```

Kỳ vọng trả JSON metadata OIDC.

### 16.4. Kiểm tra metrics

Mở:

```text
http://localhost:3000/metrics
```

Kỳ vọng thấy text metrics Prometheus.

---

## 17. Test bằng script smoke OIDC

Khi app đang chạy, mở terminal thứ hai trong VS Code và chạy:

```cmd
npm run smoke:oidc
```

Lệnh này gọi endpoint discovery:

```text
http://localhost:3000/.well-known/openid-configuration

```

Nếu thấy status `200` là bước đầu ổn.

---

## 18. Test admin endpoint

Admin endpoint cần header `x-admin-api-key`.

Nếu dùng Postman:

1. Method: GET.
2. URL: `http://localhost:3000/admin/db-health`.
3. Header:

```text
x-admin-api-key: change-me-admin-api-key
```

Kỳ vọng nhận danh sách health của:

- SSO PostgreSQL.
- MongoDB audit.
- Project DB config.

Nếu không gửi header, API sẽ trả lỗi unauthorized.

---

## 19. Test login UI OIDC như thế nào?

OIDC login UI không mở trực tiếp như trang login thường. Nó được mở thông qua authorize URL.

Ví dụ authorize URL local cho client `project-a-web`:

```text
http://localhost:3000/oauth/authorize?client_id=project-a-web&redirect_uri=http://localhost:3001/auth/callback&response_type=code&scope=openid%20profile%20email&state=test-state&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
```

Lưu ý:

- URL phải dùng `code_challenge_method=S256`. Không dùng `code_challenge_method=plain` vì provider hiện tại không hỗ trợ `plain`.
- `code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM` là challenge mẫu tương ứng với `code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` theo ví dụ chuẩn PKCE.
- Project callback `http://localhost:3001/auth/callback` hiện chưa có app Project A thật, nên sau login có thể redirect tới địa chỉ chưa tồn tại.
- Mục tiêu lúc này là kiểm tra SSO mở được interaction login UI.
- Tài khoản seed để thử login là `admin@sso.local` / `ChangeMeAdmin123!`.

### 19.1. Vì sao chưa dùng trực tiếp URL Project A/B thật?

Không dùng ngay `https://vcci-news.vercel.app/` hoặc `https://sied-dev.meucorp.com/` làm callback thật nếu chưa có route callback được implement trong backend tương ứng.

Với OAuth2/OIDC chuẩn, Project A/B phải có các phần sau:

1. Route bắt đầu login, redirect user sang SSO `/oauth/authorize`.
2. Route callback nhận `code` và `state` từ SSO.
3. Logic đổi `code` lấy token tại `/oauth/token`.
4. Logic map user SSO với user nội bộ.
5. Logic tạo session nội bộ bằng cơ chế hiện có của project: JWT access/refresh token, HttpOnly cookie, bảng `user_sessions`.

Project A/B hiện dùng `express-automatic-routes`, nên callback tương lai không nhất thiết là `app.get('/auth/callback', ...)`; nó có thể là một controller Resource object có dạng `get.handler`.

### 19.2. Khi công ty chưa cho sửa Project A/B thì làm gì?

Trong giai đoạn hiện tại chỉ làm các việc an toàn sau:

- Chạy SSO local ổn định.
- Test health/discovery/metrics của SSO.
- Test kết nối DB Project A/B bằng quyền đọc tối thiểu nếu được cấp.
- Ghi lại schema `users`, `user_auth`, `user_roles`, `roles`, `permissions`, `user_sessions`.
- Chuẩn bị mapping user giữa SSO và từng project.
- Chuẩn bị tài liệu callback cần thêm sau khi được duyệt sửa code.

Không làm các việc sau khi chưa có phê duyệt:

- Không sửa source Project A/B.
- Không deploy callback vào Project A/B.
- Không ghi trực tiếp vào `user_sessions` của Project A/B.
- Không tự tạo cookie `access_token` / `refresh_token` cho domain Project A/B từ SSO.
- Không dùng secret JWT của Project A/B trong SSO nếu chưa có phê duyệt bảo mật.

### 19.3. Kết quả đúng ở bước này là gì?

Nếu các URL sau chạy được thì local SSO đang đúng hướng:

```text
http://localhost:3000/health/live
http://localhost:3000/health/ready
http://localhost:3000/.well-known/openid-configuration
http://localhost:3000/metrics
```

Nếu `http://localhost:3000/` trả 404 thì vẫn bình thường vì dự án chưa có homepage root.

### 19.4. Test thử bằng cách vào trang VCCI thật thì sẽ thấy gì?

Mở trình duyệt và vào Project A thật:

```text
https://vcci-news.vercel.app/
```

Ở thời điểm hiện tại, kết quả đúng cần hiểu như sau:

| Bạn thao tác | Kết quả có thể thấy | Ý nghĩa |
|---|---|---|
| Vào `https://vcci-news.vercel.app/` | Trang VCCI hiện ra như hệ thống hiện tại của công ty | Bình thường. Project A chưa được tích hợp callback SSO nên nó vẫn chạy theo logic cũ |
| Trang yêu cầu đăng nhập theo UI cũ của VCCI | Vẫn là login cũ của Project A, không phải SSO login UI | Bình thường. Chưa có redirect sang SSO vì chưa sửa code Project A |
| Trang cho xem nội dung public | Vẫn xem được như trước | Bình thường. SSO chưa can thiệp vào Project A |
| Không thấy trang `http://localhost:3000/oidc/interaction/...` | Bình thường | Project A chưa có đoạn code redirect sang SSO `/oauth/authorize` |
| Sau khi login ở Project A bằng tài khoản cũ | Session/cookie do Project A tự tạo | Bình thường. Chưa liên quan tới SSO local |

Tóm lại: **hiện tại vào VCCI thật sẽ không tự nhảy qua SSO**. Đây không phải lỗi của SSO. Lý do là Project A chưa được phép sửa code để thêm route bắt đầu login, callback, token exchange và session bridge.

### 19.5. Vậy test thử SSO hiện tại phải test ở đâu?

Hiện tại bạn test SSO bằng URL local authorize, không test bằng domain VCCI thật.

Dùng URL này:

```text
http://localhost:3000/oauth/authorize?client_id=project-a-web&redirect_uri=http://localhost:3001/auth/callback&response_type=code&scope=openid%20profile%20email&state=test-state&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
```

Không dùng URL cũ có `code_challenge_method=plain`, vì kết quả sẽ bị SSO redirect về callback với lỗi:

```text
error=invalid_request&error_description=not+supported+value+of+code_challenge_method
```

Khi mở URL S256 ở trên, luồng kỳ vọng là:

1. Trình duyệt gọi SSO `/oauth/authorize`.
2. SSO kiểm tra `client_id=project-a-web` và `redirect_uri`.
3. SSO mở trang login interaction, thường có URL dạng:

```text
http://localhost:3000/oidc/interaction/<uid>
```

4. Bạn nhập tài khoản seed:

```text
Email: admin@sso.local
Password: ChangeMeAdmin123!
```

5. Nếu login thành công, SSO cố redirect về:

```text
http://localhost:3001/auth/callback?code=...&state=test-state
```

6. Vì hiện tại chưa có app local ở port `3001` để nhận callback, trình duyệt có thể báo:

```text
Failed to Load Page
ERR_CONNECTION_REFUSED (-102)
URL: http://localhost:3001/auth/callback?code=...&state=test-state
```

Kết quả này vẫn chấp nhận được ở giai đoạn hiện tại vì mục tiêu chỉ là xác nhận SSO login UI và authorize flow đã chạy tới bước redirect callback.

Nếu URL callback có dạng lỗi sau:

```text
http://localhost:3001/auth/callback?error=invalid_request&error_description=not+supported+value+of+code_challenge_method&state=test-state&iss=http%3A%2F%2Flocalhost%3A3000
```

thì nguyên nhân là bạn đang dùng authorize URL cũ với `code_challenge_method=plain`. Hãy đổi sang URL S256 ở đầu mục 19.5.

### 19.6. Sau này khi tích hợp thật với VCCI thì người dùng sẽ thấy gì?

Khi công ty duyệt sửa Project A và callback đã được implement, trải nghiệm đúng sẽ là:

1. User vào:

```text
https://vcci-news.vercel.app/
```

2. Nếu user chưa đăng nhập, Project A redirect sang SSO, ví dụ production/staging issuer:

```text
https://sso-domain-cua-cong-ty/oauth/authorize?client_id=project-a-web&redirect_uri=https://vcci-news.vercel.app/auth/callback&response_type=code&scope=openid%20profile%20email&state=...&code_challenge=...&code_challenge_method=S256
```

3. User thấy trang đăng nhập SSO tập trung.
4. User nhập tài khoản ở SSO.
5. SSO redirect về callback của VCCI kèm `code` và `state`.
6. Backend Project A đổi `code` lấy token từ SSO.
7. Project A dùng `authService.ts` hiện hữu để tạo JWT access/refresh token nội bộ, ghi `user_sessions` và set HttpOnly cookie.
8. User được đưa về trang VCCI trong trạng thái đã đăng nhập.

Điểm quan trọng: ở luồng thật, **SSO không ghi thẳng vào `user_sessions` của VCCI**. Project A tự tạo session bằng code của Project A để không phá cơ chế refresh/logout/permission hiện có.

### 19.7. Checklist test thủ công hiện tại

Làm lần lượt:

1. Mở `https://vcci-news.vercel.app/` để xác nhận Project A vẫn chạy bình thường theo logic cũ.
2. Mở `https://sied-dev.meucorp.com/` để xác nhận Project B vẫn chạy bình thường theo logic cũ.
3. Mở `http://localhost:3000/health/live` để xác nhận SSO local chạy.
4. Mở `http://localhost:3000/.well-known/openid-configuration` để xác nhận OIDC discovery chạy.
5. Mở authorize URL local ở phần 19.5 để xác nhận SSO login UI xuất hiện.
6. Login bằng `admin@sso.local` / `ChangeMeAdmin123!`.
7. Nếu bị chuyển sang `localhost:3001/auth/callback` và trình duyệt báo lỗi không có server, ghi nhận là đúng kỳ vọng hiện tại.
8. Nếu callback có `error_description=not+supported+value+of+code_challenge_method`, quay lại mục 19.5 và dùng URL có `code_challenge_method=S256`.
9. Không kỳ vọng VCCI/SIED tự đăng nhập bằng SSO cho tới khi được duyệt sửa code Project A/B.

---

## 20. Xem PostgreSQL bằng pgAdmin4

### 20.1. Cài pgAdmin4

1. Vào `https://www.pgadmin.org/download/`.
2. Tải pgAdmin4 for Windows.
3. Cài và mở pgAdmin4.

### 20.2. Kết nối PostgreSQL local

Trong pgAdmin4:

1. Chuột phải Servers.
2. Chọn Register -> Server.
3. Tab General:
   - Name: `SSO Local`.
4. Tab Connection:
   - Host: `localhost`.
   - Port: `5432`.
   - Maintenance database: `sso_login`.
   - Username: `sso_app_user`.
   - Password: `password`.
5. Save.

### 20.3. Kiểm tra bảng

Vào:

```text
Servers -> SSO Local -> Databases -> sso_login -> Schemas -> public -> Tables
```

Bạn sẽ thấy các bảng như:

- `users`.
- `clients`.
- `roles`.
- `oidc_grants`.

Chạy query kiểm tra user:

```sql
SELECT id, email, username, status, created_at FROM users;
```

Chạy query kiểm tra clients:

```sql
SELECT app_code, client_id, name, redirect_uris FROM clients;
```

---

## 21. Xem MongoDB bằng MongoDB Compass

### 21.1. Cài MongoDB Compass

1. Vào `https://www.mongodb.com/products/tools/compass`.
2. Tải MongoDB Compass.
3. Cài và mở.

### 21.2. Kết nối MongoDB local

Connection string:

```text
mongodb://localhost:27017
```

Bấm Connect.

### 21.3. Xem audit DB

Sau khi có login failed/login success hoặc audit scheduler chạy, bạn sẽ thấy database:

```text
sso_audit
```

Collection:

```text
audit_logs
```

Nếu chưa thấy collection, hãy thử login sai một lần qua OIDC interaction hoặc gọi các flow tạo audit.

---

## 22. Các lệnh thường dùng

| Mục đích | Lệnh |
|---|---|
| Cài dependency | `npm install` |
| Bật PostgreSQL + MongoDB local | `docker compose -f docker-compose.local.yml up -d` |
| Tắt PostgreSQL + MongoDB local | `docker compose -f docker-compose.local.yml down` |
| Xem container đang chạy | `docker ps` |
| Chạy migration | `npm run migration:run` |
| Chạy seed | `npm run seed` |
| Generate JWKS | `npm run jwks:generate` |
| Test DB connection | `npm run db:test` |
| Chạy dev server | `npm run start:dev` |
| Build production | `npm run build` |
| Chạy production sau build | `npm run start:prod` |
| Typecheck | `npm run typecheck` |
| Unit test | `npm test` |
| E2E test placeholder | `npm run test:e2e` |
| Smoke test OIDC discovery | `npm run smoke:oidc` |

---

## 23. Quy trình chạy lại từ đầu mỗi ngày

Nếu hôm trước bạn đã setup xong, hôm sau chỉ cần:

1. Mở Docker Desktop.
2. Mở VS Code ở thư mục dự án.
3. Bật DB nếu chưa bật:

```cmd
docker compose -f docker-compose.local.yml up -d
```

4. Chạy app:

```cmd
npm run start:dev
```

5. Mở:

```text
http://localhost:3000/health/live
```

---

## 24. Reset sạch database local nếu bị lỗi

Nếu muốn xóa sạch dữ liệu PostgreSQL/MongoDB local và tạo lại từ đầu:

> Cẩn thận: lệnh này xóa volume local Docker của project.

```cmd
docker compose -f docker-compose.local.yml down -v
```

Sau đó bật lại:

```cmd
docker compose -f docker-compose.local.yml up -d
```

Chạy lại migration và seed:

```cmd
npm run migration:run
npm run seed
npm run jwks:generate
```

---

## 25. Lỗi thường gặp và cách xử lý

### 25.1. Lỗi `ECONNREFUSED 127.0.0.1:5432`

Nguyên nhân thường gặp:

- PostgreSQL Docker chưa chạy.
- Sai port trong `.env`.

Cách xử lý:

```cmd
docker ps
```

Nếu chưa thấy PostgreSQL, chạy:

```cmd
docker compose -f docker-compose.local.yml up -d
```

Kiểm tra `.env` phải dùng:

```env
SSO_LOGIN_PRIMARY_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
```

### 25.2. Lỗi đang dùng port `5432`

Máy bạn có thể đã cài PostgreSQL khác đang chiếm port `5432`.

Cách đơn giản:

1. Tắt PostgreSQL local đang chạy ngoài Docker.
2. Hoặc đổi port trong `docker-compose.local.yml`, ví dụ `55432:5432`.
3. Nếu đổi port Docker thành `55432`, sửa `.env` thành:

```env
SSO_LOGIN_PRIMARY_URL=postgresql://sso_app_user:password@localhost:55432/sso_login
```

### 25.3. Lỗi `ECONNREFUSED 127.0.0.1:27017`

MongoDB Docker chưa chạy hoặc port bị chiếm.

Kiểm tra:

```cmd
docker ps
```

Bật lại:

```cmd
docker compose -f docker-compose.local.yml up -d
```

### 25.4. Lỗi `Missing required env SESSION_SECRET`

Bạn chưa tạo file `.env` hoặc app chưa đọc được `.env`.

Cách xử lý:

```cmd
copy .env.example .env
```

Sau đó sửa `.env` như hướng dẫn phần 10.

### 25.5. Lỗi migration báo database không tồn tại

Với Docker Compose hiện tại, database `sso_login` được tạo tự động bằng biến:

```yaml
POSTGRES_DB: sso_login
```

Nếu vẫn lỗi, reset volume:

```cmd
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d
```

Rồi chạy lại:

```cmd
npm run migration:run
```

### 25.6. App chạy nhưng `/health/ready` degraded

Có thể Project A/B DB chưa tồn tại. Local có thể tạm trỏ Project A/B về cùng DB SSO:

```env
PROJECT_A_DATABASE_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
PROJECT_B_DATABASE_URL=postgresql://sso_app_user:password@localhost:5432/sso_login
```

Khi có DB Project A/B thật, đổi lại connection string thật.

### 25.7. `npm install` lỗi do package native `argon2`

Thử các bước:

```cmd
npm cache clean --force
npm install
```

Nếu vẫn lỗi, kiểm tra Node.js đang dùng bản LTS mới và terminal đang chạy quyền bình thường.

### 25.8. Lỗi `Cannot read properties of undefined (reading 'object')` tại `validation.schema.ts`

Lỗi này xảy ra khi import thư viện CommonJS theo kiểu default import không tương thích runtime Node.js/NestJS hiện tại.

Cách xử lý trong source code đã áp dụng:

```ts
import * as Joi from 'joi';
```

Sau khi sửa, kiểm tra lại:

```cmd
npm run typecheck
npm run build
npm run start:dev
```

### 25.9. Lỗi `Nest can't resolve dependencies`

Lỗi này xảy ra khi một module dùng service của module khác nhưng chưa import module chứa provider đó.

Ví dụ:

- `DbManagerModule` cần import `DatabaseModule`.
- `AuditModule` cần import `MongoModule`.
- `OidcModule` cần import `AppConfigModule`, `DatabaseModule`, `UsersModule`, `AuthModule`, `AuditModule`.

Source code hiện đã được bổ sung import module cần thiết. Nếu gặp lại lỗi tương tự, đọc thông báo `argument ... at index ...` để biết provider nào thiếu, sau đó import module chứa provider đó.

### 25.10. Lỗi `compression_1.default is not a function`

Lỗi này cũng do khác biệt default import/CommonJS. Source code hiện đã đổi sang namespace import:

```ts
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
```

Sau khi sửa, chạy lại:

```cmd
npm run start:dev
```

### 25.11. Lỗi `EADDRINUSE: address already in use :::3000`

Lỗi này nghĩa là port `3000` đã có một process khác đang dùng. Trường hợp thường gặp nhất là bạn đã có một terminal khác đang chạy `npm run start:dev` rồi, sau đó mở thêm terminal và chạy lại lần nữa.

Trong VS Code hiện tại, nếu terminal cũ vẫn đang in log như sau thì app thật ra đã chạy rồi:

```text
Nest application successfully started
DbHealthScheduler {"dbHealth":[...]}
```

Cách xử lý nhanh nhất:

1. Tìm terminal đang chạy `npm run start:dev`.
2. Bấm vào terminal đó.
3. Nhấn `Ctrl + C`.
4. Nếu hỏi `Terminate batch job (Y/N)?`, nhập `Y` rồi Enter.
5. Chạy lại:

```cmd
npm run start:dev
```

Nếu không biết process nào đang giữ port `3000`, dùng PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object LocalAddress,LocalPort,State,OwningProcess
```

Sau đó xem tên process:

```powershell
Get-Process -Id <PID>
```

Thay `<PID>` bằng số trong cột `OwningProcess`.

Nếu chắc chắn muốn tắt process đó:

```powershell
Stop-Process -Id <PID> -Force
```

Cách khác là đổi port app trong `.env`, ví dụ:

```env
PORT=3001
OIDC_ISSUER=http://localhost:3001
```

Sau đó chạy lại:

```cmd
npm run start:dev
```

Lưu ý: nếu đổi `OIDC_ISSUER` sang `3001`, các URL kiểm tra cũng đổi sang:

```text
http://localhost:3001/health/live
http://localhost:3001/.well-known/openid-configuration
http://localhost:3001/metrics
```

---

## 26. Khi nào cần PostgreSQL HA, Patroni, PgBouncer, Kubernetes?

Local development không cần chạy đầy đủ production HA.

Ở local, bạn chỉ cần:

- Node.js.
- PostgreSQL Docker đơn node.
- MongoDB Docker đơn node.

Các thành phần sau dành cho staging/production hoặc khi DevOps test HA:

- Patroni.
- etcd.
- HAProxy.
- PgBouncer.
- Kubernetes.
- Helm.
- Prometheus.
- Grafana.
- Alertmanager.

Nói ngắn gọn:

- Muốn code và test local: làm theo file này.
- Muốn triển khai production: đọc thêm `guide/07-patroni-etcd-haproxy-pgbouncer.md`, `guide/08-kubernetes-helm-deployment.md`, `guide/09-monitoring-prometheus-grafana-alertmanager.md`, `guide/10-cicd-release-rollback.md`.

---

## 27. Checklist setup thành công

Bạn setup thành công khi đạt đủ các mục sau:

- Chạy được `node -v`.
- Chạy được `npm -v`.
- Chạy được `docker --version`.
- Chạy được `docker compose version`.
- `npm install` hoàn tất.
- `docker compose -f docker-compose.local.yml up -d` bật được PostgreSQL và MongoDB.
- File `.env` đã tồn tại.
- `.env` dùng PostgreSQL port `5432` cho local.
- `npm run migration:run` thành công.
- `npm run seed` thành công.
- `npm run jwks:generate` thành công.
- `npm run db:test` báo OK.
- `npm run start:dev` chạy không crash.
- Mở được `http://localhost:3000/health/live`.
- Mở được `http://localhost:3000/.well-known/openid-configuration`.
- Mở được `http://localhost:3000/metrics`.

---

## 28. Quy trình setup nhanh nếu bạn đã quen

```cmd
npm install
copy .env.example .env
```

Sửa `.env` để `SSO_LOGIN_PRIMARY_URL` dùng port `5432`, rồi chạy:

```cmd
docker compose -f docker-compose.local.yml up -d
npm run migration:run
npm run seed
npm run jwks:generate
npm run db:test
npm run start:dev
```

Kiểm tra:

```text
http://localhost:3000/health/live
http://localhost:3000/.well-known/openid-configuration
http://localhost:3000/metrics
```

---

## 29. Ghi chú quan trọng về bảo mật

- Không commit file `.env`.
- Không commit file secret trong thư mục `secrets/`.
- Không dùng password mẫu cho production.
- Không dùng `change-me-admin-api-key` cho production.
- Không dùng Docker image tag `latest` cho production.
- Production phải dùng secret manager hoặc Kubernetes Secret.
- Production DB phải đi qua PgBouncer/HAProxy endpoint theo kiến trúc đã chốt.

---

## 30. Thứ tự đọc tài liệu tiếp theo

Sau khi chạy local thành công, đọc tiếp theo thứ tự:

1. `README.md` để nắm tổng quan dự án.
2. `plans/sso-project-plan.md` để hiểu toàn bộ kiến trúc đã chốt.
3. `guide/02-pgadmin4-postgresql-setup.md` nếu muốn quản lý PostgreSQL bằng pgAdmin4.
4. `guide/03-mongodb-compass-cluster-setup.md` nếu muốn quản lý MongoDB bằng Compass.
5. `guide/05-oidc-client-registration.md` để hiểu cách đăng ký client Project A/B.
6. `guide/06-project-db-onboarding.md` để hiểu cách thêm project mới vào SSO.
