# Onboarding new project

Onboarding một project vào SSO gồm đăng ký OIDC client, khai báo project DB, mapping user và test audit.

## Điều kiện bắt buộc để go-live SSO

Project muốn go-live SSO phải có khả năng:

1. Redirect user sang SSO `/oauth/authorize`.
2. Nhận callback `code` và `state`.
3. Đổi code lấy token ở `/oauth/token`.
4. Verify token/JWKS hoặc gọi userinfo.
5. Tạo session nội bộ an toàn.

Nếu project không được sửa code, chỉ được onboarding ở mức readiness/read-only: khai báo client dự kiến, test DB connection, đọc schema, lập mapping và chuẩn bị tài liệu tích hợp.

## Project A/B hiện tại

Project A/B đang ở trạng thái readiness vì chưa được sửa code. Không ghi session/token/cookie vào Project A/B khi chưa có phê duyệt bảo mật.
