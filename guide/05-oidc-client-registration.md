# OIDC client registration

Tài liệu này hướng dẫn đăng ký một project làm OAuth2/OIDC client của SSO.

## 1. Thông tin bắt buộc

Mỗi client cần có:

| Trường | Ý nghĩa |
|---|---|
| `client_id` | Định danh duy nhất của project, ví dụ `project-a-web` |
| `client_name` | Tên hiển thị |
| `redirect_uris` | Danh sách callback URL exact match |
| `post_logout_redirect_uris` | URL cho logout redirect |
| `scope` | Tối thiểu `openid profile email` |
| `grant_types` | Thường là `authorization_code`, `refresh_token` |
| `response_types` | Thường là `code` |
| `require_pkce` | Bắt buộc với public client |

## 2. Điều kiện để redirect URI dùng được

`redirect_uri` chỉ hợp lệ khi project thật đã có callback handler để nhận `code` và `state` từ SSO.

Nếu project chưa có callback handler, client vẫn có thể được khai báo để chuẩn bị, nhưng chưa được coi là go-live.

## 3. Project A/B hiện tại

Project A và Project B hiện chưa được sửa code theo quy định bảo mật công ty. Vì vậy:

- Chưa dùng domain production làm callback go-live nếu chưa có route callback thật.
- Chưa test end-to-end login vào Project A/B thật.
- Chỉ dùng redirect URI local/demo để kiểm tra SSO login UI nếu cần.
- Chỉ chuẩn bị danh sách callback URI cần xin phê duyệt sau.

## 4. Callback tương lai cho Express automatic routes

Vì Project A/B dùng `express-automatic-routes`, callback nên được thêm theo Resource object của project, ví dụ về mặt ý tưởng:

```ts
export default () => ({
  get: {
    middleware: [],
    handler: async (req, res) => {
      const { code, state } = req.query;
      // validate state
      // exchange code with SSO /oauth/token
      // verify id_token or call /oauth/userinfo
      // create internal JWT session using existing auth service
      // set HttpOnly cookies
      return res.redirect('/');
    },
  },
});
```

Không để SSO ghi thẳng vào `user_sessions` của project. Project phải tự tạo session bằng auth service hiện hữu sau khi đã tin cậy token từ SSO.

## 5. Checklist trước khi go-live client

- Callback route đã được merge/deploy trong project.
- `redirect_uri` trong DB SSO exact match với callback thật.
- `state` và PKCE được kiểm tra đúng.
- Token exchange hoạt động.
- JWKS/userinfo hoạt động.
- Session nội bộ project được tạo bằng service hiện hữu.
- Logout/refresh token không bị phá vỡ.
- Audit log SSO ghi đủ login success/failed.
