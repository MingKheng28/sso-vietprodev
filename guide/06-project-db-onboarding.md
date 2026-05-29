# Project DB onboarding

Tài liệu này hướng dẫn thêm DB của một project vào SSO để kiểm tra kết nối, đọc schema, lập mapping user và chuẩn bị tích hợp OIDC.

## 1. Mục tiêu

Project DB onboarding không đồng nghĩa với go-live SSO. Onboarding DB có thể chỉ là bước read-only để SSO hiểu dữ liệu user/role hiện có.

## 2. Thông tin cần thu thập

| Nhóm | Cần biết |
|---|---|
| Connection | Host, port, database, username, quyền đọc/ghi, SSL |
| User | Bảng user, cột id/email/username/status |
| Password/auth | Bảng chứa password hash hoặc provider auth, nếu được phép xem |
| Role/permission | Bảng role, permission, user-role mapping |
| Session | Bảng session/token, TTL, trạng thái active, refresh flow |
| Security | Có được đọc password hash/session token hay không |

## 3. Project A/B hiện tại

Project A/B có schema liên quan:

- `users`.
- `user_auth`.
- `user_roles`.
- `roles`.
- `permissions`.
- `user_sessions`.

Auth hiện tại dùng JWT access/refresh token, HttpOnly cookie và session lưu trong `user_sessions` dưới dạng mã hóa/hash.

## 4. Quy tắc khi chưa được sửa code Project A/B

Chỉ làm:

- Test connection bằng quyền đọc tối thiểu.
- Đọc schema và sample metadata không nhạy cảm.
- Lập mapping user SSO với user project.
- Ghi chú khác biệt role/permission.
- Chuẩn bị tài liệu callback/session bridge tương lai.

Không làm:

- Không ghi vào `users`, `user_auth`, `user_roles`, `roles`, `permissions`, `user_sessions`.
- Không đọc/xuất password hash hoặc token nếu chưa có phê duyệt.
- Không tự tạo session Project A/B từ SSO.
- Không dùng secret JWT của Project A/B trong SSO khi chưa được duyệt.

## 5. Các bước onboarding an toàn

1. Tạo biến môi trường `PROJECT_A_DATABASE_URL` hoặc `PROJECT_B_DATABASE_URL` bằng user DB chỉ có quyền đọc.
2. Chạy `npm run db:test` để kiểm tra kết nối.
3. Xác minh bảng user/role/session tồn tại.
4. Lập bảng mapping giữa SSO user và project user.
5. Đăng ký OIDC client ở trạng thái chuẩn bị.
6. Viết báo cáo những thay đổi cần xin phê duyệt trong Project A/B.

## 6. Điều kiện chuyển từ readiness sang go-live

- Công ty phê duyệt sửa code Project A/B.
- Callback route được thêm đúng convention `express-automatic-routes`.
- Project dùng auth service hiện hữu để tạo JWT/cookie/session.
- SSO không ghi thẳng session DB của project.
- Staging E2E pass đủ login, refresh, logout, permission và rollback plan.
