# OAuth2/OIDC flow

Authorization Code Flow với PKCE là luồng chính.

## Luồng chuẩn khi client đã hỗ trợ OIDC

1. User truy cập Project A/B.
2. Project redirect user sang SSO `/oauth/authorize` với `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge`.
3. User đăng nhập ở SSO login UI.
4. SSO redirect về callback của project với `code` và `state`.
5. Project gọi `/oauth/token` để đổi code lấy token.
6. Project verify ID token bằng JWKS hoặc gọi `/oauth/userinfo`.
7. Project tạo session nội bộ bằng cơ chế auth hiện hữu.

## Trạng thái với Project A/B thật

Project A/B hiện chưa được phép sửa code. Vì vậy chưa thể thêm callback route, token exchange và session bridge. Bước hiện tại chỉ kiểm tra SSO discovery/login UI local và chuẩn bị tài liệu tích hợp.

Khi được duyệt sửa code, callback trong Project A/B nên theo convention `express-automatic-routes`: controller export Resource object, trong đó `get.handler` hoặc `post.handler` xử lý callback.
