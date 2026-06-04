# Kế hoạch cập nhật Register, UI, Session Security và DB HA cho SSO

## 1. Mục tiêu

Tài liệu này là plan bổ sung sau khi đã test luồng demo backend multi-project SSO hiện tại.

Mục tiêu của giai đoạn tiếp theo:

- Bổ sung luồng **đăng ký tài khoản SSO** bên cạnh đăng nhập.
- Nâng cấp UI đăng nhập/đăng ký/consent/logout/error cho trực quan, đẹp và dễ hiểu hơn.
- Siết lại chính sách session để tránh cảm giác “tắt hết mở lại vẫn tự login” gây lo ngại bảo mật.
- Làm rõ cơ chế SSO giống Google: đăng nhập một lần ở SSO, các project khác có thể dùng phiên SSO đó để đăng nhập mà không nhập lại mật khẩu.
- Kiểm tra và hoàn thiện các phần còn thiếu trong demo client: verify ID token/JWKS, claim email thật, error handling không lộ token.
- Đánh giá trạng thái hiện tại của DB HA/load balancing/failover so với plan tổng và xác định các việc cần làm tiếp.

---

## 2. Trả lời các vấn đề hiện tại

### 2.1. SSO có phải giống Google: đăng ký/login một tài khoản rồi vào nhiều web khác tự đăng nhập?

Đúng về mặt ý tưởng tổng thể, nhưng cần hiểu chính xác:

1. User có **một tài khoản trung tâm** tại SSO Identity Provider.
2. User đăng nhập ở SSO một lần.
3. Khi mở Project A, Project A redirect sang SSO.
4. Nếu SSO session hợp lệ, SSO cấp authorization code/token cho Project A.
5. Project A **tự tạo session nội bộ riêng** của Project A.
6. Khi mở Project B, Project B cũng redirect sang SSO.
7. Nếu SSO session còn hiệu lực, user không cần nhập lại password.
8. Project B **tự tạo session nội bộ riêng** của Project B.

Điểm quan trọng:

- SSO không nên ghi trực tiếp vào DB session của Project A/B.
- Mỗi project vẫn giữ session/cookie/token riêng.
- “Tự login” thực chất là “SSO xác nhận user vẫn có phiên đăng nhập hợp lệ”, rồi project tự tạo session nội bộ.
- Đây là hành vi bình thường của Google/Microsoft/Keycloak/Auth0.

### 2.2. Vì sao tắt hết mở lại vẫn tự login?

Hiện tại SSO dùng `oidc-provider`, và provider lưu cookie/session của SSO trong trình duyệt. Nếu cookie chưa hết hạn và chưa logout, khi mở lại browser/server, user vẫn còn SSO session nên authorize flow có thể đi thẳng qua callback mà không hỏi password.

Điều này **không nhất thiết là lỗi bảo mật** nếu:

- Cookie là `HttpOnly`.
- Có TTL rõ ràng.
- Có `Secure` ở HTTPS.
- Có `SameSite` phù hợp.
- Có logout/end-session chuẩn.
- Có option “Remember me” rõ ràng.
- Có chính sách session idle timeout và absolute timeout.

Nhưng ở trạng thái hiện tại, UX chưa giải thích rõ, TTL/cookie policy còn đơn giản, nên người dùng cảm giác không an toàn.

### 2.3. DB backup/load balancing theo plan đã ổn định chưa?

Chưa thể coi là đã hoàn thiện theo plan production.

Hiện trạng code đang có:

- `SsoPoolService` dùng `SSO_LOGIN_PRIMARY_URL` làm endpoint chính.
- `DbConnectionManagerService` có abstraction `getSsoWritePool()`, `getSsoReadPool()` nhưng hiện đều trả cùng pool.
- Health endpoint có `/health/live`, `/health/ready`, `/health/dependencies`.
- Project DB registry và health service đã có nền tảng.

Nhưng chưa có đầy đủ:

- Patroni/etcd thật để quản lý PostgreSQL HA.
- HAProxy/PgBouncer routing endpoint production hoàn chỉnh.
- Read/write split thật.
- Failover test tự động.
- Audit đầy đủ cho failover/restore/backup.
- Backup snapshot mỗi 5 phút đã được verify.
- Dashboard/alert xác nhận DB HA hoạt động ổn định.

Kết luận: phần DB HA hiện mới ở mức **scaffold/architecture readiness**, chưa phải trạng thái “ổn định production”.

---

## 3. Phạm vi cập nhật đề xuất

### 3.1. Pha A: Register flow cho SSO core

#### [MODIFY] SSO auth/users module

Cần bổ sung service và endpoint cho đăng ký user SSO.

Luồng register đề xuất:

1. User mở `/register` hoặc SSO interaction có link “Tạo tài khoản”.
2. User nhập email, password, confirm password, display name.
3. Backend validate input.
4. Kiểm tra email chưa tồn tại.
5. Hash password bằng Argon2.
6. Tạo user trong SSO DB.
7. Ghi audit `REGISTER_SUCCESS` hoặc `REGISTER_FAILED`.
8. Có thể tự đăng nhập sau register hoặc yêu cầu login lại.

Đề xuất giai đoạn đầu:

- Cho phép register local ở môi trường demo/dev.
- Production nên có flag bật/tắt self-registration.
- Nếu công ty muốn kiểm soát tài khoản, register có thể tạo user `pending_verification` hoặc `pending_approval`.

Cần thêm config:

```env
SSO_REGISTRATION_ENABLED=true
SSO_REGISTRATION_AUTO_LOGIN=true
SSO_REQUIRE_EMAIL_VERIFICATION=false
```

#### [NEW] DTO register

Cần tạo DTO validate:

- `email`: email hợp lệ.
- `password`: tối thiểu 12 ký tự, có uppercase/lowercase/number/symbol.
- `confirmPassword`: phải trùng password.
- `name` hoặc `username`: giới hạn độ dài, sanitize.

#### [MODIFY] Migration/DB

Kiểm tra schema `users` hiện tại có đủ:

- `email`
- `password_hash`
- `status`
- `email_verified`
- `created_at`
- `updated_at`

Nếu thiếu, thêm migration an toàn.

#### [MODIFY] Audit events

Bổ sung event:

- `REGISTER_SUCCESS`
- `REGISTER_FAILED`
- `EMAIL_VERIFICATION_SENT`
- `EMAIL_VERIFIED`
- `SESSION_REUSED`
- `SESSION_EXPIRED`

---

### 3.2. Pha B: UI login/register/consent/logout/error đẹp và rõ luồng

#### [MODIFY] `src/oidc/views/login.hbs`

UI hiện tại đang tối giản. Cần nâng cấp thành trang login premium hơn, có:

- Branding VietProDev SSO.
- Card đăng nhập rõ ràng.
- Hiển thị app/client đang yêu cầu đăng nhập.
- Email/password inputs có trạng thái lỗi.
- Checkbox “Ghi nhớ đăng nhập”.
- Link “Tạo tài khoản SSO”.
- Link “Quên mật khẩu” nếu chưa làm thì để disabled/coming soon rõ ràng.
- Thông báo bảo mật: “Bạn đang đăng nhập vào SSO trung tâm”.

#### [NEW] `src/oidc/views/register.hbs`

Trang đăng ký cần:

- Giải thích đăng ký 1 tài khoản dùng cho nhiều project.
- Form email/password/confirm/name.
- Password strength meter.
- Terms/security notice.
- Link quay lại đăng nhập.

#### [NEW] `src/oidc/views/consent.hbs`

Hiện code tự approve consent. Với demo nội bộ có thể chấp nhận, nhưng UX tốt hơn nên có trang consent khi cần:

- App nào đang yêu cầu quyền.
- Scope nào được yêu cầu: `openid`, `profile`, `email`, `offline_access`.
- Button “Cho phép” và “Từ chối”.

Giai đoạn đầu có thể vẫn auto-consent cho first-party clients, nhưng cần config rõ:

```env
SSO_AUTO_CONSENT_FIRST_PARTY=true
```

#### [NEW] `src/oidc/views/logout.hbs`

Trang logout cần:

- Xác nhận user muốn logout khỏi SSO.
- Giải thích logout SSO khác logout từng project.
- Option quay lại app.

#### [NEW] `src/oidc/views/error.hbs`

Trang lỗi OAuth/OIDC thân thiện:

- Sai `redirect_uri`.
- Sai `client_id`.
- Hết hạn interaction.
- Sai state/code.
- Token exchange failed.

#### [MODIFY] `public/css/login.css`

Nâng cấp design system:

- Dark/premium gradient background.
- Glassmorphism card.
- Responsive mobile.
- Focus states rõ ràng.
- Button hover/loading state.
- Không dùng placeholder giả nếu không cần.

---

### 3.3. Pha C: Session security và hành vi “tắt mở lại vẫn login”

#### [MODIFY] OIDC session/cookie config

Cần bổ sung policy rõ ràng:

```env
SSO_SESSION_IDLE_TTL_SECONDS=1800
SSO_SESSION_ABSOLUTE_TTL_SECONDS=28800
SSO_REMEMBER_ME_TTL_SECONDS=604800
SSO_COOKIE_SECURE=false
SSO_COOKIE_SAME_SITE=lax
SSO_FORCE_LOGIN_PROMPT_AFTER_BROWSER_RESTART=false
```

Đề xuất local/demo:

- Không tick “Ghi nhớ phiên”: session ngắn hơn.
- Tick “Ghi nhớ phiên”: giữ 7 ngày.
- Có nút logout SSO rõ.

Đề xuất production:

- Access token TTL ngắn.
- SSO session idle timeout 15-30 phút.
- Absolute timeout 8-12 giờ.
- Remember me tùy chính sách công ty.
- Admin/security-sensitive action yêu cầu re-auth.

#### [MODIFY] Login flow

Khi user tick `remember`, set session/cookie dài hơn.
Khi không tick, nên ưu tiên session ngắn hoặc browser-session cookie tùy khả năng của `oidc-provider`.

Cần test các tình huống:

| Tình huống | Kỳ vọng |
|---|---|
| Login không remember, đóng browser | Có thể yêu cầu login lại tùy policy |
| Login remember, đóng mở lại | Không cần nhập lại trong TTL |
| Logout SSO | Demo A/B lần sau phải login SSO lại |
| Logout Demo A | Chỉ mất session Demo A, Demo B/SSO không bị logout |
| Hết idle timeout | Authorize yêu cầu login lại |
| Hết absolute timeout | Authorize yêu cầu login lại |

#### [NEW] Guide giải thích session

Cần bổ sung guide riêng:

```text
guide/15-sso-session-security-and-logout.md
```

Nội dung:

- Phân biệt SSO session và project session.
- Vì sao Demo B tự login sau Demo A.
- Vì sao đóng mở browser vẫn login.
- Cách logout SSO.
- Cách test hết session.

---

### 3.4. Pha D: Sửa claim email và verify token ở demo clients

#### [MODIFY] `src/oidc/oidc-claims.service.ts`

Hiện Demo A callback nhận user fallback `sso-user@example.com`, cho thấy `id_token` chưa có email hoặc callback chưa đọc đúng claim.

Cần đảm bảo claims trả:

- `sub`
- `email`
- `email_verified`
- `name`
- `preferred_username`

#### [MODIFY] `demo-projects/*/src/sso.service.ts`

Hiện demo callback dùng `jwt.decode(idToken)`.

Cần thay bằng verify thật:

- Lấy JWKS từ `SSO_ISSUER/oauth/jwks`.
- Verify signature.
- Verify issuer.
- Verify audience = client_id.
- Verify expiry.
- Chỉ sau verify mới dùng claims để tạo user/session nội bộ.

Có thể dùng `jose` trong demo projects.

#### [MODIFY] Error handling demo apps

Không log toàn bộ `error?.response?.data` nếu có nguy cơ chứa token/code.

Đề xuất log sanitize:

- `error`
- `error_description`
- `status`
- `requestId`

Không log:

- authorization code
- access token
- refresh token
- id token
- client secret

---

### 3.5. Pha E: Hoàn thiện logout/end-session

Cần tách rõ 3 loại logout:

1. **Project local logout**
   - Chỉ logout Demo A hoặc Demo B.
   - Deactivate session nội bộ project.
   - Không xóa SSO session.

2. **SSO logout**
   - Xóa session/cookie ở SSO.
   - Lần sau vào Demo A/B phải login lại tại SSO.

3. **Single logout nâng cao**
   - Logout khỏi SSO và thông báo/logout các clients.
   - Có thể làm sau, vì phức tạp hơn.

Cần thêm UI/button rõ:

- Demo A/B response hoặc frontend demo nên có link:
  - “Logout Demo only”
  - “Logout SSO”

---

### 3.6. Pha F: DB HA/load balancing/failover

#### Hiện trạng

Hiện dự án mới có abstraction và health endpoints. Chưa đủ bằng chứng HA production ổn định.

#### Hướng đúng theo plan tổng

Không nên để application tự promote primary/backup DB. Theo plan đã chốt:

```text
SSO API -> PgBouncer -> HAProxy -> Patroni PostgreSQL Cluster -> etcd
```

SSO chỉ kết nối vào endpoint ổn định.

#### Việc cần làm tiếp

1. Hoàn thiện docker compose HA local hoặc guide staging:
   - PostgreSQL nodes.
   - Patroni.
   - etcd.
   - HAProxy.
   - PgBouncer.

2. Cập nhật `.env.example`:

```env
SSO_LOGIN_PRIMARY_URL=postgresql://...@localhost:6432/sso_login
SSO_LOGIN_READ_URL=postgresql://...@localhost:6433/sso_login
```

3. Cập nhật `SsoPoolService`:
   - `getWritePool()` trỏ write endpoint.
   - `getReadPool()` trỏ read endpoint nếu có.
   - Nếu chưa có read endpoint, vẫn dùng write endpoint nhưng document rõ.

4. Cập nhật health check:
   - Check PgBouncer.
   - Check HAProxy stats nếu có.
   - Check PostgreSQL read/write query.
   - Check Mongo audit.

5. Thêm audit events:
   - `DB_CONNECTION_FAILED`
   - `DB_FAILOVER_DETECTED`
   - `DB_FAILOVER_RECOVERED`
   - `DB_BACKUP_SUCCESS`
   - `DB_BACKUP_FAILED`

6. Thêm script test failover:
   - Start app.
   - Kill primary node.
   - Verify HAProxy routes to new primary.
   - Verify SSO login/token still works.
   - Restore old primary.
   - Verify cluster healthy.

7. Thêm guide:

```text
guide/16-db-ha-failover-verification.md
```

---

## 4. Roadmap triển khai đề xuất

### Giai đoạn 1: Làm rõ UX và bảo mật session

Ưu tiên cao vì đang ảnh hưởng trực tiếp cảm nhận bảo mật.

- Nâng cấp UI login.
- Thêm UI/register route cơ bản.
- Thêm session policy env.
- Thêm logout SSO rõ ràng.
- Viết guide session/logout.

### Giai đoạn 2: Register hoàn chỉnh

- Register DTO/service/controller.
- Hash password.
- Audit register.
- Optional auto-login sau register.
- Optional email verification sau này.

### Giai đoạn 3: Chuẩn hóa OIDC claims và demo callback

- Fix email claim thật.
- Verify ID token bằng JWKS ở Demo A/B.
- Sanitize logging.
- Test lại Demo A -> Demo B.

### Giai đoạn 4: DB HA verification

- Không khẳng định production HA nếu chưa có Patroni/HAProxy/PgBouncer test.
- Hoàn thiện local/staging HA guide.
- Test failover có bằng chứng.
- Ghi audit/metrics.

### Giai đoạn 5: Production hardening

- Secure cookies HTTPS.
- CSRF/rate limit login/register.
- Account lockout.
- Email verification.
- Monitoring dashboard.
- Security checklist.

---

## 5. Tiêu chí hoàn thành

### Register/UI

- User có thể đăng ký tài khoản SSO mới.
- User có thể đăng nhập bằng tài khoản vừa đăng ký.
- UI login/register rõ SSO đang là tài khoản trung tâm.
- UI đẹp, responsive, không còn cảm giác demo thô.

### Session security

- Có TTL/remember-me rõ ràng.
- Logout SSO hoạt động.
- Có guide giải thích vì sao Demo B tự login sau Demo A.
- Có test case đóng/mở browser hoặc restart server.

### OIDC correctness

- Demo A/B không dùng `jwt.decode` đơn thuần.
- ID token được verify chữ ký/JWKS/issuer/audience.
- Email claim trả đúng user SSO, không fallback `sso-user@example.com` nếu SSO có email.

### DB HA

- Tài liệu ghi rõ hiện trạng scaffold vs production-ready.
- Có guide hoặc script test failover.
- Health endpoint phản ánh DB dependency thực tế.
- Có bằng chứng test failover trước khi tuyên bố ổn định.

---

## 6. Open questions cần chốt trước khi code

> [!IMPORTANT]
> Có cho phép user tự đăng ký tài khoản SSO ở production không, hay chỉ admin tạo tài khoản?

> [!IMPORTANT]
> Sau register có tự động login luôn không, hay bắt user quay lại màn login?

> [!IMPORTANT]
> Chính sách “Remember me” mong muốn là bao lâu: tắt browser là mất phiên, 1 ngày, 7 ngày, hay 30 ngày?

> [!WARNING]
> Nếu muốn “tắt hết mở lại luôn bắt đăng nhập lại”, trải nghiệm sẽ khác Google. An toàn hơn nhưng kém tiện hơn. Cần chốt theo yêu cầu bảo mật công ty.

> [!IMPORTANT]
> DB HA/load balancing có cần triển khai ngay local bằng Docker Compose đầy đủ Patroni/etcd/HAProxy/PgBouncer không, hay trước mắt chỉ cần document rõ và kiểm tra endpoint hiện có?
