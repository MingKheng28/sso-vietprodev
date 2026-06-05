# Project rules

Các rule này áp dụng cho SSO core và giai đoạn demo backend multi-project SSO.

## 1. Rule chung

- Dùng module/structure rõ ràng, không nhét logic lớn vào một file.
- Không hardcode secret, token, password, connection string thật.
- Không commit `.env`, private key, client secret, JWT secret, DB password.
- Không log password, access token, refresh token, authorization code, client secret.
- DTO/input phải validate rõ ràng.
- Migration phải có thứ tự và tránh phá dữ liệu nếu sau này lên staging/production.
- Production deploy phải qua CI/CD, không deploy thủ công tùy tiện.
- Tất cả commits phải pass ESLint và Prettier (`npm run lint`, `npm run format`).
- ESLint + Prettier bắt buộc cho mọi module TypeScript.
- Error messages không được reveal thông tin nhạy cảm (user existence, internal errors).

## 2. Security Rules

- Bắt buộc rate limiting cho login, token endpoints.
- Bắt buộc account lockout sau N lần login sai (thresholds trong env vars).
- Bắt buộc CSRF protection cho login/logout/consent forms.
- Timing-safe authentication: error message giữa user-not-found và wrong-password phải uniform.
- Password policy: tối thiểu 12 ký tự, khuyến khích dùng Argon2id.
- Demo project callback/error handlers phải sanitize OAuth error responses.
- Demo project stateStore phải có TTL cleanup. Đánh dấu rõ ràng là demo-only.
- Production: dùng Redis/database store cho state management.

## 3. Rule SSO core

- SSO đóng vai trò OAuth2/OIDC Provider, không tự giả lập session nội bộ của project client.
- OIDC client phải lấy từ DB/config, không hardcode cố định trong provider.
- PKCE dùng `S256`, không dùng `plain` cho test hoặc production.
- `redirect_uri` phải exact match với client registration.
- Token/JWKS phải có cơ chế secret/key riêng theo môi trường.
- Audit log phải ghi các event quan trọng: login success/failed, token issue, logout, DB error, account lockout/unlock, registration.
- OIDC endpoints nên dùng OIDC Discovery thay vì hardcoded. Fallback về hardcoded nếu discovery fail.

## 4. Rule demo backend

- Demo backend phải mô phỏng Project A/B thật nhưng không dùng DB thật, secret thật hoặc source thật nếu chưa được phê duyệt.
- Demo backend dùng Express.js + TypeScript + Sequelize.
- Route phải ưu tiên Resource object convention (`bindResource()`) để sát Project A/B thật.
- Mỗi demo project có auth/session nội bộ riêng.
- SSO không ghi trực tiếp vào `user_sessions` của demo project.
- Callback SSO trong demo project phải gọi service nội bộ để tạo access token, refresh token, HttpOnly cookie và session DB.
- Session token lưu trong `user_sessions` phải hash/encrypt, không lưu plaintext.
- Middleware `authenticate` phải verify JWT và gọi `validateSession`.
- Logout phải deactivate session.
- Refresh phải rotate hoặc cập nhật refresh token theo rule đã định.
- Demo project dùng `bindResource()` utility (mô phỏng `express-automatic-routes` convention). Production nên cân nhắc `express-file-routing`.

## 5. Rule áp dụng cho Project A/B thật sau này

- Chỉ sửa Project A/B thật sau khi có phê duyệt.
- Không copy secret Project A/B vào SSO.
- Không để SSO ghi trực tiếp vào DB session Project A/B thật.
- Callback thật phải giữ nguyên nguyên tắc: Project tự tạo session bằng auth service hiện hữu sau khi verify token từ SSO.
- Phải có rollback plan trước khi deploy vào Project A/B thật.

## 6. Database Rules

- Tất cả bảng phải có indexes trên các cột thường xuyên query (email, user_id, client_id, created_at).
- Migration phải idempotent: có thể chạy nhiều lần mà không lỗi (dùng `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- Migration phải backward compatible: không xóa cột đang dùng trong cùng release.
- SSO DB connection phải qua PgBouncer/HAProxy ở production, không trỏ thẳng vào PostgreSQL node.
- Audit write failures phải được retry tự động (không swallow silently).
