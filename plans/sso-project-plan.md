# Kế hoạch xây dựng dự án SSO kết nối nhiều DB PostgreSQL

## 1. Bối cảnh và mục tiêu

Dự án hiện có file [`README.md`](../README.md) mô tả mục tiêu SSO tổng quát. Phạm vi mới là xây dựng một hệ thống SSO Backend bằng JavaScript, kết nối được các DB PostgreSQL hiện có của Project A và Project B thông qua connection string, đồng thời có DB riêng cho SSO Login, DB backup, audit log trên MongoDB cluster và cơ chế failover.

Mục tiêu chính:

- SSO là trung tâm xác thực cho nhiều dự án, không giới hạn Project A và Project B.
- DB các dự án đã tồn tại trên PostgreSQL, quản lý được qua pgAdmin4, mỗi dự án có thể được khai báo động bằng connection string.
- SSO kết nối các DB bằng connection string, cấu hình qua JSON hoặc biến môi trường.
- SSO có Login DB chính trên PostgreSQL.
- SSO có Login DB backup trên PostgreSQL, hỗ trợ switch khi DB chính lỗi.
- Có backup hoặc đồng bộ định kỳ mỗi 5 phút.
- Có MongoDB cluster để lưu audit log dạng NoSQL.
- Backend dùng JavaScript, ưu tiên Node.js với Express hoặc NestJS.

### 1.1. Thông tin thực tế Project A/B đã chốt

Project A và Project B là hệ thống thật của công ty, không phải app demo:

| Project | URL hiện có | Backend | Frontend | ORM/router | Auth/session hiện tại |
|---|---|---|---|---|---|
| Project A | `https://vcci-news.vercel.app/` | Express.js + TypeScript + Node.js | Có frontend riêng | Sequelize + `express-automatic-routes` | Custom JWT access/refresh token, HttpOnly cookie, bảng `user_sessions` |
| Project B | `https://sied-dev.meucorp.com/` | Express.js + TypeScript + Node.js | Có frontend riêng | Sequelize + `express-automatic-routes` | Custom JWT access/refresh token, HttpOnly cookie, bảng `user_sessions` |

Đặc điểm route callback của Project A/B:

- Không ưu tiên khai báo thủ công kiểu `app.get('/auth/callback', handler)`.
- Route sinh theo cấu trúc file của `express-automatic-routes`.
- Mỗi controller export default một function trả về Resource object có key `get`, `post`, `put`, `delete`.
- Handler thật nằm trong dạng `handler: async (req, res) => { ... }`.

Đặc điểm auth/session hiện tại của Project A/B:

- Không dùng `express-session`.
- Login tạo JWT access token và refresh token.
- Token được mã hóa hoặc hash rồi lưu vào bảng `user_sessions`.
- Cookie HttpOnly lưu `access_token` và `refresh_token`.
- Middleware authenticate đọc token từ cookie hoặc Authorization header, verify JWT, gọi `validateSession` để kiểm tra session active/chưa hết hạn, rồi gắn `req.user`.
- Logout deactivate session.
- Refresh sinh token mới và cập nhật session.
- Các điểm chính nằm ở `authService.ts`, `auth.ts`, `UserSession.ts`, `UserAuth.ts` của từng project.

### 1.2. Ràng buộc bảo mật quan trọng nhất hiện tại

Hiện tại **không được sửa bất kỳ code nào của Project A/B** vì quy định bảo mật công ty. Đây là ràng buộc quyết định kiến trúc.

Kết luận bắt buộc:

- Không thể hoàn tất full SSO end-to-end theo chuẩn OAuth2/OIDC vào Project A/B nếu Project A/B không có callback handler hoặc adapter được duyệt.
- SSO vẫn có thể được xây dựng chỉn chu theo hướng production-ready: OIDC Provider, SSO DB, user mapping, kết nối đọc DB Project A/B, audit, health check, admin config, tài liệu tích hợp.
- Giai đoạn hiện tại chỉ nên tích hợp ở mức **read-only / readiness / identity mapping**, không ghi hoặc can thiệp session Project A/B.
- Mọi phương án ghi trực tiếp vào `user_sessions` của Project A/B để giả lập login phải được xem là rủi ro cao và không triển khai khi chưa có phê duyệt bảo mật chính thức.

### 1.3. Giải thích câu hỏi password nằm ở đâu

Câu hỏi “Password hiện nằm trong SSO DB hay DB từng project?” nghĩa là cần biết nguồn xác thực mật khẩu chính hiện tại:

| Trường hợp | Ý nghĩa | Tác động kiến trúc |
|---|---|---|
| Password nằm trong DB từng project | User đăng nhập bằng password hash ở `user_auth` hoặc bảng tương đương của Project A/B | SSO cần migration/import/hash compatibility hoặc giai đoạn đầu chỉ đọc/mapping user |
| Password nằm trong DB SSO | SSO đã là nguồn định danh chính | Project A/B chỉ cần tin token/callback từ SSO |
| Password nằm ở cả hai nơi | Có nguy cơ lệch dữ liệu | Cần kế hoạch migration, đồng bộ, khóa nguồn ghi cũ |
| Không được đọc/chạm password project | An toàn hơn nếu chưa được duyệt | SSO chỉ làm readiness, mapping, OIDC provider và chờ phê duyệt tích hợp |

Với ràng buộc hiện tại, chưa cần xử lý password thật của Project A/B trong code. Việc cần làm trước là xác định schema đọc user/role/session, lập mapping và chuẩn bị kế hoạch migration được duyệt.

### 1.4. Quyết định mới: tạo demo backend mô phỏng Project A/B

Trước khi sửa Project A/B thật, dự án sẽ tạo 2 backend demo để chứng minh luồng SSO nhiều dự án:

- `demo-projects/demo-project-a-api`.
- `demo-projects/demo-project-b-api`.

Hai demo backend này mô phỏng Project A/B thật ở các điểm quan trọng:

- Express.js + TypeScript + Node.js.
- Sequelize.
- `express-automatic-routes`.
- DB schema: `users`, `user_auth`, `user_roles`, `roles`, `permissions`, `user_sessions`.
- Custom JWT access token + refresh token.
- HttpOnly cookies `access_token`, `refresh_token`.
- Middleware `authenticate`.
- `validateSession`.
- Callback SSO theo Resource object của `express-automatic-routes`.

Mục tiêu là chứng minh SSO hoạt động như Identity Provider giống Google:

1. User login Demo A qua SSO.
2. Demo A tự tạo session nội bộ.
3. User mở Demo B.
4. Demo B cũng login qua SSO.
5. Nếu SSO session còn hiệu lực, user không cần nhập lại password.
6. Demo B tự tạo session nội bộ riêng.

Tài liệu chi tiết của giai đoạn này nằm ở [`plans/demo-backend-multi-project-sso-plan.md`](demo-backend-multi-project-sso-plan.md).

## 2. Kiến trúc đề xuất

```mermaid
flowchart TD
    User[User Browser] --> A[Project A]
    User --> B[Project B]
    User --> N[Other Projects]
    A --> SSO[SSO API]
    B --> SSO
    N --> SSO

    SSO --> CM[DB Connection Manager]
    CM --> PA[Project A PostgreSQL]
    CM --> PB[Project B PostgreSQL]
    CM --> PN[Other Project PostgreSQL DBs]
    CM --> LP[SSO Login PostgreSQL Primary]
    CM --> LB[SSO Login PostgreSQL Backup]

    SSO --> Audit[Audit Logger]
    Audit --> Mongo[MongoDB Cluster]

    HC[Health Check Worker] --> LP
    HC --> LB
    BK[Backup Sync Worker mỗi 5 phút] --> LP
    BK --> LB

    SSO --> Authz[OAuth2 OIDC Authorization Server]
    Authz --> Token[Access Token Refresh Token ID Token]
```

### Vai trò từng khối

| Khối | Vai trò |
|---|---|
| SSO API | Đóng vai trò OAuth2/OIDC Authorization Server, xử lý authorize, token, userinfo, logout, introspection, JWKS và admin config |
| DB Connection Manager | Đọc connection string, tạo pool động theo app, route query đến DB đúng app, health check và switch DB |
| Project A PostgreSQL | DB nghiệp vụ của Project A, có thể có user hoặc dữ liệu riêng |
| Project B PostgreSQL | DB nghiệp vụ của Project B, có thể dùng cấu trúc relational hoặc JSONB kiểu NoSQL |
| Other Project PostgreSQL DBs | Các DB dự án khác được thêm qua cấu hình `clients` và `project_db_connections`, không cần sửa core SSO |
| SSO Login PostgreSQL Primary | DB chính lưu users, clients, sessions, token, mapping app |
| SSO Login PostgreSQL Backup | DB dự phòng để failover khi DB chính lỗi |
| MongoDB Cluster | Lưu audit log: login, logout, failover, lỗi DB, thay đổi quyền |
| Backup Sync Worker | Đồng bộ hoặc backup từ DB chính sang DB backup mỗi 5 phút |
| Health Check Worker | Kiểm tra DB chính/backup và kích hoạt switch |

## 3. Cấu hình connection string

Không hardcode connection string trong source code. Nên dùng file cấu hình mẫu và biến môi trường thật.

File đề xuất: [`config/db-connections.example.json`](../config/db-connections.example.json)

```json
{
  "ssoLogin": {
    "primary": {
      "name": "sso_login_primary",
      "provider": "postgresql",
      "connectionStringEnv": "SSO_LOGIN_PRIMARY_URL",
      "role": "primary"
    },
    "backup": {
      "name": "sso_login_backup",
      "provider": "postgresql",
      "connectionStringEnv": "SSO_LOGIN_BACKUP_URL",
      "role": "backup"
    }
  },
  "projects": [
    {
      "appCode": "PROJECT_A",
      "provider": "postgresql",
      "connectionStringEnv": "PROJECT_A_DATABASE_URL",
      "userTable": "users",
      "userIdColumn": "id",
      "emailColumn": "email"
    },
    {
      "appCode": "PROJECT_B",
      "provider": "postgresql",
      "connectionStringEnv": "PROJECT_B_DATABASE_URL",
      "userTable": "users",
      "userIdColumn": "id",
      "emailColumn": "email",
      "jsonProfileColumn": "profile"
    },
    {
      "appCode": "PROJECT_X",
      "provider": "postgresql",
      "connectionStringEnv": "PROJECT_X_DATABASE_URL",
      "userTable": "users",
      "userIdColumn": "id",
      "emailColumn": "email"
    }
  ],
  "audit": {
    "provider": "mongodb",
    "connectionStringEnv": "MONGODB_AUDIT_URL",
    "database": "sso_audit"
  }
}
```

Biến môi trường mẫu:

```env
SSO_LOGIN_PRIMARY_URL=postgresql://user:password@host:5432/sso_login
SSO_LOGIN_BACKUP_URL=postgresql://user:password@host:5432/sso_login_backup
PROJECT_A_DATABASE_URL=postgresql://user:password@host:5432/project_a
PROJECT_B_DATABASE_URL=postgresql://user:password@host:5432/project_b
MONGODB_AUDIT_URL=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/sso_audit?replicaSet=rs0
OIDC_ISSUER=http://localhost:3000
OIDC_ACCESS_TOKEN_TTL=900
OIDC_REFRESH_TOKEN_TTL=2592000
OIDC_PRIVATE_JWK_PATH=./secrets/oidc-private.jwk.json
OIDC_PUBLIC_JWKS_PATH=./secrets/oidc-jwks.json
```

## 4. Stack kỹ thuật đề xuất

| Thành phần | Đề xuất |
|---|---|
| Runtime | Node.js |
| Framework | Chọn NestJS làm framework chính cho production vì dự án có nhiều module, OAuth2/OIDC, audit, DB manager, scheduler, health check và hạ tầng HA phức tạp |
| PostgreSQL client | `pg` cho pool linh hoạt hoặc Prisma nếu schema SSO rõ ràng |
| MongoDB | MongoDB native driver hoặc Mongoose |
| OAuth2/OIDC | Chọn `oidc-provider` làm lõi Authorization Server vì chuẩn hơn, đầy đủ hơn, ít rủi ro tự implement sai chuẩn hơn `jose` |
| Password hash | `argon2` ưu tiên, hoặc `bcrypt` |
| Scheduler | `node-cron` hoặc BullMQ nếu cần job bền vững |
| Logging | `pino` hoặc `winston` |
| Validation | `zod`, `joi` hoặc class-validator nếu dùng NestJS |
| Testing | Jest, Supertest |
| Deployment local | Docker Compose |
| Reverse proxy | Nginx hoặc Traefik |

Khuyến nghị đã chốt: dùng NestJS cho dự án này. Express phù hợp cho API nhỏ hoặc prototype, nhưng dự án SSO production cần kiến trúc module rõ ràng, dependency injection, guard, interceptor, validation pipe, testing module và khả năng tách domain tốt. Với OAuth2/OIDC production, chọn `oidc-provider`; `jose` chỉ nên dùng bổ trợ cho thao tác JWK/JWT đặc thù nếu thật sự cần, không dùng để tự viết toàn bộ chuẩn OAuth2/OIDC từ đầu.

## 5. Thiết kế DB SSO Login PostgreSQL

Các bảng chính:

| Bảng | Mục đích |
|---|---|
| `users` | User trung tâm của SSO |
| `clients` | Tất cả dự án/app tích hợp SSO, không giới hạn Project A/B |
| `project_db_connections` | Metadata kết nối DB từng dự án, mapping theo `app_code` và biến môi trường connection string |
| `user_app_mappings` | Mapping user SSO với user ở từng dự án |
| `roles` | Vai trò hệ thống |
| `permissions` | Quyền chi tiết |
| `user_roles` | Gán role cho user |
| `sessions` | Phiên đăng nhập |
| `refresh_tokens` | Refresh token đã hash, trạng thái revoked/expired |
| `db_connections` | Metadata connection, không lưu password plaintext |
| `failover_events` | Sự kiện chuyển đổi DB chính/backup |

Ví dụ schema logic:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clients (
  id UUID PRIMARY KEY,
  app_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  callback_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_app_mappings (
  id UUID PRIMARY KEY,
  sso_user_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  external_user_id TEXT NOT NULL,
  external_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, external_user_id)
);
```

## 6. Luồng đăng nhập đề xuất

Quyết định kiến trúc: ưu tiên OAuth2/OIDC production bằng `oidc-provider`. Không tự implement chuẩn OAuth2/OIDC bằng `jose` vì dễ thiếu edge cases bảo mật, sai chuẩn token/session/consent, sai xử lý grant và khó đạt độ ổn định production.

Quyết định UI: cần có UI login SSO ngay từ giai đoạn đầu. Với OAuth2/OIDC chuẩn, user thường được redirect từ Project A/B hoặc các dự án khác sang trang đăng nhập tập trung của Identity Provider. Các hệ thống SSO phổ biến như Keycloak, Auth0, Okta, Azure AD, Google Identity đều có hosted login page hoặc universal login page. Vì vậy hướng chuẩn và đẹp nhất là SSO cung cấp UI login riêng, còn các project client không tự xử lý password.

Nguyên tắc UI login:

- Project client chỉ redirect sang SSO qua authorize endpoint.
- Password chỉ nhập tại SSO login UI, không nhập ở Project A/B.
- SSO login UI xử lý login, consent nếu cần, MFA nếu mở rộng, logout và lỗi xác thực.
- Project client nhận authorization code tại callback và đổi token theo chuẩn.
- UI login phải hỗ trợ branding cơ bản theo client, ví dụ logo, tên app, redirect domain, nhưng không làm rò rỉ logic bảo mật sang client.

### Phương án ưu tiên: OAuth2/OIDC Authorization Code Flow với PKCE

SSO sẽ đóng vai trò Authorization Server và OpenID Provider. Project A và Project B đóng vai trò OAuth Client/Relying Party. Luồng ưu tiên là Authorization Code Flow với PKCE, phù hợp cho web app, SPA hoặc mobile app và dễ mở rộng về sau.

```mermaid
sequenceDiagram
    participant U as User
    participant C as Project A or B Client
    participant S as SSO OIDC Provider
    participant P as SSO PostgreSQL
    participant M as Mongo Audit

    U->>C: Truy cập app
    C->>S: Redirect tới authorize với client_id redirect_uri scope state code_challenge
    S->>P: Kiểm tra client và redirect_uri
    U->>S: Nhập email và password trên trang SSO
    S->>P: Xác thực user và client mapping
    S->>M: Ghi login attempt
    S-->>C: Redirect về callback kèm authorization code
    C->>S: Đổi code lấy token tại token endpoint kèm code_verifier
    S-->>C: Trả access token refresh token id token
    C->>S: Gọi userinfo hoặc introspection khi cần
    S-->>C: Trả claims hoặc trạng thái token
```

Endpoint OAuth2/OIDC chính:

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/.well-known/openid-configuration` | Metadata chuẩn OIDC discovery |
| GET | `/oauth/authorize` | Bắt đầu authorization code flow với PKCE |
| POST | `/oauth/token` | Đổi authorization code hoặc refresh token lấy token mới |
| GET | `/oauth/userinfo` | Trả thông tin user theo access token |
| GET | `/oauth/jwks` | Public keys để Project A/B verify chữ ký token |
| POST | `/oauth/introspect` | Kiểm tra trạng thái token cho confidential client |
| POST | `/oauth/revoke` | Thu hồi access token hoặc refresh token |
| GET | `/oauth/logout` | Single logout hoặc kết thúc session SSO |
| GET | `/apps` | Danh sách app client user được truy cập |
| POST | `/admin/db-connections/test` | Test connection string |
| GET | `/admin/db-health` | Xem trạng thái primary/backup/project DB |

Client registration cần lưu trong DB SSO:

| Trường | Ý nghĩa |
|---|---|
| `client_id` | Định danh Project A hoặc Project B |
| `client_secret_hash` | Secret đã hash cho confidential client |
| `redirect_uris` | Danh sách callback URL hợp lệ |
| `post_logout_redirect_uris` | Danh sách URL sau logout |
| `grant_types` | `authorization_code`, `refresh_token` |
| `response_types` | `code` |
| `scopes` | `openid`, `profile`, `email`, `offline_access`, app scopes |
| `token_endpoint_auth_method` | `client_secret_basic`, `client_secret_post` hoặc `none` với PKCE |

Giai đoạn đầu vẫn có thể giữ endpoint nội bộ `/admin/db-connections/test` và `/admin/db-health`, nhưng phần xác thực cho Project A/B sẽ ưu tiên chuẩn OAuth2/OIDC thay vì API login JWT nội bộ.

### 6.1. Phương án tốt nhất cho Project A/B khi chưa được sửa code

Phương án tốt nhất hiện tại là chia tích hợp thành 2 lớp: **SSO core production-ready** và **Project A/B integration readiness**.

#### Lớp 1: SSO core vẫn triển khai đầy đủ

- Hoàn thiện OIDC Provider bằng `oidc-provider`.
- Hoàn thiện login UI tập trung của SSO.
- Hoàn thiện SSO DB: `users`, `clients`, `user_app_mappings`, `sessions`, `refresh_tokens`, roles/permissions.
- Hoàn thiện PostgreSQL HA pattern, MongoDB audit, health/metrics/admin API.
- Hoàn thiện client registration cho Project A/B ở trạng thái chuẩn bị, nhưng chưa coi là go-live login thật.

#### Lớp 2: Project A/B chỉ tích hợp không xâm lấn

Khi chưa được sửa Project A/B:

- Chỉ dùng connection string để test kết nối DB.
- Chỉ đọc metadata user/role/permission cần thiết để phân tích mapping.
- Không ghi vào bảng `users`, `user_auth`, `user_sessions`, `roles`, `permissions` của Project A/B.
- Không cố tạo cookie/token thay Project A/B.
- Không thay đổi frontend/backend/deploy của Project A/B.
- Lưu tài liệu callback route cần thêm trong tương lai theo convention `express-automatic-routes`.

#### Lựa chọn bị loại ở giai đoạn hiện tại

| Phương án | Trạng thái | Lý do |
|---|---|---|
| Ghi trực tiếp session vào `user_sessions` Project A/B | Không triển khai | Rủi ro phá cơ chế refresh/logout/verify JWT, không được sửa code, không chắc secret/signing key |
| Inject callback vào source Project A/B | Chưa triển khai | Vi phạm ràng buộc không sửa code |
| Reverse proxy tự set cookie Project A/B | Chưa triển khai | Cần hiểu sâu domain cookie, JWT secret, middleware, rủi ro bảo mật cao |
| Dùng SSO làm IdP chuẩn OIDC và Project A/B làm Relying Party | Mục tiêu chính thức | Cần được duyệt sửa Project A/B để thêm callback/token exchange/session bridge |

#### Lộ trình tích hợp được khuyến nghị

1. Hoàn thiện SSO core và tài liệu.
2. Kết nối read-only tới DB Project A/B để xác minh schema và mapping.
3. Tạo báo cáo tích hợp: callback cần thêm, env cần thêm, bảng/session hiện tại, rủi ro, test plan.
4. Xin phê duyệt thay đổi Project A/B.
5. Sau khi được duyệt, thêm callback Resource object vào từng project để đổi authorization code lấy token SSO.
6. Tạo session nội bộ Project A/B bằng chính service hiện hữu của project, không ghi DB thủ công từ SSO.
7. Chạy staging E2E rồi mới go-live.

## 7. Database Connection Manager

Module này là phần quan trọng nhất của Backend JavaScript.

Nhiệm vụ:

- Đọc config JSON.
- Lấy connection string từ biến môi trường.
- Tạo PostgreSQL pool cho Project A, Project B, SSO primary, SSO backup.
- Tạo MongoDB client cho audit cluster.
- Health check định kỳ bằng query `SELECT 1`.
- Route query theo `appCode`.
- Nếu SSO primary lỗi, switch sang backup.
- Ghi audit event khi connection lỗi hoặc failover.

Pseudo-code:

```js
class DatabaseConnectionManager {
  async init() {}
  getProjectPool(appCode) {}
  getSsoWritePool() {}
  getSsoReadPool() {}
  async healthCheck() {}
  async failoverToBackup(reason) {}
  async restorePrimaryWhenHealthy() {}
}
```

Nguyên tắc route:

| Tình huống | DB dùng |
|---|---|
| Login user SSO | SSO primary nếu healthy, backup nếu failover |
| Verify token | SSO primary hoặc backup theo trạng thái active |
| Đọc user Project A | Project A pool |
| Đọc user Project B | Project B pool |
| Ghi audit | MongoDB cluster |
| DB chính lỗi | Switch toàn bộ SSO read/write sang backup |

## 8. Primary/Backup PostgreSQL và backup mỗi 5 phút

Có 2 hướng triển khai, cần chọn theo hạ tầng thực tế.

### Phương án A: PostgreSQL streaming replication

Đây là phương án đã chốt cho production.

- Primary ghi dữ liệu.
- Backup là replica nhận WAL gần real-time.
- Khi primary chết, promote backup thành primary mới.
- Có health check và failover script.
- Có thể dùng HAProxy/PgBouncer/Patroni để quản lý HA tốt hơn.

Ưu điểm:

- Dữ liệu đồng bộ gần thời gian thực.
- Ít mất dữ liệu hơn backup file định kỳ.
- Phù hợp production.

### Phương án B: Backup/sync mỗi 5 phút

Không chọn làm cơ chế HA chính cho production. Chỉ dùng làm snapshot backup bổ sung hoặc phục vụ môi trường dev/test.

- Cron job chạy mỗi 5 phút.
- Dùng `pg_dump` và `pg_restore`, hoặc sync theo bảng bằng SQL.
- Backup DB chỉ nhận ghi khi primary lỗi.
- Khi primary phục hồi, cần quy trình reverse sync từ backup về primary.

Rủi ro:

- Có thể mất dữ liệu trong khoảng giữa 2 lần backup.
- Failback phức tạp nếu backup đã nhận dữ liệu mới.

Khuyến nghị đã chốt:

- Production: PostgreSQL streaming replication là cơ chế chính.
- Snapshot backup định kỳ vẫn cần có để chống mất dữ liệu do lỗi logic, xóa nhầm hoặc corruption.
- Yêu cầu 5 phút nên hiểu là backup/snapshot hoặc kiểm tra backup định kỳ, không dùng `pg_dump` mỗi 5 phút làm HA chính.
- Bắt buộc thiết kế production-ready ngay từ đầu với Patroni + etcd + HAProxy + PgBouncer, nhưng triển khai theo từng lớp để giảm rủi ro.

### Phương án production HA bắt buộc: Patroni, HAProxy, PgBouncer

Đánh giá: với dự án production thật, không nên để Backend SSO tự switch trực tiếp giữa PostgreSQL primary và backup bằng logic ứng dụng. Cách tốt nhất là đưa HA xuống tầng hạ tầng DB, để SSO chỉ kết nối vào một endpoint ổn định qua PgBouncer hoặc HAProxy.

Vai trò từng thành phần:

| Thành phần | Vai trò |
|---|---|
| Patroni | Quản lý PostgreSQL cluster, streaming replication, leader election, promote standby khi primary lỗi |
| etcd | Distributed consensus store cho Patroni, giúp tránh split-brain; được chọn thay vì Consul cho dự án này |
| HAProxy | Route traffic đến PostgreSQL primary cho write và optional replica endpoint cho read |
| PgBouncer | Connection pooling, giảm số connection trực tiếp vào PostgreSQL và giữ endpoint ổn định cho SSO |
| SSO API | Chỉ dùng connection string tới PgBouncer/HAProxy, không tự quyết định promote DB |

Kiến trúc production DB:

```mermaid
flowchart TD
    SSO[SSO API] --> PGB[PgBouncer]
    PGB --> HAP[HAProxy]
    HAP --> P1[PostgreSQL Node 1]
    HAP --> P2[PostgreSQL Node 2]
    HAP --> P3[PostgreSQL Node 3]

    PAT1[Patroni Node 1] --> P1
    PAT2[Patroni Node 2] --> P2
    PAT3[Patroni Node 3] --> P3

    PAT1 --> DCS[etcd Cluster]
    PAT2 --> DCS
    PAT3 --> DCS

    BK[Snapshot Backup Job] --> P1
    BK --> P2
    BK --> P3
```

### Lựa chọn DCS: etcd hay Consul

Kết luận: chọn etcd cho dự án này.

Lý do chọn etcd:

| Tiêu chí | etcd | Consul | Đánh giá cho dự án SSO |
|---|---|---|---|
| Mục tiêu chính | Key-value store và consensus mạnh | Service discovery, service mesh, KV store | Patroni cần consensus ổn định hơn là service discovery rộng |
| Tích hợp Patroni | Rất phổ biến, cấu hình trực tiếp, tài liệu nhiều | Cũng hỗ trợ nhưng thường dùng khi hệ thống đã có Consul | etcd phù hợp hơn cho PostgreSQL HA chuyên biệt |
| Độ phức tạp vận hành | Gọn hơn nếu chỉ cần DCS cho Patroni | Nhiều tính năng hơn, cấu hình rộng hơn | etcd đơn giản hơn cho scope hiện tại |
| Tech stack hiện tại | Node.js, PostgreSQL, MongoDB, HAProxy, PgBouncer | Không có nhu cầu service mesh rõ ràng | Không cần thêm Consul nếu chưa dùng ecosystem Consul |
| Rủi ro triển khai | Ít thành phần ngoài mục tiêu HA DB | Dễ mở rộng nhưng cũng dễ phức tạp hóa | etcd giảm rủi ro vận hành ban đầu |

Khi nào mới chọn Consul:

- Hệ thống đã có Consul sẵn trong hạ tầng.
- Cần service discovery rộng cho nhiều service ngoài PostgreSQL.
- Cần tích hợp service mesh hoặc health check catalog của Consul.

Với dự án này, `etcd` là lựa chọn tốt nhất vì mục tiêu chính là Patroni leader election, tránh split-brain và failover PostgreSQL production. Consul không sai, nhưng là lựa chọn rộng hơn nhu cầu hiện tại.

Khuyến nghị triển khai tốt nhất:

1. Ngay từ đầu thiết kế connection string của SSO trỏ tới PgBouncer/HAProxy, không trỏ thẳng vào PostgreSQL node riêng lẻ.
2. Môi trường local/dev có thể dựng tối giản bằng Docker Compose nhưng vẫn giữ cùng pattern endpoint: SSO -> PgBouncer -> HAProxy -> PostgreSQL.
3. Môi trường staging/prod bắt buộc chạy đủ Patroni + etcd + HAProxy + PgBouncer để test failover thật trước khi go-live.
4. Database Connection Manager trong SSO vẫn cần health check và audit, nhưng không tự promote DB; chỉ ghi nhận trạng thái, cảnh báo và retry theo endpoint hạ tầng.
5. Snapshot backup mỗi 5 phút là lớp bảo vệ bổ sung, không thay thế streaming replication và failover tự động.
6. Với nhiều project DB hiện có trên pgAdmin4, áp dụng cùng nguyên tắc: project DB nào là production-critical thì nên có HA endpoint riêng; SSO lưu connection string theo endpoint HA, không lưu host node lẻ.

Kết luận: bắt đầu ngay từ đầu là tốt hơn về mặt kiến trúc, nhưng triển khai theo từng lớp. Không nên code SSO theo kiểu direct primary/backup rồi sau đó mới đổi, vì sẽ phải sửa lại connection, retry, failover assumption và test cases.

## 9. Audit log MongoDB cluster

Collection đề xuất: `audit_logs`

```json
{
  "eventType": "LOGIN_SUCCESS",
  "userId": "uuid",
  "clientApp": "PROJECT_A",
  "ip": "127.0.0.1",
  "userAgent": "browser",
  "status": "success",
  "metadata": {
    "dbRole": "primary",
    "requestId": "trace-id"
  },
  "createdAt": "2026-05-25T00:00:00.000Z"
}
```

Event bắt buộc:

- `LOGIN_SUCCESS`
- `LOGIN_FAILED`
- `LOGOUT`
- `TOKEN_REFRESH`
- `TOKEN_VERIFY_FAILED`
- `PASSWORD_CHANGED`
- `ROLE_CHANGED`
- `DB_CONNECTION_FAILED`
- `DB_FAILOVER_STARTED`
- `DB_FAILOVER_SUCCESS`
- `DB_FAILOVER_FAILED`
- `DB_BACKUP_STARTED`
- `DB_BACKUP_SUCCESS`
- `DB_BACKUP_FAILED`

## 10. Bảo mật

- Không commit `.env` thật.
- Chỉ commit `.env.example` và config example.
- Connection string nên được mã hóa hoặc lấy từ secret manager ở production.
- Password user phải hash bằng Argon2 hoặc bcrypt.
- Authorization code chỉ dùng một lần, TTL ngắn và bắt buộc PKCE cho public client.
- Refresh token lưu dạng hash, không lưu plaintext.
- Access token TTL ngắn.
- ID token ký bằng khóa bất đối xứng qua JWKS.
- Refresh token rotation.
- Rate limit endpoint login.
- Lock account tạm thời sau nhiều lần login sai.
- CORS whitelist domain Project A/B.
- Nếu dùng cookie thì cần SameSite, HttpOnly, Secure và CSRF protection.
- Admin API bắt buộc role admin và audit log.

## 11. Roadmap triển khai

### Giai đoạn 0: UI login SSO tối thiểu nhưng chuẩn

- Tạo trang login tập trung cho SSO.
- Tạo trang consent nếu cần scope nhạy cảm hoặc third-party client.
- Tạo trang logout/end-session.
- Tạo trang lỗi OAuth2/OIDC thân thiện cho redirect_uri sai, client_id sai, access denied, session expired.
- UI login dùng session/cookie bảo mật phía SSO để hoàn tất authorization code flow.
- Project clients không tự xây form nhập password nếu dùng SSO chuẩn.

### Giai đoạn 1: Khởi tạo nền tảng

- Khởi tạo Node.js project.
- Chọn NestJS làm framework Backend chính.
- Tạo cấu trúc module: auth, users, clients, db-manager, audit, scheduler, admin.
- Tạo `.env.example`.
- Tạo `config/db-connections.example.json`.
- Tạo Docker Compose local nếu cần.

### Giai đoạn 2: Kết nối DB

- Implement Database Connection Manager.
- Tạo pool PostgreSQL cho SSO primary/backup.
- Tạo pool PostgreSQL cho Project A/B.
- Tạo MongoDB client.
- Implement endpoint test connection.
- Implement health check.

### Giai đoạn 3: DB schema SSO

- Tạo migration cho users, clients, mappings, sessions, refresh_tokens, roles, permissions.
- Seed client Project A và Project B.
- Tạo admin user đầu tiên.
- Tạo mapping user SSO với Project A/B.

### Giai đoạn 4: OAuth2/OIDC Provider

- Implement OIDC discovery metadata.
- Implement JWKS endpoint và quản lý khóa ký token.
- Implement authorization endpoint.
- Implement UI login tập trung của SSO cho authorization flow.
- Implement consent UI nếu cần.
- Implement logout/end-session UI.
- Implement authorization code storage và PKCE validation.
- Implement token endpoint cho authorization code grant và refresh token grant.
- Implement userinfo endpoint.
- Implement introspection endpoint.
- Implement revocation endpoint.
- Implement logout endpoint.
- Ghi audit log cho mọi OAuth/OIDC event.

### Giai đoạn 5: Tích hợp Project A/B

Vì hiện tại Project A/B không được sửa code, giai đoạn này chia thành 2 bước rõ ràng.

#### Giai đoạn 5A: Read-only integration readiness, không sửa Project A/B

- Khai báo Project A/B trong SSO bằng `client_id`, domain, dự kiến `redirect_uris`, scopes và connection string.
- Test kết nối DB Project A/B bằng quyền đọc tối thiểu.
- Đọc schema user/role/permission/session để lập bản đồ identity.
- Tạo mapping SSO user với user Project A/B trong `user_app_mappings`.
- Tạo tài liệu callback cần thêm theo convention `express-automatic-routes`.
- Không ghi session/token/cookie vào Project A/B.
- Không coi đây là go-live SSO vào Project A/B.

#### Giai đoạn 5B: Full OIDC integration sau khi được duyệt sửa Project A/B

- Project A redirect user sang `/oauth/authorize` và xử lý callback authorization code.
- Project B redirect user sang `/oauth/authorize` và xử lý callback authorization code.
- Callback route của từng project nên là Resource object theo `express-automatic-routes`, ví dụ file controller export `get.handler`.
- Project A/B dùng service auth/session hiện hữu để tạo JWT access/refresh token và ghi `user_sessions`, không để SSO ghi thẳng vào DB session của project.
- Các dự án khác chỉ cần đăng ký thêm `client_id`, `redirect_uris`, scopes và connection string.
- SSO đọc user mapping từ DB từng dự án nếu cần.
- Chuẩn hóa response user info cho từng app.

### Giai đoạn 6: Backup và failover

- Dựng PostgreSQL cluster bằng Patroni và streaming replication.
- Dựng etcd cluster cho distributed consensus.
- Dựng HAProxy để route primary/write endpoint và optional replica/read endpoint.
- Dựng PgBouncer làm connection pooling endpoint cho SSO.
- Cấu hình SSO connection string trỏ tới PgBouncer/HAProxy thay vì trỏ thẳng PostgreSQL node.
- Implement health check endpoint đọc trạng thái qua HAProxy/Patroni API nếu có.
- Implement backup/snapshot job chu kỳ 5 phút như lớp bảo vệ bổ sung.
- Ghi audit replication/failover/connection event vào MongoDB.
- Implement quy trình restore/failback theo Patroni, không tự promote DB trong code SSO.

### Giai đoạn 7: Test và vận hành

- Test OIDC discovery metadata.
- Test authorization code flow với PKCE thành công/thất bại.
- Test token exchange và refresh token rotation.
- Test JWKS và verify chữ ký token từ Project A/B.
- Test kết nối Project A/B.
- Test Mongo audit.
- Test backup mỗi 5 phút.
- Test tắt DB primary và kiểm tra switch sang backup.
- Test primary phục hồi và quy trình đồng bộ lại.
- Viết tài liệu vận hành.

## 12. Roadmap tách riêng local Docker Compose và production Kubernetes Helm

Mục tiêu của việc tách roadmap là tránh nhầm lẫn giữa môi trường local để developer chạy nhanh và môi trường production yêu cầu HA, security, monitoring, CI/CD, rollback đầy đủ.

### Roadmap A: Local development bằng Docker Compose

Roadmap local dùng để developer build, test logic, kiểm tra OAuth2/OIDC flow, kết nối PostgreSQL/MongoDB local hoặc DB có sẵn trong pgAdmin4. Local không bắt buộc Patroni, Kubernetes, Helm, Prometheus đầy đủ.

| Bước | Công việc | Kết quả cần đạt |
|---|---|---|
| 1 | Cài Node.js LTS, Docker Desktop, Docker Compose, pgAdmin4, MongoDB Compass | Máy developer đủ công cụ chạy local |
| 2 | Clone repo và chạy `npm install` | Source code và dependency sẵn sàng |
| 3 | Copy `.env.example` thành `.env` | Có file cấu hình local riêng, không commit secret |
| 4 | Chạy `docker-compose.local.yml` | PostgreSQL local, MongoDB local hoặc service phụ trợ chạy được |
| 5 | Tạo SSO Login DB bằng pgAdmin4 hoặc migration script | DB `sso_login` sẵn sàng cho local |
| 6 | Tạo MongoDB audit DB bằng MongoDB Compass hoặc script init | DB `sso_audit` và collection `audit_logs` sẵn sàng |
| 7 | Chạy migrations và seeds | Có bảng SSO, admin user, clients mẫu |
| 8 | Start NestJS bằng `npm run start:dev` | SSO API chạy local |
| 9 | Test OIDC discovery, authorize, token, userinfo, jwks | OAuth2/OIDC flow local hoạt động |
| 10 | Test connection string tới project DB mẫu | DB Connection Manager đọc được project DB |
| 11 | Test audit log login success/failed | MongoDB ghi được audit event |
| 12 | Chạy unit/e2e tests | Logic chính pass trước khi mở PR |

Local acceptance checklist:

- SSO API start thành công.
- `/.well-known/openid-configuration` trả metadata đúng.
- Login UI mở được.
- Authorization Code Flow với PKCE chạy được trên local.
- PostgreSQL local hoặc project DB kết nối được.
- MongoDB audit ghi được event.
- Không có secret thật bị commit.

### Roadmap B: Production deployment bằng Kubernetes Helm

Roadmap production dùng cho staging/prod. Mọi deployment production phải đi qua CI/CD, Helm, security scan, monitoring, alerting và rollback policy.

| Bước | Công việc | Kết quả cần đạt |
|---|---|---|
| 1 | Chuẩn bị Kubernetes cluster, namespace dev/staging/prod | Hạ tầng deploy app sẵn sàng |
| 2 | Chuẩn bị PostgreSQL HA bằng Patroni, etcd, HAProxy, PgBouncer | SSO DB có HA endpoint ổn định |
| 3 | Chuẩn bị MongoDB replica set/cluster cho audit | Audit DB có cluster và auth/TLS |
| 4 | Chuẩn bị Kubernetes Secrets cho DB, MongoDB, OIDC signing keys, client secrets | Secret không nằm trong source code |
| 5 | Build Docker image qua CI/CD | Image có tag SemVer và Git SHA |
| 6 | Chạy security scan dependency, secret scan, image scan | Không còn lỗi critical chưa được duyệt |
| 7 | Chạy Helm lint/template | Helm chart hợp lệ |
| 8 | Deploy staging bằng Helm | Staging chạy image tag cố định |
| 9 | Chạy migration job staging | Schema staging cập nhật an toàn |
| 10 | Chạy smoke test OIDC trên staging | Discovery, authorize, token, userinfo, jwks hoạt động |
| 11 | Kiểm tra Prometheus/Grafana/Alertmanager staging | Metrics, dashboard, alert hoạt động |
| 12 | Test Helm rollback trên staging | Rollback policy đã kiểm chứng |
| 13 | Manual approval production | Chỉ người có quyền release được duyệt |
| 14 | Deploy production bằng Helm | Production rollout an toàn |
| 15 | Chạy post-deploy verify | OIDC, DB, audit, health, metrics đều OK |
| 16 | Theo dõi alert sau deploy | Phát hiện sớm lỗi login/token/DB/audit |

Production acceptance checklist:

- SSO chạy nhiều replicas sau HAProxy/Ingress.
- SSO DB connection string trỏ tới PgBouncer/HAProxy endpoint.
- Patroni/etcd failover đã test thành công.
- MongoDB audit cluster ghi event ổn định.
- Helm deploy và rollback đã test trên staging.
- Prometheus scrape được `/metrics`.
- Grafana có dashboard SSO/OIDC/DB HA/MongoDB/HAProxy/PgBouncer.
- Alertmanager gửi được test alert.
- Production image không dùng `latest`.
- Security go-live gate pass.

### Nguyên tắc chuyển từ local sang production

- Local dùng Docker Compose để nhanh, production dùng Kubernetes/Helm để chuẩn hóa vận hành.
- Local có thể dùng PostgreSQL/MongoDB đơn node, production bắt buộc HA theo kế hoạch.
- Local có thể dùng secrets trong `.env`, production bắt buộc Kubernetes Secret hoặc secret manager.
- Local test chức năng, staging test tích hợp và rollback, production chỉ deploy sau manual approval.
- Không lấy file `.env` local đưa lên production.
- Không bypass CI/CD để deploy production thủ công.

## 13. Todo triển khai chi tiết

- Xác định schema thật của toàn bộ DB dự án cần tích hợp: bảng user, cột id, email, password, role, status, profile JSONB nếu có.
- Thiết kế UI login SSO tập trung ngay từ đầu vì OAuth2/OIDC production cần redirect user tới Identity Provider để nhập mật khẩu an toàn.
- Chọn NestJS cho Backend JavaScript vì đây là dự án SSO production, cần kiến trúc module rõ ràng, dependency injection, guard, interceptor, validation pipe, testing module và maintainability tốt hơn Express thuần.
- Tạo cấu trúc project Node.js theo kiến trúc module của NestJS.
- Tạo file `.env.example` chứa connection string mẫu, trong đó SSO Login DB trỏ tới PgBouncer/HAProxy endpoint thay vì PostgreSQL node riêng lẻ.
- Tạo file `config/db-connections.example.json` mô tả nhiều project DB, SSO DB endpoint qua PgBouncer/HAProxy và Mongo audit.
- Dựng migration cho SSO Login DB.
- Tạo seed clients cho nhiều dự án, bắt đầu với Project A và Project B.
- Dựng hạ tầng PostgreSQL production pattern ngay từ đầu: Patroni, etcd, HAProxy và PgBouncer.
- Implement Database Connection Manager theo nguyên tắc chỉ kết nối endpoint ổn định, không tự promote DB trong application code.
- Implement PostgreSQL pool manager với `pg`.
- Implement MongoDB audit logger.
- Implement OIDC Provider Service bằng `oidc-provider` với authorize, token, userinfo, jwks, introspect, revoke và logout.
- Implement access token, refresh token rotation, ID token và JWKS.
- Implement password hashing.
- Implement user mapping giữa SSO và nhiều project clients.
- Implement admin endpoint test connection string.
- Implement health check endpoint cho SSO, PgBouncer/HAProxy và tùy chọn Patroni API.
- Implement scheduler snapshot backup hoặc backup verification mỗi 5 phút.
- Implement retry, circuit breaker và audit khi DB endpoint lỗi, không implement promote primary/backup trong application code.
- Implement audit event cho toàn bộ auth, DB connection, replication và failover event.
- Viết test API bằng Jest/Supertest.
- Viết tài liệu chạy local, cấu hình pgAdmin4, cấu hình MongoDB, Patroni, HAProxy, PgBouncer và quy trình failover.

## 14. Tiêu chí nghiệm thu

- SSO kết nối thành công DB Project A bằng connection string.
- SSO kết nối thành công DB Project B bằng connection string.
- SSO có UI login tập trung để user nhập thông tin đăng nhập tại Identity Provider, không nhập password ở từng project client.
- SSO đăng nhập được user hợp lệ qua OAuth2/OIDC authorization code flow.
- SSO cấp authorization code, access token, refresh token và ID token.
- Project A/B verify được token qua JWKS hoặc introspection endpoint.
- Login thất bại được ghi audit log MongoDB.
- Login thành công được ghi audit log MongoDB.
- PostgreSQL streaming replication hoạt động giữa các node SSO DB dưới quản lý Patroni.
- etcd hoạt động ổn định và Patroni không tạo split-brain.
- HAProxy route đúng primary/write endpoint sau khi Patroni promote node mới.
- PgBouncer cung cấp connection pooling endpoint ổn định cho SSO.
- Snapshot backup hoặc job kiểm tra backup chạy theo chu kỳ 5 phút nếu hạ tầng cho phép.
- Khi SSO primary lỗi, Patroni tự promote standby, HAProxy/PgBouncer route lại, SSO không cần đổi connection string.
- Khi failover xảy ra, MongoDB có audit event.
- Có tài liệu cấu hình connection string và chạy hệ thống.

## 15. Cấu trúc sơ đồ cây mẫu cho dự án

Cấu trúc đề xuất theo hướng production NestJS, tách rõ application code, UI login, hạ tầng HA, migration, config, test và tài liệu vận hành.

```text
sso-vietprodev/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .env.example
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── docker-build.yml
│       ├── helm-deploy-staging.yml
│       └── helm-deploy-production.yml
├── docker-compose.local.yml
├── docker-compose.ha.yml
├── config/
│   ├── db-connections.example.json
│   ├── oidc.example.json
│   ├── clients.example.json
│   └── security.example.json
├── plans/
│   └── sso-project-plan.md
├── docs/
│   ├── architecture.md
│   ├── oauth2-oidc-flow.md
│   ├── database-ha.md
│   ├── pgadmin4-connections.md
│   ├── onboarding-new-project.md
│   ├── backup-restore.md
│   ├── failover-runbook.md
│   └── deployment.md
├── guide/
│   ├── README.md
│   ├── 01-local-setup.md
│   ├── 02-pgadmin4-postgresql-setup.md
│   ├── 03-mongodb-compass-cluster-setup.md
│   ├── 04-env-and-connection-strings.md
│   ├── 05-oidc-client-registration.md
│   ├── 06-project-db-onboarding.md
│   ├── 07-patroni-etcd-haproxy-pgbouncer.md
│   ├── 08-kubernetes-helm-deployment.md
│   ├── 09-monitoring-prometheus-grafana-alertmanager.md
│   ├── 10-cicd-release-rollback.md
│   ├── 11-security-production-checklist.md
│   ├── 12-incident-response-runbook.md
│   ├── rules.md
│   └── instructions.md
├── secrets/
│   ├── .gitkeep
│   └── README.md
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_clients.sql
│   ├── 003_create_project_db_connections.sql
│   ├── 004_create_roles_permissions.sql
│   ├── 005_create_sessions_tokens.sql
│   └── 006_create_failover_events.sql
├── seeds/
│   ├── seed-admin-user.ts
│   ├── seed-default-roles.ts
│   └── seed-demo-clients.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── constants/
│   │   │   ├── audit-events.constant.ts
│   │   │   ├── oidc-scopes.constant.ts
│   │   │   └── security.constant.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── request-id.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── admin.guard.ts
│   │   │   └── oidc-session.guard.ts
│   │   ├── interceptors/
│   │   │   ├── audit.interceptor.ts
│   │   │   └── request-id.interceptor.ts
│   │   ├── middleware/
│   │   │   ├── security-headers.middleware.ts
│   │   │   └── request-context.middleware.ts
│   │   └── utils/
│   │       ├── crypto.util.ts
│   │       ├── env.util.ts
│   │       └── pagination.util.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── config.module.ts
│   │   ├── db-config.service.ts
│   │   ├── oidc-config.service.ts
│   │   └── validation.schema.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── postgres/
│   │   │   ├── postgres-pool.service.ts
│   │   │   ├── project-pool.registry.ts
│   │   │   ├── sso-pool.service.ts
│   │   │   └── transaction.service.ts
│   │   ├── mongo/
│   │   │   ├── mongo.module.ts
│   │   │   ├── mongo-client.service.ts
│   │   │   └── collections.ts
│   │   └── health/
│   │       ├── db-health.service.ts
│   │       └── db-health.types.ts
│   ├── db-manager/
│   │   ├── db-manager.module.ts
│   │   ├── db-connection-manager.service.ts
│   │   ├── db-connection-router.service.ts
│   │   ├── db-connection-health.service.ts
│   │   └── dto/
│   │       ├── test-connection.dto.ts
│   │       └── project-db-config.dto.ts
│   ├── oidc/
│   │   ├── oidc.module.ts
│   │   ├── oidc-provider.factory.ts
│   │   ├── oidc-provider.service.ts
│   │   ├── oidc-adapter.service.ts
│   │   ├── oidc-claims.service.ts
│   │   ├── oidc-interactions.controller.ts
│   │   ├── oidc-routes.controller.ts
│   │   └── views/
│   │       ├── login.hbs
│   │       ├── consent.hbs
│   │       ├── logout.hbs
│   │       └── error.hbs
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── password.service.ts
│   │   ├── session.service.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── change-password.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   ├── clients/
│   │   ├── clients.module.ts
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   ├── clients.repository.ts
│   │   └── dto/
│   │       ├── create-client.dto.ts
│   │       └── update-client.dto.ts
│   ├── project-integrations/
│   │   ├── project-integrations.module.ts
│   │   ├── project-user-mapping.service.ts
│   │   ├── project-user-reader.service.ts
│   │   └── dto/
│   │       ├── create-user-mapping.dto.ts
│   │       └── project-user-query.dto.ts
│   ├── audit/
│   │   ├── audit.module.ts
│   │   ├── audit-logger.service.ts
│   │   ├── audit.repository.ts
│   │   └── schemas/
│   │       └── audit-log.schema.ts
│   ├── admin/
│   │   ├── admin.module.ts
│   │   ├── admin-db.controller.ts
│   │   ├── admin-clients.controller.ts
│   │   ├── admin-users.controller.ts
│   │   └── admin-health.controller.ts
│   ├── health/
│   │   ├── health.module.ts
│   │   ├── health.controller.ts
│   │   ├── app-health.service.ts
│   │   ├── haproxy-health.service.ts
│   │   ├── pgbouncer-health.service.ts
│   │   └── patroni-health.service.ts
│   └── scheduler/
│       ├── scheduler.module.ts
│       ├── backup-check.scheduler.ts
│       ├── db-health.scheduler.ts
│       └── audit-cleanup.scheduler.ts
├── public/
│   ├── css/
│   │   └── login.css
│   ├── js/
│   │   └── login.js
│   └── assets/
│       ├── logo.svg
│       └── favicon.ico
├── infrastructure/
│   ├── docker/
│   │   ├── app.Dockerfile
│   │   └── nginx.Dockerfile
│   ├── postgres-ha/
│   │   ├── patroni/
│   │   │   ├── patroni-node1.yml
│   │   │   ├── patroni-node2.yml
│   │   │   └── patroni-node3.yml
│   │   ├── etcd/
│   │   │   ├── etcd-node1.env
│   │   │   ├── etcd-node2.env
│   │   │   └── etcd-node3.env
│   │   ├── haproxy/
│   │   │   └── haproxy.cfg
│   │   ├── pgbouncer/
│   │   │   ├── pgbouncer.ini
│   │   │   └── userlist.example.txt
│   │   └── scripts/
│   │       ├── init-cluster.ps1
│   │       ├── backup-snapshot.ps1
│   │       ├── restore-snapshot.ps1
│   │       └── failover-test.ps1
│   ├── mongodb/
│   │   ├── replica-set-init.js
│   │   └── indexes.js
│   ├── nginx/
│   │   └── nginx.conf
│   ├── kubernetes/
│   │   ├── namespaces/
│   │   │   ├── sso-dev.namespace.yml
│   │   │   ├── sso-staging.namespace.yml
│   │   │   └── sso-prod.namespace.yml
│   │   ├── base/
│   │   │   ├── sso-api.deployment.yml
│   │   │   ├── sso-api.service.yml
│   │   │   ├── sso-api.ingress.yml
│   │   │   ├── sso-api.configmap.yml
│   │   │   ├── sso-api.secret.example.yml
│   │   │   ├── sso-api.hpa.yml
│   │   │   └── sso-api.pdb.yml
│   │   ├── overlays/
│   │   │   ├── dev/
│   │   │   │   └── kustomization.yml
│   │   │   ├── staging/
│   │   │   │   └── kustomization.yml
│   │   │   └── prod/
│   │   │       └── kustomization.yml
│   │   └── jobs/
│   │       ├── migration-job.yml
│   │       ├── seed-job.yml
│   │       └── backup-verify-cronjob.yml
│   ├── helm/
│   │   └── sso-api/
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       ├── values-dev.yaml
│   │       ├── values-staging.yaml
│   │       ├── values-prod.yaml
│   │       └── templates/
│   │           ├── deployment.yaml
│   │           ├── service.yaml
│   │           ├── ingress.yaml
│   │           ├── configmap.yaml
│   │           ├── secret.example.yaml
│   │           ├── hpa.yaml
│   │           ├── pdb.yaml
│   │           ├── serviceaccount.yaml
│   │           └── migration-job.yaml
│   ├── ci-cd/
│   │   ├── github-actions/
│   │   │   ├── ci.md
│   │   │   ├── docker-build.md
│   │   │   └── helm-deploy.md
│   │   ├── quality-gates.md
│   │   ├── release-strategy.md
│   │   └── rollback-strategy.md
│   └── monitoring/
│       ├── prometheus/
│       │   ├── prometheus.yml
│       │   ├── alert-rules.yml
│       │   └── recording-rules.yml
│       ├── grafana/
│       │   ├── dashboards/
│       │   │   ├── sso-api-dashboard.json
│       │   │   ├── oidc-flow-dashboard.json
│       │   │   ├── postgres-ha-dashboard.json
│       │   │   ├── mongodb-audit-dashboard.json
│       │   │   └── haproxy-pgbouncer-dashboard.json
│       │   └── provisioning/
│       │       ├── dashboards.yml
│       │       └── datasources.yml
│       ├── alertmanager/
│       │   ├── alertmanager.yml
│       │   └── notification-templates.tmpl
│       └── exporters/
│           ├── postgres-exporter.env.example
│           ├── mongodb-exporter.env.example
│           ├── haproxy-exporter.env.example
│           └── pgbouncer-exporter.env.example
├── test/
│   ├── unit/
│   │   ├── auth.service.spec.ts
│   │   ├── oidc-provider.service.spec.ts
│   │   ├── db-connection-manager.service.spec.ts
│   │   └── audit-logger.service.spec.ts
│   ├── e2e/
│   │   ├── oidc-flow.e2e-spec.ts
│   │   ├── login-ui.e2e-spec.ts
│   │   ├── db-health.e2e-spec.ts
│   │   └── admin-api.e2e-spec.ts
│   └── fixtures/
│       ├── users.fixture.ts
│       ├── clients.fixture.ts
│       └── tokens.fixture.ts
└── scripts/
    ├── generate-jwks.ts
    ├── run-migrations.ts
    ├── seed.ts
    ├── test-db-connections.ts
    └── smoke-test-oidc.ts
```

### Ghi chú tổ chức thư mục

| Thư mục | Mục đích |
|---|---|
| `src/oidc` | Tích hợp `oidc-provider`, xử lý authorize, token, userinfo, jwks, introspection, interaction UI |
| `src/database` | Quản lý PostgreSQL pool, MongoDB client, transaction và health check DB |
| `src/db-manager` | Đọc cấu hình nhiều project DB, route connection theo `app_code`, test connection string |
| `src/project-integrations` | Mapping user SSO với user ở các dự án bên ngoài |
| `src/audit` | Ghi audit log vào MongoDB cluster |
| `src/health` | Health check SSO, PgBouncer, HAProxy, Patroni |
| `infrastructure/postgres-ha` | Cấu hình Patroni, etcd, HAProxy, PgBouncer và script vận hành HA |
| `migrations` | SQL migration cho SSO Login DB |
| `seeds` | Dữ liệu khởi tạo admin, roles, clients |
| `docs` | Tài liệu kiến trúc, kết nối pgAdmin4, onboarding project, backup/restore và runbook failover |
| `guide` | Hướng dẫn thao tác từng bước cho setup thủ công bằng pgAdmin4, MongoDB Compass, cấu hình connection string, OIDC clients, onboarding project DB, HA, Kubernetes/Helm, monitoring, CI/CD, security và incident response |
| `.github/workflows` | CI/CD workflows để chạy lint, test, security scan, build Docker image và deploy Helm |
| `infrastructure/ci-cd` | Tài liệu quality gates, release strategy, rollback strategy và quy trình CI/CD |
| `infrastructure/kubernetes` | Manifest Kubernetes production/staging/dev cho SSO API, ingress, config, secret mẫu, autoscaling, disruption budget và jobs |
| `infrastructure/helm` | Helm chart để deploy SSO API nhất quán giữa các môi trường, dễ override bằng values riêng |
| `infrastructure/monitoring` | Prometheus, Grafana, Alertmanager và exporters để quan sát SSO API, OAuth2/OIDC flow, PostgreSQL HA, MongoDB audit, HAProxy và PgBouncer |

### Đánh giá Kubernetes/Helm và Monitoring có cần thiết không

Kết luận: cần thiết cho dự án production, nhưng nên đưa vào kế hoạch theo mức tối thiểu chuẩn ngay từ đầu.

| Hạng mục | Có cần không | Lý do |
|---|---|---|
| Kubernetes manifests | Cần nếu production chạy trên Kubernetes hoặc dự kiến scale nhiều instance SSO | Giúp chuẩn hóa deployment, service, ingress, autoscaling, secret/config, rollout/rollback |
| Helm chart | Nên có khi có nhiều môi trường dev/staging/prod | Giúp đóng gói release, override cấu hình theo môi trường, tránh copy/paste manifest |
| Prometheus | Cần cho production | Thu thập metrics SSO API, Node.js runtime, PostgreSQL, MongoDB, HAProxy, PgBouncer |
| Grafana | Cần cho vận hành | Dashboard trực quan để theo dõi login rate, lỗi OAuth2/OIDC, latency, DB health, failover |
| Alertmanager | Cần cho production | Cảnh báo khi login lỗi tăng, DB failover, replication lag, token endpoint lỗi, HAProxy/PgBouncer bất thường |

Hướng tốt nhất đã chốt:

- Chọn Kubernetes/Helm cho production deployment vì dự án SSO là hệ thống trung tâm, cần scale nhiều instance, rolling update, rollback nhanh, quản lý config/secret theo môi trường và triển khai nhất quán dev/staging/prod.
- Chọn Prometheus/Grafana/Alertmanager cho production observability vì SSO cần phát hiện sớm lỗi đăng nhập, lỗi OAuth2/OIDC, latency tăng, DB failover, replication lag, lỗi MongoDB audit, HAProxy/PgBouncer quá tải.
- Giữ `docker-compose.local.yml` cho local development để developer chạy nhanh, không bắt buộc Kubernetes ở local.
- Dùng Helm làm chuẩn deploy chính cho staging/prod; Kubernetes raw manifests hoặc Kustomize chỉ giữ làm base tham khảo nếu cần.
- Bổ sung metrics endpoint trong NestJS, ví dụ `/metrics`, ngay từ đầu để Prometheus scrape được.
- Bổ sung health endpoints theo lớp: `/health/live`, `/health/ready`, `/health/dependencies`.
- Alerting tối thiểu cần có: SSO API down, OIDC token endpoint lỗi cao, login failed spike, PostgreSQL replication lag, Patroni failover, PgBouncer connection saturation, MongoDB audit write failure.
- Không đưa toàn bộ monitoring thành phần quá phức tạp ngay giai đoạn code đầu tiên; nhưng cấu trúc, metrics endpoint, health endpoint, dashboard/alert template phải có ngay từ đầu để không phải refactor vận hành về sau.

### CI/CD pipeline cần bổ sung trước khi triển khai

Kết luận: CI/CD là bắt buộc cho production. Không nên triển khai thủ công vì SSO là hệ thống xác thực trung tâm, lỗi deploy có thể làm nhiều dự án không đăng nhập được.

Pipeline chuẩn đề xuất:

| Stage | Mục đích | Quality gate |
|---|---|---|
| Validate | Kiểm tra format, lint, typecheck | Không cho merge nếu lỗi lint hoặc TypeScript |
| Test | Chạy unit test, integration test, e2e test chính | Không cho build image nếu test fail |
| Security scan | Quét dependency, secret, Docker image | Không deploy nếu có critical vulnerability hoặc secret leak |
| Build Docker image | Build image SSO API và tag theo commit SHA/version | Image phải build reproducible và push registry thành công |
| Helm lint/template | Kiểm tra Helm chart và render manifest | Không deploy nếu chart lỗi |
| Deploy staging | Deploy bằng Helm vào staging | Chạy migration job, smoke test OIDC, health check, metrics check |
| Manual approval production | Xác nhận trước production | Chỉ người có quyền release được approve |
| Deploy production | Helm upgrade production theo rolling update | Health check, readiness, rollback tự động nếu fail |
| Post-deploy verify | Smoke test authorize/token/userinfo, kiểm tra alert silence | Rollback nếu endpoint quan trọng lỗi |

Workflow files đề xuất:

- `.github/workflows/ci.yml`: lint, typecheck, unit test, e2e test cơ bản.
- `.github/workflows/docker-build.yml`: build và push Docker image khi merge main hoặc tag release.
- `.github/workflows/helm-deploy-staging.yml`: deploy staging tự động sau khi image build thành công.
- `.github/workflows/helm-deploy-production.yml`: deploy production bằng Helm, có manual approval và rollback strategy.

Hướng tốt nhất: bổ sung CI/CD ngay từ đầu cùng Kubernetes/Helm. Local vẫn dùng Docker Compose, nhưng mọi staging/prod deployment phải đi qua pipeline để đảm bảo audit, rollback, versioning và giảm lỗi thao tác tay.

### Quy chuẩn branch, release versioning và rollback policy

Kết luận: cần quy chuẩn rõ ngay từ đầu để tránh deploy nhầm, rollback khó, không truy vết được version khi hệ thống SSO lỗi.

#### Branch strategy đề xuất

| Branch | Mục đích | Quy tắc |
|---|---|---|
| `main` | Source ổn định, có thể release production | Chỉ merge qua Pull Request, bắt buộc CI pass, code review và security scan pass |
| `develop` | Tích hợp tính năng cho staging | Merge từ feature branches, deploy staging tự động hoặc theo lịch |
| `feature/*` | Phát triển tính năng mới | Tạo từ `develop`, merge về `develop` qua Pull Request |
| `fix/*` | Sửa lỗi thường | Tạo từ `develop`, merge về `develop` |
| `hotfix/*` | Sửa lỗi production khẩn cấp | Tạo từ `main`, merge lại vào `main` và `develop` |
| `release/*` | Chuẩn bị release | Tạo từ `develop`, dùng để freeze scope, test staging, cập nhật version/changelog |

Quy tắc Pull Request:

- Bắt buộc lint, typecheck, unit test, integration test và e2e smoke test pass.
- Bắt buộc scan dependency, scan secret và Docker image scan pass trước khi merge `main`.
- Bắt buộc ít nhất một reviewer approve với feature thường, nhiều reviewer với thay đổi auth/security/DB migration/Helm.
- Không cho push trực tiếp vào `main` và `develop`.

#### Release versioning

Dùng Semantic Versioning: `MAJOR.MINOR.PATCH`.

| Loại version | Khi nào tăng | Ví dụ |
|---|---|---|
| `MAJOR` | Thay đổi breaking change API/OIDC contract/DB schema không backward compatible | `2.0.0` |
| `MINOR` | Thêm tính năng backward compatible, thêm endpoint, thêm scope, thêm module | `1.3.0` |
| `PATCH` | Fix bug, security patch nhỏ, tối ưu không đổi contract | `1.3.1` |

Quy chuẩn tag Docker image:

- `sso-api:<semver>` ví dụ `sso-api:1.3.0`.
- `sso-api:<git-sha>` ví dụ `sso-api:a1b2c3d`.
- `sso-api:staging-latest` chỉ dùng staging.
- Không dùng `latest` cho production.

Quy chuẩn Helm release:

- Chart version theo chart: `Chart.yaml` dùng `version`.
- App version theo Docker image: `appVersion` trỏ tới SemVer app.
- Production deploy bằng image tag SemVer hoặc Git SHA cố định.
- Mỗi release phải có changelog: feature, fix, migration, rollback note, risk note.

#### Rollback policy

Nguyên tắc quan trọng: rollback app dễ, rollback DB khó. Vì vậy migration phải thiết kế backward compatible.

| Tình huống | Hành động rollback |
|---|---|
| App deploy lỗi nhưng DB migration backward compatible | `helm rollback` về revision trước |
| App lỗi do config/secret | Revert values, deploy lại Helm revision ổn định |
| Token endpoint lỗi cao sau deploy | Rollback ngay, giữ nguyên DB nếu migration compatible |
| Migration đã chạy và không backward compatible | Không rollback app ngay nếu app cũ không đọc được schema mới; chạy hotfix forward hoặc migration rollback đã kiểm thử |
| OIDC signing key lỗi | Restore JWKS/secret từ backup, rollback config, không rotate key đột ngột nếu chưa có grace period |
| Patroni/DB failover trong lúc deploy | Dừng production deploy, xác nhận DB ổn định rồi mới resume |

Quy tắc migration an toàn:

- Ưu tiên expand-contract pattern: thêm cột/bảng trước, deploy app mới, sau đó mới cleanup ở release sau.
- Không xóa cột/bảng đang dùng trong cùng release.
- Migration phải idempotent nếu có thể.
- Backup/snapshot trước migration production.
- Migration job chạy trước app rollout hoặc theo hook có kiểm soát.
- Có rollback script cho migration rủi ro cao, nhưng ưu tiên forward-fix.

Quy trình release production đề xuất:

1. Merge `develop` sang `release/x.y.z`.
2. CI chạy full test, security scan, Helm lint/template.
3. Build Docker image tag `x.y.z` và Git SHA.
4. Deploy staging bằng Helm với image tag cố định.
5. Chạy smoke test OIDC: discovery, authorize, token, userinfo, jwks, introspection.
6. Kiểm tra metrics, logs, audit log MongoDB, DB health, Patroni/HAProxy/PgBouncer.
7. Tạo Pull Request từ `release/x.y.z` vào `main`.
8. Tag Git `vx.y.z` sau khi merge `main`.
9. Manual approval production.
10. Deploy production bằng Helm với image tag `x.y.z`.
11. Post-deploy verify và theo dõi alert.
12. Nếu fail quality gate production, rollback bằng Helm hoặc forward-fix theo rollback policy.

### Checklist bảo mật production trước khi triển khai

Kết luận: checklist bảo mật production là bắt buộc trước khi go-live vì SSO là điểm xác thực trung tâm. Nếu SSO bị lộ secret, sai cấu hình OAuth2/OIDC, hoặc mất audit log thì toàn bộ hệ sinh thái project client đều bị ảnh hưởng.

#### 1. OAuth2/OIDC security checklist

| Hạng mục | Yêu cầu bắt buộc |
|---|---|
| Authorization Code Flow | Chỉ dùng Authorization Code Flow với PKCE cho public clients |
| Redirect URI | Bắt buộc exact match, không dùng wildcard redirect URI ở production |
| Client secret | Confidential client phải có secret hash, không lưu plaintext |
| Token signing | ID token và access token dạng JWT phải ký bằng asymmetric key qua JWKS |
| Key rotation | Có kế hoạch rotate signing key với grace period, không xóa key cũ đột ngột |
| Access token TTL | TTL ngắn, ưu tiên 5 đến 15 phút tùy rủi ro |
| Refresh token | Lưu hash, rotation mỗi lần dùng, phát hiện reuse và revoke session |
| Scope | Scope tối thiểu theo từng client, không cấp scope mặc định quá rộng |
| Consent | Có consent UI nếu client thuộc nhóm third-party hoặc yêu cầu scope nhạy cảm |
| Introspection | Bảo vệ introspection endpoint bằng client authentication |
| Revocation | Hỗ trợ revoke token và logout session bắt buộc |
| Discovery/JWKS | Public endpoint đúng chuẩn, không expose private key |

#### 2. UI login và session security checklist

| Hạng mục | Yêu cầu bắt buộc |
|---|---|
| HTTPS | Bắt buộc HTTPS toàn bộ production, redirect HTTP sang HTTPS |
| Cookie | `HttpOnly`, `Secure`, `SameSite=Lax` hoặc `Strict` tùy flow |
| CSRF | Bật CSRF protection cho form login, consent, logout nếu dùng cookie session |
| Rate limit | Rate limit login, token, introspection, admin API |
| Brute force protection | Lock tạm thời hoặc step-up verification sau nhiều lần login sai |
| Password policy | Tối thiểu độ dài, kiểm tra mật khẩu yếu, không log password |
| Password hashing | Dùng Argon2id ưu tiên, hoặc bcrypt cost phù hợp production |
| MFA ready | Thiết kế schema và flow sẵn để bổ sung MFA sau này |
| Error message | Không tiết lộ user có tồn tại hay không trong lỗi login |
| Branding | Branding theo client nhưng không cho client inject HTML/CSS không kiểm soát |

#### 3. Secret và configuration checklist

| Hạng mục | Yêu cầu bắt buộc |
|---|---|
| Secret storage | Không commit secret thật; dùng Kubernetes Secret, sealed secret hoặc external secret manager |
| Connection string | Không hardcode; lấy từ env/secret; hạn chế quyền DB user theo nguyên tắc least privilege |
| JWKS private key | Private key chỉ tồn tại trong secret store, không đưa vào image |
| Environment separation | Dev/staging/prod dùng secret riêng, issuer riêng, callback riêng |
| CI/CD secrets | GitHub Actions secrets phải giới hạn quyền, không echo ra logs |
| Secret rotation | Có quy trình rotate DB password, client secret, JWT/OIDC key, Mongo credential |

#### 4. Database và data security checklist

| Hạng mục | Yêu cầu bắt buộc |
|---|---|
| PostgreSQL HA | SSO chỉ kết nối qua PgBouncer/HAProxy endpoint, không trỏ thẳng node riêng lẻ |
| DB privilege | App user chỉ có quyền cần thiết, admin/migration user tách riêng |
| TLS DB | Bật TLS cho kết nối DB ở production nếu network không hoàn toàn private/trusted |
| Backup encryption | Snapshot backup phải mã hóa và kiểm tra restore định kỳ |
| Migration safety | Migration backward compatible, có backup trước migration production |
| PII protection | Email, IP, user agent, audit metadata xử lý theo nguyên tắc tối thiểu dữ liệu |
| Audit immutability | Audit log nên append-only, hạn chế sửa/xóa trực tiếp |
| MongoDB auth | Bật authentication, authorization, TLS và replica set security |

#### 5. Kubernetes, network và runtime security checklist

| Hạng mục | Yêu cầu bắt buộc |
|---|---|
| Container image | Image minimal, non-root user, không chứa dev dependencies không cần thiết |
| Image scan | Scan vulnerability trước khi push/deploy, chặn critical vulnerabilities |
| Resource limit | Đặt CPU/memory requests và limits cho SSO API |
| Pod security | `runAsNonRoot`, `readOnlyRootFilesystem` nếu khả thi, drop Linux capabilities |
| Network policy | Chỉ cho SSO gọi DB endpoint, MongoDB, monitoring cần thiết |
| Ingress TLS | TLS certificate hợp lệ, HSTS, secure headers |
| RBAC | ServiceAccount quyền tối thiểu, không dùng cluster-admin |
| ConfigMap/Secret | Không đưa secret vào ConfigMap, không log env chứa secret |
| Readiness/Liveness | Tách `/health/live`, `/health/ready`, `/health/dependencies` |

#### 6. Monitoring, logging và alert security checklist

| Hạng mục | Yêu cầu bắt buộc |
|---|---|
| Sensitive log | Không log password, token, authorization code, client secret, connection string |
| Audit event | Ghi login success/failed, token refresh, revoke, logout, admin action, DB failover |
| Metrics | Không đưa PII vào metrics labels |
| Alerting | Alert khi login failed spike, token endpoint error, DB failover, audit write failure |
| Trace ID | Mỗi request có request ID/correlation ID để truy vết |
| Retention | Log/audit retention rõ ràng theo chính sách dữ liệu |

#### 7. CI/CD và supply-chain security checklist

| Hạng mục | Yêu cầu bắt buộc |
|---|---|
| Branch protection | Cấm push trực tiếp `main`, bắt buộc PR và CI pass |
| Dependency scan | Chạy npm audit hoặc SCA tool trong CI |
| Secret scan | Chạy secret scanning trước merge |
| SBOM | Tạo SBOM cho Docker image nếu production yêu cầu compliance |
| Image signing | Cân nhắc ký image bằng Cosign hoặc công cụ tương đương |
| Helm validation | Helm lint/template trước deploy |
| Manual approval | Production deploy cần manual approval |
| Rollback tested | Rollback policy phải được test trên staging |

#### 8. Go-live security gate

Trước khi go-live production, bắt buộc đạt các điều kiện:

- OIDC discovery, authorize, token, userinfo, JWKS, introspection, revocation hoạt động đúng.
- Không còn secret thật trong repository, Docker image, log, CI output.
- Security scan dependency và image không còn critical vulnerability chưa được chấp nhận rủi ro.
- PostgreSQL HA failover đã test qua Patroni/etcd/HAProxy/PgBouncer.
- Audit log MongoDB ghi nhận đầy đủ login, logout, token, admin, DB events.
- Prometheus scrape được `/metrics`, Grafana dashboard có dữ liệu, Alertmanager gửi cảnh báo test thành công.
- Helm rollback đã test trên staging.
- Backup snapshot và restore test đã thành công.
- Tài liệu runbook incident, failover, rollback, key rotation đã sẵn sàng.

Kết luận: hướng phù hợp và tốt nhất cho yêu cầu hiện tại là NestJS + `oidc-provider` + UI login SSO + PostgreSQL HA bằng Patroni/etcd/HAProxy/PgBouncer + Kubernetes/Helm cho production deployment + Prometheus/Grafana/Alertmanager cho monitoring và alerting + CI/CD pipeline cho test, build Docker image và deploy Helm + branch/release/rollback policy chuẩn production + security checklist bắt buộc trước go-live. Local development vẫn dùng Docker Compose để đơn giản hóa quá trình build và test.

## 16. Cấu trúc thư mục guide và nội dung hướng dẫn thao tác thủ công

Thư mục `guide` là nơi đặt toàn bộ hướng dẫn từng bước để người vận hành có thể mở phần mềm như pgAdmin4, MongoDB Compass, Kubernetes dashboard, Grafana hoặc GitHub Actions và làm theo. Các file trong `guide` không thay thế source code, mà là runbook và instruction chuẩn theo kế hoạch trong [`plans/sso-project-plan.md`](plans/sso-project-plan.md).

| File | Nội dung bắt buộc |
|---|---|
| `guide/README.md` | Mục lục hướng dẫn, thứ tự đọc, vai trò từng guide và điều kiện trước khi triển khai |
| `guide/01-local-setup.md` | Cài Node.js, Docker, Docker Compose, pgAdmin4, MongoDB Compass, clone repo, tạo `.env`, chạy local |
| `guide/02-pgadmin4-postgresql-setup.md` | Tạo server connection trong pgAdmin4, tạo DB SSO, kiểm tra DB project, lấy connection string, test quyền user |
| `guide/03-mongodb-compass-cluster-setup.md` | Kết nối MongoDB Compass, tạo DB audit, tạo collection, index, kiểm tra replica set/cluster và auth |
| `guide/04-env-and-connection-strings.md` | Cách điền `.env`, mapping connection string, format PostgreSQL/MongoDB URL, lưu ý không commit secret |
| `guide/05-oidc-client-registration.md` | Đăng ký Project Client, client_id, redirect_uri, post_logout_redirect_uri, scopes, PKCE và client secret |
| `guide/06-project-db-onboarding.md` | Thêm dự án mới vào SSO: khai báo client, khai báo project DB, mapping user, test login và userinfo |
| `guide/07-patroni-etcd-haproxy-pgbouncer.md` | Thiết lập HA PostgreSQL production bằng Patroni, etcd, HAProxy, PgBouncer và test failover |
| `guide/08-kubernetes-helm-deployment.md` | Deploy staging/prod bằng Helm, cấu hình namespace, secret, values, migration job, rollout và rollback |
| `guide/09-monitoring-prometheus-grafana-alertmanager.md` | Bật `/metrics`, cấu hình Prometheus scrape, import Grafana dashboard, cấu hình Alertmanager |
| `guide/10-cicd-release-rollback.md` | Branch policy, SemVer, Docker tag, GitHub Actions, deploy staging/prod, manual approval, rollback |
| `guide/11-security-production-checklist.md` | Checklist bảo mật trước go-live cho OIDC, secrets, DB, Kubernetes, logging, monitoring, CI/CD |
| `guide/12-incident-response-runbook.md` | Xử lý sự cố login lỗi, token lỗi, DB failover, Mongo audit lỗi, rollback release, rotate key |
| `guide/rules.md` | Quy tắc bắt buộc của dự án: coding, security, branch, migration, logging, deployment |
| `guide/instructions.md` | Instruction thao tác chuẩn cho developer/devops/admin khi làm việc với dự án |

### Template chuẩn cho mỗi file guide

Mỗi file trong `guide` nên có cấu trúc thống nhất:

1. Mục tiêu của guide.
2. Ai cần đọc guide này.
3. Điều kiện chuẩn bị.
4. Các bước thao tác chi tiết.
5. Cách kiểm tra đã làm đúng.
6. Lỗi thường gặp và cách xử lý.
7. Checklist hoàn thành.
8. Liên kết sang guide liên quan.

### Ví dụ nội dung chi tiết cho pgAdmin4 guide

File `guide/02-pgadmin4-postgresql-setup.md` cần hướng dẫn theo thứ tự:

1. Mở pgAdmin4.
2. Tạo server connection tới PostgreSQL SSO HA endpoint nếu có, hoặc DB local nếu dev.
3. Nhập host, port, username, password và bật save password nếu máy cá nhân an toàn.
4. Kiểm tra kết nối bằng query `SELECT version();`.
5. Tạo database `sso_login` cho local/dev nếu chưa có.
6. Tạo user app riêng, không dùng superuser.
7. Gán quyền tối thiểu cho app user.
8. Kiểm tra các DB project hiện có.
9. Ghi lại database name, host, port, username để tạo connection string.
10. Test connection string bằng endpoint admin hoặc script `scripts/test-db-connections.ts`.

### Ví dụ nội dung chi tiết cho MongoDB guide

File `guide/03-mongodb-compass-cluster-setup.md` cần hướng dẫn theo thứ tự:

1. Mở MongoDB Compass.
2. Nhập MongoDB connection string của audit cluster.
3. Kiểm tra authentication và TLS nếu production.
4. Tạo database `sso_audit` nếu chưa có.
5. Tạo collection `audit_logs`.
6. Tạo index cho `createdAt`, `eventType`, `userId`, `clientApp`, `requestId`.
7. Insert thử một audit event mẫu.
8. Kiểm tra SSO API ghi log thật khi login failed/login success.
9. Không xóa hoặc sửa audit log trực tiếp trừ khi có quy trình được duyệt.

### Ví dụ nội dung chi tiết cho OIDC client registration guide

File `guide/05-oidc-client-registration.md` cần hướng dẫn theo thứ tự:

1. Xác định app code của project mới.
2. Xác định redirect URI chính xác của môi trường dev/staging/prod.
3. Tạo client trong SSO DB hoặc admin API.
4. Cấu hình scopes tối thiểu: `openid`, `profile`, `email` và scope nghiệp vụ nếu cần.
5. Bật PKCE cho public client.
6. Tạo client secret cho confidential client và chỉ hiển thị một lần.
7. Test authorize URL.
8. Test callback nhận authorization code.
9. Test token exchange.
10. Test userinfo/JWKS/introspection.

### Nội dung mẫu chi tiết cho từng file trong thư mục guide

#### guide/README.md

Mục tiêu: đóng vai trò trang điều hướng chính cho toàn bộ hướng dẫn vận hành dự án SSO.

Nội dung mẫu cần có:

```md
# Guide vận hành dự án SSO

## Mục tiêu
Tài liệu này tổng hợp thứ tự đọc và thao tác để setup, vận hành, deploy, monitor và xử lý sự cố hệ thống SSO production.

## Thứ tự đọc khuyến nghị
1. Đọc `01-local-setup.md` để chuẩn bị môi trường local.
2. Đọc `02-pgadmin4-postgresql-setup.md` để biết cách cấu hình PostgreSQL và pgAdmin4.
3. Đọc `03-mongodb-compass-cluster-setup.md` để cấu hình MongoDB audit.
4. Đọc `04-env-and-connection-strings.md` để tạo file `.env` đúng chuẩn.
5. Đọc `05-oidc-client-registration.md` để đăng ký client OAuth2/OIDC.
6. Đọc `06-project-db-onboarding.md` để thêm dự án mới vào SSO.
7. Đọc các guide production từ `07` đến `12` trước khi go-live.

## Vai trò
- Developer: đọc guide local, env, OIDC client, coding rules.
- DevOps: đọc guide HA, Kubernetes/Helm, monitoring, CI/CD, security.
- Admin hệ thống: đọc guide pgAdmin4, MongoDB, onboarding project, incident response.

## Nguyên tắc chung
- Không commit secret thật.
- Không dùng `latest` cho production image.
- Không deploy production thủ công ngoài CI/CD pipeline.
- Mọi project mới phải có OIDC client và connection config rõ ràng.
```

#### guide/01-local-setup.md

Mục tiêu: hướng dẫn người mới chuẩn bị môi trường local để chạy SSO.

Nội dung mẫu cần có:

```md
# Local setup

## Điều kiện chuẩn bị
- Cài Node.js LTS.
- Cài Docker Desktop.
- Cài Docker Compose.
- Cài pgAdmin4.
- Cài MongoDB Compass.
- Có quyền truy cập repository.

## Các bước
1. Clone repository về máy.
2. Cài dependency bằng `npm install`.
3. Copy `.env.example` thành `.env`.
4. Điền connection string local cho PostgreSQL và MongoDB.
5. Chạy PostgreSQL/MongoDB local bằng Docker Compose nếu chưa có DB ngoài.
6. Chạy migration SSO Login DB.
7. Chạy seed admin user và clients mẫu.
8. Start app bằng `npm run start:dev`.
9. Mở OIDC discovery endpoint để kiểm tra.

## Kiểm tra
- App start không lỗi.
- Health endpoint trả trạng thái OK.
- OIDC discovery endpoint trả JSON metadata.
- MongoDB audit ghi được log test.

## Lỗi thường gặp
- Sai port DB: kiểm tra lại `.env`.
- Docker chưa chạy: mở Docker Desktop.
- Migration lỗi quyền: kiểm tra DB user trong pgAdmin4.
```

#### guide/02-pgadmin4-postgresql-setup.md

Mục tiêu: hướng dẫn cấu hình PostgreSQL bằng pgAdmin4, tạo DB SSO và lấy connection string.

Nội dung mẫu cần có:

```md
# pgAdmin4 PostgreSQL setup

## Điều kiện chuẩn bị
- Đã cài pgAdmin4.
- Có host, port, username, password PostgreSQL.
- Biết DB nào là SSO Login DB và DB nào là project DB.

## Tạo server connection trong pgAdmin4
1. Mở pgAdmin4.
2. Chọn Register Server.
3. Tab General: nhập tên server, ví dụ `SSO Local` hoặc `SSO Production HA`.
4. Tab Connection: nhập host PgBouncer/HAProxy endpoint nếu production.
5. Nhập port, username, password.
6. Save.

## Tạo database local/dev
1. Chuột phải Databases.
2. Chọn Create Database.
3. Nhập `sso_login`.
4. Owner là app user hoặc admin user tùy môi trường.
5. Save.

## Tạo app user tối thiểu quyền
1. Tạo role `sso_app_user`.
2. Không dùng superuser cho app.
3. Gán quyền connect database.
4. Gán quyền usage schema public.
5. Gán quyền select, insert, update, delete trên bảng cần thiết.

## Kiểm tra query
Chạy query:
`SELECT version();`

## Tạo connection string
Format:
`postgresql://username:password@host:port/database`

## Checklist
- Kết nối được DB SSO.
- Kết nối được DB project.
- App user không phải superuser.
- Connection string đã đưa vào `.env`, không commit lên Git.
```

#### guide/03-mongodb-compass-cluster-setup.md

Mục tiêu: hướng dẫn cấu hình MongoDB audit bằng MongoDB Compass.

Nội dung mẫu cần có:

```md
# MongoDB Compass cluster setup

## Điều kiện chuẩn bị
- Đã cài MongoDB Compass.
- Có MongoDB connection string.
- Có username/password nếu bật auth.
- Có thông tin replica set nếu production.

## Kết nối MongoDB Compass
1. Mở MongoDB Compass.
2. Paste MongoDB connection string.
3. Nếu production, bật TLS theo yêu cầu hạ tầng.
4. Connect.

## Tạo database audit
1. Chọn Create Database.
2. Database name: `sso_audit`.
3. Collection name: `audit_logs`.
4. Create.

## Tạo index khuyến nghị
- `createdAt` để query theo thời gian.
- `eventType` để lọc loại sự kiện.
- `userId` để truy vết user.
- `clientApp` để lọc theo project client.
- `requestId` để debug theo request.

## Insert event test
Tạo document test gồm `eventType`, `status`, `createdAt`, `metadata`.

## Checklist
- Compass connect thành công.
- Có database `sso_audit`.
- Có collection `audit_logs`.
- Có indexes cần thiết.
- SSO API ghi được login failed/login success event.
```

#### guide/04-env-and-connection-strings.md

Mục tiêu: hướng dẫn điền `.env` và quản lý connection string an toàn.

Nội dung mẫu cần có:

```md
# Env and connection strings

## Nguyên tắc
- Không commit `.env` thật.
- Chỉ commit `.env.example`.
- Production secret lấy từ Kubernetes Secret hoặc secret manager.
- SSO production DB phải trỏ tới PgBouncer/HAProxy endpoint.

## PostgreSQL URL format
`postgresql://username:password@host:port/database`

## MongoDB URL format
`mongodb://user:password@host1:27017,host2:27017/sso_audit?replicaSet=rs0`

## Biến môi trường chính
- `SSO_LOGIN_PRIMARY_URL`
- `SSO_LOGIN_BACKUP_URL`
- `PROJECT_A_DATABASE_URL`
- `PROJECT_B_DATABASE_URL`
- `MONGODB_AUDIT_URL`
- `OIDC_ISSUER`
- `OIDC_PRIVATE_JWK_PATH`

## Checklist
- Tất cả URL test connection thành công.
- Không có secret trong Git.
- Production dùng secret store.
- Dev/staging/prod có issuer và callback riêng.
```

#### guide/05-oidc-client-registration.md

Mục tiêu: hướng dẫn đăng ký project client theo OAuth2/OIDC.

Nội dung mẫu cần có:

```md
# OIDC client registration

## Thông tin cần chuẩn bị
- App code.
- App name.
- Redirect URI dev/staging/prod.
- Post logout redirect URI.
- Loại client: public hoặc confidential.
- Scopes cần dùng.

## Các bước
1. Tạo client trong SSO admin API hoặc seed/migration.
2. Khai báo `client_id` duy nhất.
3. Khai báo redirect URI exact match.
4. Bật Authorization Code Flow.
5. Bật PKCE cho public client.
6. Tạo client secret cho confidential client.
7. Lưu secret an toàn, chỉ hiển thị một lần.
8. Test authorize URL.
9. Test callback nhận code.
10. Test token exchange.
11. Test userinfo và JWKS.

## Checklist
- Redirect URI không dùng wildcard.
- Scope tối thiểu.
- Client secret không lưu plaintext.
- Token exchange thành công.
```

#### guide/06-project-db-onboarding.md

Mục tiêu: hướng dẫn thêm dự án mới vào SSO và kết nối DB project.

Nội dung mẫu cần có:

```md
# Project DB onboarding

## Thông tin cần chuẩn bị
- App code.
- Project name.
- PostgreSQL connection string.
- User table name.
- User id column.
- Email column.
- Role/status column nếu có.

## Các bước
1. Đăng ký OIDC client cho project.
2. Khai báo project DB trong `db-connections.example.json` hoặc admin API.
3. Thêm biến môi trường connection string cho project.
4. Test connection string bằng admin endpoint hoặc script.
5. Mapping SSO user với external user id.
6. Test login qua SSO.
7. Test userinfo trả đúng claims.
8. Kiểm tra audit log theo `clientApp`.

## Checklist
- Project client redirect được sang SSO.
- SSO kết nối được DB project.
- Mapping user đúng.
- Audit log có event theo project.
```

#### guide/07-patroni-etcd-haproxy-pgbouncer.md

Mục tiêu: hướng dẫn thiết lập PostgreSQL HA production.

Nội dung mẫu cần có:

```md
# Patroni etcd HAProxy PgBouncer

## Kiến trúc
SSO API -> PgBouncer -> HAProxy -> PostgreSQL nodes do Patroni quản lý -> etcd cluster.

## Các bước tổng quát
1. Chuẩn bị 3 PostgreSQL nodes.
2. Chuẩn bị 3 etcd nodes.
3. Cấu hình Patroni trên từng PostgreSQL node.
4. Cấu hình streaming replication.
5. Cấu hình HAProxy route primary/write endpoint.
6. Cấu hình PgBouncer làm connection pooling endpoint.
7. Cấu hình SSO dùng connection string tới PgBouncer.
8. Test failover bằng cách dừng primary.
9. Xác nhận Patroni promote standby.
10. Xác nhận HAProxy/PgBouncer route lại đúng.

## Checklist
- Patroni cluster có leader.
- etcd quorum ổn định.
- HAProxy trả đúng primary.
- PgBouncer nhận connection từ SSO.
- Failover test thành công.
```

#### guide/08-kubernetes-helm-deployment.md

Mục tiêu: hướng dẫn deploy SSO lên Kubernetes bằng Helm.

Nội dung mẫu cần có:

```md
# Kubernetes Helm deployment

## Điều kiện chuẩn bị
- Có kubeconfig đúng cluster.
- Có namespace dev/staging/prod.
- Có Docker image tag cố định.
- Có Kubernetes Secret cho env production.

## Deploy staging
1. Chọn image tag cần deploy.
2. Chạy Helm lint.
3. Render template để kiểm tra manifest.
4. Deploy bằng Helm upgrade install.
5. Chạy migration job.
6. Kiểm tra rollout status.
7. Kiểm tra health endpoints.
8. Chạy smoke test OIDC.

## Deploy production
1. Chỉ deploy sau manual approval.
2. Không dùng image tag `latest`.
3. Deploy bằng Helm với values production.
4. Theo dõi readiness/liveness.
5. Theo dõi Grafana và Alertmanager.

## Rollback
1. Xem Helm history.
2. Chọn revision ổn định trước đó.
3. Chạy Helm rollback.
4. Kiểm tra health và smoke test.
```

#### guide/09-monitoring-prometheus-grafana-alertmanager.md

Mục tiêu: hướng dẫn bật monitoring và alerting production.

Nội dung mẫu cần có:

```md
# Monitoring Prometheus Grafana Alertmanager

## Metrics cần có
- SSO API uptime.
- HTTP latency.
- OIDC authorize/token/userinfo error rate.
- Login success/failed rate.
- PostgreSQL health.
- Patroni failover event.
- PgBouncer connection saturation.
- MongoDB audit write error.

## Các bước
1. Bật endpoint `/metrics` trong NestJS.
2. Cấu hình Prometheus scrape SSO API.
3. Cấu hình postgres exporter.
4. Cấu hình MongoDB exporter.
5. Cấu hình HAProxy và PgBouncer exporter.
6. Import Grafana dashboards.
7. Cấu hình Alertmanager receiver.
8. Gửi test alert.

## Alert tối thiểu
- SSO API down.
- Token endpoint error rate cao.
- Login failed spike.
- PostgreSQL replication lag.
- Patroni failover.
- Mongo audit write failure.
```

#### guide/10-cicd-release-rollback.md

Mục tiêu: hướng dẫn branch, release, CI/CD và rollback.

Nội dung mẫu cần có:

```md
# CI/CD release rollback

## Branch policy
- `main`: production-ready.
- `develop`: staging integration.
- `feature/*`: tính năng mới.
- `fix/*`: sửa lỗi thường.
- `hotfix/*`: sửa lỗi production.
- `release/*`: chuẩn bị release.

## Pipeline
1. Lint.
2. Typecheck.
3. Unit test.
4. E2E smoke test.
5. Dependency scan.
6. Secret scan.
7. Docker build.
8. Docker image scan.
9. Helm lint/template.
10. Deploy staging.
11. Manual approval production.
12. Deploy production.
13. Post deploy verify.

## Versioning
- Dùng SemVer.
- Docker image tag theo SemVer và Git SHA.
- Không dùng `latest` cho production.

## Rollback
- App lỗi: Helm rollback.
- Config lỗi: revert values và redeploy.
- Migration lỗi: ưu tiên forward-fix nếu schema phức tạp.
```

#### guide/11-security-production-checklist.md

Mục tiêu: checklist bảo mật trước production go-live.

Nội dung mẫu cần có:

```md
# Security production checklist

## OAuth2/OIDC
- Authorization Code Flow với PKCE.
- Redirect URI exact match.
- Refresh token rotation.
- JWKS không expose private key.
- Introspection endpoint có client authentication.

## Session/UI
- HTTPS bắt buộc.
- Cookie HttpOnly Secure SameSite.
- CSRF protection cho form.
- Rate limit login/token/admin API.
- Không tiết lộ user tồn tại hay không.

## Secrets
- Không commit `.env` thật.
- Kubernetes Secret hoặc secret manager.
- Rotate DB password, client secret, signing key.

## DB/Data
- App DB user quyền tối thiểu.
- Backup mã hóa.
- Audit append-only.
- MongoDB auth/TLS bật.

## Kubernetes
- Non-root container.
- Resource limit.
- NetworkPolicy.
- RBAC tối thiểu.

## Go-live gate
- Security scan pass.
- Failover test pass.
- Helm rollback test pass.
- Backup restore test pass.
```

#### guide/12-incident-response-runbook.md

Mục tiêu: hướng dẫn xử lý sự cố production.

Nội dung mẫu cần có:

```md
# Incident response runbook

## Sự cố login lỗi hàng loạt
1. Kiểm tra Grafana login failed rate.
2. Kiểm tra token endpoint error.
3. Kiểm tra DB connection health.
4. Kiểm tra recent deployment.
5. Nếu do release mới, rollback Helm.
6. Ghi incident report.

## Sự cố DB failover
1. Kiểm tra Patroni leader.
2. Kiểm tra etcd quorum.
3. Kiểm tra HAProxy backend.
4. Kiểm tra PgBouncer connection.
5. Xác nhận SSO ready.
6. Kiểm tra audit log failover event.

## Sự cố Mongo audit lỗi
1. Kiểm tra MongoDB cluster health.
2. Kiểm tra credential/TLS.
3. Kiểm tra collection/index.
4. Kiểm tra queue/retry trong SSO nếu có.
5. Khôi phục audit writer.

## Sự cố OIDC signing key
1. Dừng rotate key nếu đang chạy.
2. Restore key từ secret backup.
3. Kiểm tra JWKS endpoint.
4. Test token verify ở project client.
5. Ghi nhận incident.
```

#### guide/rules.md

Mục tiêu: quy tắc bắt buộc của dự án.

Nội dung mẫu cần có:

```md
# Project rules

## Coding rules
- Dùng NestJS module rõ ràng.
- Không hardcode config hoặc secret.
- DTO phải validate input.
- Service không truy cập env trực tiếp, dùng config service.

## Security rules
- Không log token, password, authorization code, client secret.
- Mọi admin action phải audit.
- Mọi endpoint nhạy cảm phải có rate limit.

## Database rules
- Migration phải backward compatible.
- Không dùng superuser cho app.
- Project DB phải khai báo qua config/admin API.

## Deployment rules
- Production chỉ deploy qua CI/CD.
- Không dùng Docker tag `latest`.
- Rollback phải theo Helm revision.
```

#### guide/instructions.md

Mục tiêu: instruction thao tác chuẩn cho các vai trò trong dự án.

Nội dung mẫu cần có:

```md
# Project instructions

## Developer
1. Tạo branch từ `develop`.
2. Chạy local setup.
3. Viết test cho module thay đổi.
4. Không commit secret.
5. Tạo PR và chờ CI pass.

## DevOps
1. Quản lý secret theo môi trường.
2. Deploy staging bằng Helm.
3. Theo dõi monitoring sau deploy.
4. Chỉ deploy production sau manual approval.
5. Chuẩn bị rollback plan.

## Admin
1. Thêm project client theo OIDC guide.
2. Thêm project DB theo onboarding guide.
3. Kiểm tra audit log sau thay đổi.
4. Không sửa trực tiếp production DB nếu không có ticket/approval.
```

## 17. Quyết định kiến trúc cần chốt trước khi code

- Chốt NestJS thay vì Express cho Backend production.
- Chốt OAuth2/OIDC ngay từ đầu, ưu tiên Authorization Code Flow với PKCE.
- Chốt `oidc-provider` làm thư viện OAuth2/OIDC chính cho production.
- DB các dự án có dùng chung user hay mỗi DB có user riêng.
- Password hiện tại nằm ở DB từng dự án hay sẽ chuyển về SSO Login DB.
- Chốt production HA bằng PostgreSQL streaming replication với Patroni + etcd + HAProxy + PgBouncer ngay từ đầu; backup 5 phút là snapshot/job bổ sung, không phải HA chính.
- Chốt cần UI login riêng cho SSO ngay từ giai đoạn đầu; đây là hướng chuẩn cho OAuth2/OIDC production.
- Chốt Kubernetes/Helm là hướng production deployment chính; Docker Compose chỉ dùng cho local development.
- Chốt Prometheus/Grafana/Alertmanager là hướng monitoring và alerting chính cho production.
- Chốt CI/CD pipeline là bắt buộc trước khi triển khai staging/production: lint, typecheck, test, security scan, build Docker image, Helm lint/template, deploy staging, manual approval production, deploy production và rollback.
- Chốt branch strategy gồm `main`, `develop`, `feature/*`, `fix/*`, `hotfix/*`, `release/*`; cấm push trực tiếp `main` và `develop`.
- Chốt release versioning dùng Semantic Versioning, Docker image tag cố định theo SemVer và Git SHA, không dùng `latest` cho production.
- Chốt rollback policy ưu tiên `helm rollback` cho app, migration phải backward compatible, DB rollback chỉ dùng khi đã kiểm thử và ưu tiên forward-fix cho lỗi schema phức tạp.
- Chốt security checklist production là bắt buộc trước go-live, bao gồm OAuth2/OIDC, UI login/session, secrets, DB/data, Kubernetes/network/runtime, monitoring/logging, CI/CD supply-chain và go-live security gate.
- Chốt bổ sung thư mục `guide` để chứa hướng dẫn thao tác thủ công từng bước cho pgAdmin4, MongoDB Compass, connection strings, OIDC client registration, onboarding project DB, HA PostgreSQL, Kubernetes/Helm, monitoring, CI/CD, security và incident response.
