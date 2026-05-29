# Chiến lược tích hợp Project A/B với SSO

Tài liệu này chốt phương án tích hợp Project A/B thật vào SSO trong bối cảnh hiện tại chưa được sửa code Project A/B.

## 1. Hiện trạng Project A/B

| Project | URL | Công nghệ | Auth/session |
|---|---|---|---|
| Project A | `https://vcci-news.vercel.app/` | Express.js + TypeScript + Node.js, Sequelize, `express-automatic-routes` | Custom JWT access/refresh token, HttpOnly cookie, bảng `user_sessions` |
| Project B | `https://sied-dev.meucorp.com/` | Express.js + TypeScript + Node.js, Sequelize, `express-automatic-routes` | Custom JWT access/refresh token, HttpOnly cookie, bảng `user_sessions` |

Route của Project A/B được sinh theo Resource object của `express-automatic-routes`, không nhất thiết khai báo thủ công bằng `app.get(...)`.

## 2. Ràng buộc bắt buộc

Hiện tại không được sửa bất kỳ code nào của Project A/B. Vì vậy full OIDC login vào Project A/B chưa thể hoàn tất end-to-end.

SSO không được tự ý:

- Ghi trực tiếp vào `user_sessions` của Project A/B.
- Tự tạo cookie `access_token` hoặc `refresh_token` cho domain Project A/B.
- Dùng JWT secret của Project A/B nếu chưa được phê duyệt.
- Deploy callback route vào Project A/B.

## 3. Phương án tốt nhất hiện tại

Triển khai theo 2 lớp.

### 3.1. SSO core production-ready

- OIDC Provider bằng `oidc-provider`.
- Login UI tập trung.
- SSO PostgreSQL schema cho users, clients, mappings, sessions, refresh tokens.
- MongoDB audit log.
- Health check, metrics, admin API.
- PostgreSQL HA pattern bằng Patroni + etcd + HAProxy + PgBouncer.

### 3.2. Project A/B integration readiness

- Kết nối DB Project A/B bằng quyền đọc tối thiểu.
- Xác minh schema user/role/permission/session.
- Lập mapping user SSO với user nội bộ từng project.
- Chuẩn bị OIDC client registration cho domain thật.
- Chuẩn bị tài liệu callback cần thêm sau khi được duyệt.
- Không ghi DB hoặc thay đổi session của Project A/B.

## 4. Khi được duyệt sửa Project A/B

Mỗi project cần thêm luồng chuẩn:

1. Redirect user sang SSO `/oauth/authorize`.
2. Callback nhận `code` và `state`.
3. Đổi `code` lấy token tại `/oauth/token`.
4. Verify ID token/JWKS hoặc gọi userinfo.
5. Map user SSO với user nội bộ.
6. Dùng auth service hiện hữu của project để tạo JWT access/refresh token và ghi `user_sessions`.
7. Set HttpOnly cookies theo chuẩn hiện tại của project.

Callback nên được viết theo convention `express-automatic-routes`, tức một controller Resource object có `get.handler` hoặc `post.handler` tùy route.

## 5. Test thủ công hiện tại sẽ thấy gì?

Khi mở Project A thật:

```text
https://vcci-news.vercel.app/
```

hoặc Project B thật:

```text
https://sied-dev.meucorp.com/
```

người dùng sẽ vẫn thấy giao diện/luồng đăng nhập hiện tại của từng project. Không có redirect sang SSO local hoặc SSO production vì Project A/B chưa được sửa code để gọi `/oauth/authorize`.

Kết quả đúng hiện tại:

- Project A/B vẫn hoạt động như trước.
- SSO local chỉ test riêng qua `http://localhost:3000/.well-known/openid-configuration`, health endpoints và authorize URL local.
- Nếu test authorize local thành công, SSO có thể redirect về `http://localhost:3001/auth/callback`; nếu không có server ở port `3001` thì trình duyệt báo lỗi là bình thường.

## 6. Kết luận

Dự án SSO vẫn nên tiếp tục xây production-ready ngay bây giờ. Tuy nhiên trạng thái tích hợp Project A/B hiện tại là readiness/read-only, chưa phải go-live SSO thật. Full SSO chỉ go-live sau khi có phê duyệt thêm callback/session bridge vào từng project.

## 7. Quyết định mới: tạo 2 backend demo trước khi sửa Project thật

Đã chốt hướng tạo 2 backend demo để chứng minh kỹ thuật trước khi xin phê duyệt sửa Project A/B thật.

Demo backend sẽ mô phỏng Project A/B ở các điểm quan trọng:

- Express.js + TypeScript + Node.js.
- Sequelize.
- `express-automatic-routes`.
- DB schema gần giống project thật: `users`, `user_auth`, `user_roles`, `roles`, `permissions`, `user_sessions`.
- Custom JWT access token + refresh token.
- HttpOnly cookies `access_token`, `refresh_token`.
- Middleware `authenticate`.
- Hàm `validateSession`.
- Callback SSO theo Resource object của `express-automatic-routes`.

Mục tiêu của demo:

- Chứng minh SSO không chỉ dành cho Project A/B.
- Chứng minh SSO mở rộng được cho nhiều project qua bảng `clients`.
- Chứng minh mỗi project vẫn giữ auth/session nội bộ riêng.
- Chứng minh SSO chỉ đóng vai trò Identity Provider giống Google.
- Chứng minh project client tự tạo session nội bộ sau khi tin token từ SSO.
- Chứng minh không cần sửa SSO core khi thêm project mới.

Tài liệu chi tiết:

- [`plans/demo-backend-multi-project-sso-plan.md`](../plans/demo-backend-multi-project-sso-plan.md).
- [`guide/13-demo-backend-multi-project-sso.md`](../guide/13-demo-backend-multi-project-sso.md).
