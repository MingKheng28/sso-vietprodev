Test SSO Flow qua Swagger - Demo Single Sign-On
Mục tiêu demo
Chứng minh: Đăng nhập 1 lần ở SSO → Dùng được cả Demo A và Demo B mà không cần đăng nhập lại.

Bước 1: Mở Swagger Demo A
Mở trình duyệt (Chrome/Edge), truy cập:

http://localhost:3001/docs
Click nút Authorize (chuỗi icon ổ khóa bên phải thanh tiêu đề Swagger).

Trong popup, click Close (chưa cần authorize vì chưa có token).

Bước 2: Bắt đầu SSO flow từ Demo A
Trong Swagger, mở rộng section Auth - SSO, click vào GET /auth/sso/start.

Click Try it out → Click Execute.

Kỳ vọng:

Response Code: 302
Mở rộng Response Headers, tìm location — đây là URL redirect đến SSO server.
Bước 3: Copy URL và đăng nhập SSO
Copy giá trị location (đầy đủ URL bắt đầu bằng http://localhost:3000/oauth/authorize?...).

Mở tab mới trong cùng trình duyệt, dán URL đó vào thanh address bar, Enter.

Trình duyệt sẽ redirect đến trang login SSO. Điền:

Email:     admin@sso.local
Password:  ChangeMeAdmin123!
Click Sign in (hoặc nút tương ứng).

Bước 4: SSO tự redirect về Demo A
Sau khi đăng nhập thành công, SSO tự động redirect về Demo A với URL dạng:

http://localhost:3001/auth/sso/callback?code=xxx&state=yyy&iss=http%3A%2F%2Flocalhost%3A3000
Trình duyệt sẽ hiển thị JSON:

{
  "message": "SSO login success",
  "appCode": "DEMO_PROJECT_A",
  "user": {
    "id": "...",
    "email": "admin@sso.local",
    "username": "admin",
    ...
  }
}
Đây là bằng chứng: Demo A đã nhận user từ SSO server.

Bước 5: Lấy access_token
Mở DevTools trong trình duyệt (F12) → Tab Application → Cookies → http://localhost:3001

Tìm cookie tên access_token, copy giá trị của nó.

Bước 6: Xác nhận user đã đăng nhập ở Demo A
Quay lại Swagger http://localhost:3001/docs.

Click Authorize (nút ổ khóa) ở đầu trang.

Trong ô Value, nhập:

Bearer <access_token vừa copy>
Click Authorize → Click Close.

Giờ mở rộng Auth - Local, click GET /auth/me → Try it out → Execute.

Kỳ vọng: Response 200 với thông tin user admin@sso.local.

Bước 7: Mở Demo B — KHÔNG cần đăng nhập lại
Mở tab mới trong cùng trình duyệt, truy cập:

http://localhost:3002/docs
Swagger Demo B hiện ra. Click Authorize, nhập cùng access_token từ Demo A:

Bearer <access_token vừa copy>
Click Authorize → Close.

Mở rộng GET /auth/me → Try it out → Execute.

Kỳ vọng: Response 200 với thông tin user cùng admin@sso.local.

Đây là bằng chứng SSO thật sự:

User chưa bao giờ truy cập Demo B
Chưa đăng nhập Demo B
Demo B nhận diện user từ access_token do SSO cấp
Bước 8: Verify user thuộc cùng tài khoản
Compare thông tin user ở Demo A và Demo B:

Trường	Demo A	Demo B
id
Giống nhau
Giống nhau
email
admin@sso.local
admin@sso.local
username
admin
admin
Tóm tắt luồng
┌─────────────────────────────────────────────────────────────┐
│  TAB 1: Swagger Demo A (localhost:3001)                     │
│  1. GET /auth/sso/start → 302 → copy location URL          │
│  2. Mở tab SSO login → admin@sso.local / ChangeMeAdmin123! │
│  3. SSO redirect về Demo A → JSON {user} + set cookie      │
│  4. Copy access_token cookie                                │
│  5. GET /auth/me → 200 {user} ✓                            │
└─────────────────────────────────────────────────────────────┘
                           ↓ cùng access_token
┌─────────────────────────────────────────────────────────────┐
│  TAB 2: Swagger Demo B (localhost:3002)                     │
│  6. Authorize với access_token của Demo A                   │
│  7. GET /auth/me → 200 {user} ✓  ← KHÔNG cần login lại     │
└─────────────────────────────────────────────────────────────┘
Key insight: Demo B không có cơ chế login riêng — nó tin tưởng access_token do SSO cấp. Đây chính là Single Sign-On: đăng nhập 1 lần → dùng tất cả projects.