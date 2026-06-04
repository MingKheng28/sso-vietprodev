# Demo SSO VietProDev — Hướng dẫn trình bày và giải thích

> File này dùng để demo thuyết trình. Nội dung viết theo văn nói, có script từng bước và giải thích tư duy để người nghe dễ hiểu. Có thể copy-paste trực tiếp vào slide hoặc dùng làm nháp thuyết trình.

---

## Phần 1: Bối cảnh — Tại sao cần SSO?

### 1.1. Vấn đề trước khi có SSO

Hãy tưởng tượng công ty VietProDev có **20 dự án web**: trang tin tức, hệ thống ERP, cổng thông tin nội bộ, ứng dụng di động, v.v.

Mỗi dự án tự quản lý đăng nhập riêng:

- Dự án A có tài khoản `minh.khang@vietprodev.com`, mật khẩu `Abc123!`
- Dự án B có tài khoản `minh.khang@vietprodev.com`, mật khẩu `Xyz789#` — **khác mật khẩu!**
- Dự án C chưa có tài khoản này
- Nhân viên mới vào, phải tạo tài khoản ở **20 chỗ khác nhau**

**Các vấn đề cụ thể:**

| Vấn đề | Chi tiết |
|---------|---------|
| Quên password | Mỗi project reset password riêng, admin A không biết user đã reset ở project B chưa |
| Bảo mật không đồng nhất | Project A dùng mã hóa mạnh, Project B lưu password plain text |
| Phân quyền rời rạc | User là admin ở Project A nhưng là guest ở Project B — không có tầng nhìn tổng |
| Audit riêng lẻ | Login A ghi log ở A, login B ghi log ở B — không có bức tranh toàn cảnh |
| Khi nhân viên nghỉ | Phải disable account ở **20 chỗ**, thiếu 1 chỗ là lỗ hổng |

### 1.2. Giải pháp: SSO — Single Sign-On

**SSO giống như VNEID vậy.** Khi bạn đăng nhập VNEID một lần, bạn có thể dùng để khai báo thuế, đăng ký kinh doanh, bảo hiểm xã hội — tất cả các cổng thông tin điện tử của nhà nước — mà **không cần đăng nhập lại** ở từng nơi.

Hoặc giống như **Google Account**: bạn đăng nhập Gmail một lần, sau đó YouTube, Google Drive, Google Calendar đều tự nhận ra bạn — không cần nhập lại mật khẩu.

**Trong hệ sinh thái VietProDev**, SSO hoạt động theo cùng nguyên lý:

- User đăng nhập một lần tại **SSO server** (`http://localhost:3000`)
- 20 dự án A, B, C... đều **tin tưởng** SSO server đó
- Khi dự án cần xác thực, nó **hỏi SSO** thay vì tự hỏi user nhập password
- Mỗi dự án vẫn giữ **database riêng** để lưu dữ liệu nghiệp vụ của mình

---

## Phần 2: Kiến trúc hệ thống

### 2.1. Các thành phần đang có trong hệ thống

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER / NGƯỜI DÙNG                       │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Demo Prj A  │ │  Demo Prj B  │ │   Project C   │ │  Project N   │
│  :3001/docs  │ │  :3002/docs  │ │  (tương lai) │ │  (tương lai) │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                 │                 │                 │
       └────────┬────────┴────────┬───────┘                 │
                │                 │                         │
                ▼                 ▼                         │
┌─────────────────────────────────────────────────────────────┐
│                    SSO SERVER (:3000)                        │
│                                                             │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │ OIDC Provider│  │ Login UI     │  │ Admin API        │  │
│   │ (chuẩn OAuth2│  │ (trang đăng  │  │ (quản lý client,│  │
│   │ /OIDC)       │  │  nhập)       │  │  kết nối DB)    │  │
│   └─────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  PostgreSQL — SSO Database (vietprodev_sso)          │  │
│   │  • users         (tài khoản tập trung)               │  │
│   │  • clients       (20 dự án đã đăng ký)              │  │
│   │  • sessions      (phiên đăng nhập SSO)               │  │
│   │  • refresh_tokens                                │  │
│   │  • user_app_mappings (ánh xạ user → dự án)           │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  MongoDB — Audit Log (sso_audit)                     │  │
│   │  • ai đăng nhập lúc nào, từ IP nào                │  │
│   │  • ai đăng xuất, ai thất bại                       │  │
│   │  • DB failover event                                 │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  PostgreSQL HA (2 server)                            │  │
│   │  Primary ←──5 phút──→ Backup (đồng bộ)             │  │
│   │  Health check mỗi 30s. Failover tự động              │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. Công nghệ sử dụng

| Lớp | Công nghệ | Vai trò |
|-----|-----------|---------|
| **Runtime** | Node.js | Chạy tất cả server |
| **SSO Framework** | NestJS + TypeScript | Kiến trúc module, dependency injection, guard, pipe |
| **Authorization Server** | `oidc-provider` | Thư viện chuẩn OAuth2/OIDC, không tự viết từ đầu |
| **Password Hashing** | `argon2` | Mã hóa mật khẩu, chống rainbow table, timing-safe |
| **SSO Database** | PostgreSQL 16 | Users, clients, sessions, tokens, mappings |
| **Audit Log** | MongoDB | Ghi log đăng nhập, logout, lỗi, failover |
| **HA Infrastructure** | Patroni + etcd + PgBouncer | Failover tự động, connection pooling, load balancing |
| **Metrics** | Prometheus | Monitor tất cả thành phần |
| **Demo Project** | Express.js + TypeScript + Sequelize | Demo Project A/B mô phỏng project thật |
| **Container** | Docker + Docker Compose | Đóng gói, chạy local |
| **CI/CD** | GitHub Actions | Tự động build, test, deploy |

### 2.3. Quan trọng: 20 dự án kết nối SSO như thế nào?

**Câu hỏi thường gặp:** "Dự án A, B nằm trong cùng thư mục lớn thì dễ. Nhưng Project C nằm ở server hoàntoàn khác, repo khác, thì kết nối SSO kiểu gì?"

**Trả lời:** SSO hoạt động **không phụ thuộc vào vị trí** của dự án. Kết nối chỉ cần 3 thứ:

**Bước 1 — Đăng ký dự án mới vào SSO (Admin API):**

Mỗi dự án muốn dùng SSO phải **đăng ký** với SSO server. Đăng ký bằng cách gọi Admin API hoặc thêm vào DB `clients`:

```sql
-- Dự án mới muốn kết nối SSO, đăng ký như sau:
INSERT INTO clients (id, app_code, name, client_id, redirect_uris)
VALUES (
  gen_random_uuid(),
  'PROJECT_C',
  'Cổng thông tin nội bộ',
  'project-c-api',
  ARRAY['https://project-c.vietprodev.com/auth/sso/callback']
);
```

**Bước 2 — Dự án mới cấu hình 4 biến môi trường:**

```env
SSO_ISSUER=https://sso.vietprodev.com
SSO_CLIENT_ID=project-c-api
SSO_REDIRECT_URI=https://project-c.vietprodev.com/auth/sso/callback
# Client secret (nếu confidential client)
SSO_CLIENT_SECRET=...
```

**Bước 3 — Dự án mới thêm endpoint callback:**

Mỗi dự án chỉ cần thêm **một endpoint duy nhất** — `GET /auth/sso/callback` — để nhận authorization code từ SSO và đổi lấy token:

```
GET /auth/sso/callback?code=xyz&state=abc
```

**Tóm lại:** Kết nối dự án mới với SSO không cần:
- Sửa database chung
- Sửa SSO server
- Chia sẻ secret với dự án khác

Chỉ cần đăng ký phía SSO + cấu hình phía dự án. Đây là kiến trúc **loose coupling** — mỗi dự án độc lập, không ảnh hưởng nhau.

---

## Phần 3: Luồng đăng nhập SSO — Từ góc nhìn người dùng

### 3.1. So sánh: đăng nhập thông thường vs SSO

**Trước đây (không có SSO):**

```
User → Mở Project A → Nhập email + password → Project A kiểm tra → OK
User → Mở Project B → Nhập email + password (lại!) → Project B kiểm tra → OK
User → Mở Project C → Nhập email + password (lại!) → Project C kiểm tra → OK
→ User phải nhớ 20 mật khẩu khác nhau
```

**Bây giờ (có SSO):**

```
User → Mở Project A → Redirect sang SSO → Nhập email + password → OK
User → Mở Project B → Redirect sang SSO → (đã đăng nhập) → OK, không hỏi lại
User → Mở Project C → Redirect sang SSO → (đã đăng nhập) → OK, không hỏi lại
→ User chỉ cần nhớ 1 mật khẩu duy nhất
```

### 3.2. Luồng chi tiết: Authorization Code Flow với PKCE

Đây là chuẩn OIDC mà hệ thống dùng. Giải thích bằng ngôn ngữ đời thường:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BƯỚC 1: Bắt đầu                              │
│                                                                     │
│  1.  User mở trình duyệt, gõ: http://localhost:3001                │
│  2.  Demo A thấy chưa có session → Redirect sang SSO:                │
│      http://localhost:3000/oauth/authorize?                          │
│        client_id=demo-project-a-api&                                 │
│        redirect_uri=http://localhost:3001/auth/sso/callback&          │
│        response_type=code&                                           │
│        scope=openid profile email offline_access&                     │
│        state=abc123&                                                 │
│        code_challenge=EwdDkp...&code_challenge_method=S256          │
│                                                                     │
│  3.  Trình duyệt đang ở trang SSO                                   │
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BƯỚC 2: Đăng nhập SSO                         │
│                                                                     │
│  4.  SSO hiển thị trang login                                       │
│  5.  User nhập email + password                                     │
│  6.  SSO kiểm tra password bằng argon2                             │
│  7.  SSO ghi audit log vào MongoDB: "user login thành công lúc..."  │
│  8.  SSO tạo session, sinh authorization code (1 lần dùng, 5 phút) │
│  9.  SSO redirect trình duyệt về Demo A:                            │
│      http://localhost:3001/auth/sso/callback?                        │
│        code=RkqWnL...&state=abc123                                  │
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BƯỚC 3: Demo A đổi code lấy token               │
│                                                                     │
│  10. Demo A nhận code + state                                       │
│  11. Demo A gửi POST http://localhost:3000/oauth/token               │
│      (kèm code + code_verifier để prove là đúng client)             │
│  12. SSO kiểm tra code đúng, chưa dùng, chưa hết hạn               │
│  13. SSO trả về:                                                    │
│      • access_token  (JWT, 15 phút)                                  │
│      • refresh_token (JWT, 30 ngày)                                  │
│      • id_token     (JWT, chứa thông tin user)                      │
│  14. Demo A decode id_token, lấy email → tìm hoặc tạo user nội bộ │
│  15. Demo A tạo session riêng trong DB demo_project_a               │
│  16. Demo A set cookies HttpOnly: access_token + refresh_token       │
│  17. Demo A trả về trình duyệt: "Đăng nhập thành công"             │
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BƯỚC 4: Mở Project B (không cần đăng nhập lại)   │
│                                                                     │
│  18. User mở tab mới, gõ: http://localhost:3002                    │
│  19. Demo B redirect sang SSO (hoàn toàn tự động)                   │
│  20. SSO thấy đã có session → KHÔNG hỏi lại password               │
│  21. SSO redirect về Demo B: /auth/sso/callback?code=...&state=...  │
│  22. Demo B đổi code lấy token (giống bước 11-16)                  │
│  23. Demo B tạo session RIÊNG trong DB demo_project_b                │
│      → Demo A và Demo B có session riêng, không liên quan nhau        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phần 4: Yêu cầu ban đầu và mức độ hoàn thành

### 4.1. Từng yêu cầu ban đầu — đã làm gì?

| Yêu cầu ban đầu | Trạng thái | Chi tiết |
|----------------|------------|---------|
| **SSO là trung tâm xác thực cho nhiều dự án** | ✅ Hoàn thành | Demo A + Demo B kết nối SSO. Kiến trúc hỗ trợ 20+ dự án qua client registration |
| **DB dự án đã tồn tại trên PostgreSQL, quản lý qua pgAdmin4** | ✅ Hoàn thành | Demo A/B dùng PostgreSQL riêng. Mỗi dự án mới chỉ cần thêm connection string |
| **SSO kết nối DB bằng connection string** | ✅ Hoàn thành | Biến môi trường `DATABASE_URL` cho từng project. Admin API test kết nối |
| **SSO có Login DB chính trên PostgreSQL** | ✅ Hoàn thành | Bảng `users`, `sessions`, `refresh_tokens` trong `vietprodev_sso` |
| **SSO có DB backup, switch khi DB chính lỗi** | ✅ Hoàn thành | Health check mỗi 30s, tự động failover, ghi sự kiện vào `failover_events` |
| **Backup hoặc đồng bộ định kỳ mỗi 5 phút** | ✅ Hoàn thành | Scheduler cron 5 phút kiểm tra đồng bộ 2 DB |
| **MongoDB cluster lưu audit log NoSQL** | ✅ Hoàn thành | Login, logout, register, failover, lỗi DB đều ghi vào `sso_audit` |
| **Backend dùng Node.js (NestJS)** | ✅ Hoàn thành | NestJS production-ready, module tách biệt |
| **OIDC Authorization Server** | ✅ Hoàn thành | `oidc-provider` chuẩn RFC 8414, RFC 6749 |

### 4.2. Kiến trúc High Availability (HA)

```
                    ┌─────────────────────────┐
                    │       NGƯỜI DÙNG         │
                    └───────────┬─────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │      HAProxy / Load Balancer     │
              │    (phân phối request đều)       │
              └──────────┬──────────────┬────────┘
                         │              │
              ┌──────────▼──┐    ┌──────▼──────────┐
              │ SSO Node 1   │    │ SSO Node 2      │
              │ (Primary)   │    │ (Replica)      │
              └──────┬──────┘    └──────┬──────────┘
                     │                  │
              ┌──────▼──────────────────▼──────────┐
              │        Patroni Cluster               │
              │  (quản lý failover tự động)       │
              └──────────┬──────────────┬──────────┘
                         │              │
              ┌──────────▼──┐    ┌──────▼──────────┐
              │ PostgreSQL   │    │ PostgreSQL      │
              │ Primary      │◄──►│ Replica         │
              │ (RW)         │ 5m │ (RO, sync)     │
              └──────────────┘    └─────────────────┘
                         │              │
              ┌──────────▼──────────────▼──────────┐
              │          PgBouncer Pool             │
              │  (connection pooling, bảo vệ DB)  │
              └───────────────────────────────────┘

Khi Primary chết:
  1. Patroni phát hiện Primary không response (health check)
  2. Bầu chọn Primary mới từ Replica
  3. Replica promoted thành Primary (tự động, < 30s)
  4. PgBouncer tự detect endpoint mới
  5. SSO tiếp tục hoạt động, user không thấy gián đoạn
  6. Sự kiện failover ghi vào bảng failover_events
```

### 4.3. Database riêng biệt — không ảnh hưởng lẫn nhau

**Câu hỏi quan trọng:** "Nếu 20 dự án cùng dùng SSO, thì database của từng dự án có bị ảnh hưởng không?"

**Không.** Đây là nguyên tắc cốt lõi:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SSO Server (1 server)                       │
│  Database: vietprodev_sso                                       │
│  • Users: admin@sso.local, user1@...                            │
│  • Clients: project-a, project-b, project-c...                  │
│  • Sessions: SSO session tokens                                 │
│  • Audit: login/logout logs                                     │
└─────────────────────────────────────────────────────────────────┘
         │                  │                  │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │Proj A DB│        │Proj B DB│        │Proj C DB│
    │: Project│        │: Project│        │: Project│
    │  thật A │        │  thật B │        │  thật C │
    │Users +  │        │Users +  │        │Users +  │
    │Sessions │        │Sessions │        │Sessions │
    │ riêng A │        │ riêng B │        │ riêng C │
    └─────────┘        └─────────┘        └─────────┘

→ Dự án A có 10 user, Dự án B có 5 user, Dự án C có 20 user
→ Không ai thấy dữ liệu của ai
→ Dự án A chết → Dự án B vẫn chạy bình thường
→ SSO chết → Tất cả dự án không đăng nhập được, nhưng dữ liệu nghiệp vụ vẫn nguyên
```

---

## Phần 5: Script demo — Từng bước cụ thể

> **Chuẩn bị trước khi demo:** Chạy 3 terminal
> - Terminal 1: `npm run start:dev` (SSO)
> - Terminal 2: `cd demo-projects/demo-project-a-api && npm run start:dev`
> - Terminal 3: `cd demo-projects/demo-project-b-api && npm run start:dev`

### Bước 1: Kiểm tra hệ thống sẵn sàng

**Speak:** "Trước tiên, tôi sẽ kiểm tra cả 3 service đang chạy bình thường."

```
✅ Mở trình duyệt:
  • http://localhost:3000/health/live      → {"status":"ok"}         (SSO sống)
  • http://localhost:3000/health/ready     → dependencies OK          (SSO sẵn sàng)
  • http://localhost:3001/health            → {"status":"ok"}         (Demo A sống)
  • http://localhost:3002/health            → {"status":"ok"}         (Demo B sống)
```

**Speak:** "SSO chạy ở port 3000, Demo A ở 3001, Demo B ở 3002. Tất cả đều healthy."

---

### Bước 2: Mở Swagger UI — Nhìn API từng project

**Speak:** "Thay vì gọi API bằng cURL hay Postman, tôi sẽ dùng Swagger UI — giao diện trực quan để xem tất cả endpoints của từng dự án."

```
✅ Mở 2 tab trình duyệt:
  • Tab 1: http://localhost:3001/docs      → Demo Project A API
  • Tab 2: http://localhost:3002/docs      → Demo Project B API

✅ Trên Swagger, click Authorize (🔓) → nhưng chưa nhập gì
✅ Click GET /auth/me → Execute
  → Kết quả: 401 Unauthorized
  → Giải thích: "Chưa đăng nhập nên không có quyền truy cập. Token chưa tồn tại."
```

**Speak:** "Swagger cho thấy rõ ràng: muốn gọi `/auth/me`, `/auth/refresh`, `/auth/logout` thì phải có token trước. Token nằm trong HttpOnly cookie — tự động gửi kèm mỗi request."

---

### Bước 3: Demo đăng nhập SSO lần đầu — Project A

**Speak:** "Tôi bắt đầu luồng SSO. User mở Project A, chưa đăng nhập bao giờ."

```
✅ Trên trình duyệt, gõ: http://localhost:3001/auth/sso/start
   → Trình duyệt tự động redirect sang SSO:
     http://localhost:3000/oidc/interaction/xxx/login
   → SSO hiển thị form đăng nhập
```

**Speak:** "Trình duyệt không vào thẳng Project A được vì chưa có session. Project A redirect sang SSO. Đây là điểm khác biệt quan trọng so với đăng nhập truyền thống — project không bao giờ nhận password trực tiếp."

```
✅ Nhập form đăng nhập SSO:
   Email:    admin@sso.local
   Password: ChangeMeAdmin123!

✅ Click Login
```

**Speak:** "SSO kiểm tra password bằng argon2 — thư viện mã hóa mật khẩu chuẩn công nghiệp, chống được rainbow table attack và timing attack."

```
✅ SSO redirect về Demo A:
   http://localhost:3001/auth/sso/callback?code=zhQa-MlV...&state=qHRREW...

✅ Demo A đổi code lấy token, set cookies
✅ Trình duyệt hiển thị:
   {
     "message": "SSO login success",
     "appCode": "DEMO_PROJECT_A",
     "user": {
       "id": "...",
       "email": "sso-user@example.com",
       "username": "sso-user",
       "firstName": "SSO",
       "lastName": "User",
       "status": "active"
     }
   }
```

**Speak:** "Đăng nhập thành công. Lưu ý: không thấy token ở đây vì token nằm trong HttpOnly cookie — không thể đọc bằng JavaScript, bảo mật chống XSS. Trình duyệt tự động gửi cookie này ở mọi request tiếp theo."

---

### Bước 4: Kiểm tra session sau khi đăng nhập

**Speak:** "Giờ tôi kiểm tra session đã được tạo chưa."

```
✅ Gõ: http://localhost:3001/auth/me
   → Trả về user info
   → Không cần nhập token, không cần login lại

✅ Mở DevTools → Application → Cookies → localhost:3001
   → Thấy 2 cookies: access_token + refresh_token
   → access_token: TTL 15 phút
   → refresh_token: TTL 30 ngày
```

**Speak:** "Hai điều quan trọng ở đây:
1. **HttpOnly**: JavaScript không đọc được cookie — XSS attacker không đánh cắp token được
2. **Tự động**: Mỗi lần gọi API, trình duyệt tự gửi cookie, không cần code xử lý gì thêm"

---

### Bước 5: Mở Project B — Không cần đăng nhập lại

**Speak:** "Đây là phần quan trọng nhất của SSO. User đã đăng nhập ở Project A. Giờ mở Project B."

```
✅ Mở tab mới (hoặc trình duyệt mới), gõ: http://localhost:3002/auth/sso/start

✅ Kết quả: redirect sang SSO → redirect về Demo B → ĐĂNG NHẬP THÀNH CÔNG
   → Không hỏi lại email/password!
```

**Speak:** "User chỉ đăng nhập một lần ở SSO. Project B nhận ra SSO session còn hiệu lực nên không hỏi lại. Đây là **Single Sign-On** thực sự."

```
✅ Kiểm tra: http://localhost:3002/auth/me
   → Trả về user info (cùng email, nhưng session RIÊNG với Project A)
```

**Speak:** "User giống nhau nhưng mỗi project có session riêng trong database riêng. Điều này quan trọng vì:
- Dữ liệu nghiệp vụ của A không trùng với B
- User có thể có quyền khác nhau ở A và B
- Logout ở A không logout ở B (SSO logout mới logout hết)"

---

### Bước 6: Token refresh — Giải thích bằng ngôn ngữ đời thường

**Speak:** "Access token chỉ sống 15 phút. Nhưng user đang làm việc, không thể 15 phút lại đăng nhập lại. Giải pháp: refresh token."

```
✅ Trên Swagger Demo A, POST /auth/refresh → Execute
   → Kết quả: 200, trả về user info
   → access_token mới đã được set vào cookie tự động
```

**Speak:** "Refresh token hoạt động như **chìa khóa dự phòng**. Khi access token hết hạn, hệ thống dùng refresh token để lấy access token mới — user không cần làm gì cả."

**Speak:** "Mỗi lần refresh, cả access token và refresh token đều được thay mới (token rotation). Đây là best practice vì nếu refresh token cũ bị đánh cắp, attacker không thể dùng lại vì nó đã bị revoke."

---

### Bước 7: Audit log — Ai đăng nhập, lúc nào, từ đâu

**Speak:** "Tất cả hoạt động đăng nhập đều được ghi lại vào MongoDB. Đây là audit log — không thể sửa hoặc xóa."

```
✅ Admin API: GET http://localhost:3000/admin/users
   → Liệt kê tất cả user đã đăng ký

✅ MongoDB collection: sso_audit.audit_events
   → { eventType: "LOGIN_SUCCESS", userId: "...", ip: "...", timestamp: "..." }
   → { eventType: "LOGIN_FAILED", email: "...", reason: "...", timestamp: "..." }
   → { eventType: "REGISTER_SUCCESS", userId: "...", timestamp: "..." }
   → { eventType: "DB_FAILOVER", fromDb: "primary", toDb: "backup", timestamp: "..." }
```

**Speak:** "Khi nhân viên nghỉ, admin chỉ cần disable account ở SSO — tất cả 20 dự án đều bị khóa ngay lập tức. Không cần disable 20 chỗ riêng lẻ."

---

### Bước 8: Database Health — Kiểm tra HA

**Speak:** "Giờ tôi kiểm tra hệ thống HA. SSO kiểm tra database mỗi 30 giây."

```
✅ Admin API: GET http://localhost:3000/admin/db-health
   → Kết quả:
   {
     "dbHealth": [
       { "name": "sso-postgres-ha-endpoint", "status": "up", "latencyMs": 17 },
       { "name": "mongodb-audit", "status": "up", "latencyMs": 55 },
       { "name": "project-db:DEMO_PROJECT_A", "status": "up", "latencyMs": 89 },
       { "name": "project-db:DEMO_PROJECT_B", "status": "up", "latencyMs": 92 }
     ]
   }
```

**Speak:** "Thấy 4 database đều up:
- **sso-postgres-ha-endpoint**: SSO database, latency 17ms — nhanh
- **mongodb-audit**: MongoDB audit log, latency 55ms
- **DEMO_PROJECT_A**: Database nghiệp vụ Project A, latency 89ms
- **DEMO_PROJECT_B**: Database nghiệp vụ Project B, latency 92ms

Nếu primary database chết, hệ thống tự động chuyển sang backup trong vòng 30 giây và ghi event vào bảng failover_events."

---

## Phần 6: Các câu hỏi thường gặp khi thuyết trình

### Q1: "Nếu SSO server chết thì sao?"

**A:** Tất cả 20 dự án không thể đăng nhập mới, nhưng:
- Dữ liệu nghiệp vụ của từng dự án **vẫn nguyên** — không mất gì
- User đã đăng nhập vẫn hoạt động đến khi session hết hạn (access token 15 phút)
- SSO restart → mọi thứ bình thường trở lại
- Giải pháp production: nhiều SSO node behind load balancer

### Q2: "Password user nằm ở đâu? Ai quản lý?"

**A:** Password nằm **duy nhất** trong SSO database, được mã hóa bằng argon2. Các dự án A, B, C **không bao giờ** lưu password. Đây là lợi ích lớn nhất của SSO: chỉ cần bảo vệ 1 database password thay vì 20.

### Q3: "Dự án mới muốn kết nối SSO thì phải làm gì?"

**A:** Chỉ 3 bước:
1. Đăng ký client trong SSO (`/admin/clients`)
2. Thêm 3-4 biến môi trường vào dự án mới
3. Thêm endpoint callback `/auth/sso/callback` (1 endpoint duy nhất)
→ Không cần sửa database chung, không cần sửa SSO server

### Q4: "Hệ thống hiện tại có 20 dự án, mỗi dự án có user riêng. Làm sao migrate?"

**A:** Có 2 phương án:
1. **Song song**: User mới đăng ký qua SSO, user cũ tiếp tục dùng project cũ → từ từ migrate
2. **Import**: Export user từ từng DB project → import vào SSO → lock password cũ, yêu cầu reset qua SSO

### Q5: "Tại sao không dùng Auth0, Okta, Keycloak có sẵn?"

**A:** Các giải pháp có sẵn đều tốt, nhưng:
- **Chi phí**: Auth0/Okta tính phí theo user, 20 dự án × 1000 user = chi phí lớn
- **Tùy biến**: Hệ thống VietProDev cần tích hợp sâu với DB project hiện có
- **Dữ liệu**: Audit log, HA, DB connection manager cần tuỳ chỉnh theo kiến trúc công ty
- **Control**: Toàn quyền kiểm soát, không phụ thuộc vendor

---

## Phần 7: Lộ trình phát triển tiếp theo

| Giai đoạn | Mục tiêu | Trạng thái |
|-----------|---------|-----------|
| 1 | SSO core hoàn chỉnh (users, clients, OIDC, audit, HA) | ✅ Xong |
| 2 | Demo A + Demo B kết nối SSO | ✅ Xong |
| 3 | Tích hợp Project A thật (VCCI News) | ⏳ Chờ duyệt |
| 4 | Tích hợp Project B thật (SIED) | ⏳ Chờ duyệt |
| 5 | Tích hợp 5-10 dự án tiếp theo | 📋 Lên kế hoạch |
| 6 | MFA (2FA) cho SSO | 📋 Tương lai |
| 7 | SSO cho mobile app | 📋 Tương lai |
