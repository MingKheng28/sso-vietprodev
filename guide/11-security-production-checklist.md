# Security Production Checklist

Checklist bảo mật bắt buộc trước khi go-live production.

## 1. OAuth2/OIDC

- [ ] Authorization Code Flow với PKCE `S256` (không dùng `plain`)
- [ ] Redirect URI exact match (không wildcard)
- [ ] Client secret hash (không lưu plaintext)
- [ ] ID token ký bằng asymmetric key (JWKS)
- [ ] Access token TTL <= 15 phút
- [ ] Refresh token hash, rotation khi dùng
- [ ] Scope tối thiểu theo từng client
- [ ] Introspection endpoint có client authentication
- [ ] Token revocation hoạt động
- [ ] Discovery/JWKS endpoint public, không expose private key

## 2. Session/UI

- [ ] HTTPS bắt buộc (`COOKIE_SECURE=true`)
- [ ] Cookie: `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] CSRF protection cho login/logout/consent forms
- [ ] Rate limiting login/token endpoints
- [ ] Account lockout sau nhiều login sai (Brute-force protection)
- [ ] Password policy: tối thiểu 12 ký tự
- [ ] Password hashing: Argon2id
- [ ] Error message không reveal user existence
- [ ] MFA ready (schema và flow sẵn sàng mở rộng)

## 3. Secrets

- [ ] Không commit `.env` thật lên Git
- [ ] Kubernetes Secret hoặc secret manager cho production
- [ ] Connection strings không hardcode
- [ ] JWKS private key chỉ trong secret store
- [ ] Mỗi môi trường có secret riêng
- [ ] CI/CD secrets có quyền hạn chế
- [ ] Secret rotation plan có sẵn

## 4. Database

- [ ] SSO trỏ tới PgBouncer/HAProxy endpoint (không trỏ thẳng node)
- [ ] App user không phải superuser
- [ ] TLS cho kết nối DB (nếu network không hoàn toàn private)
- [ ] Backup snapshot mã hóa và verify restore định kỳ
- [ ] Migration backward compatible
- [ ] Audit log append-only (không sửa/xóa trực tiếp)
- [ ] MongoDB có auth, authorization, TLS

## 5. Kubernetes

- [ ] Container chạy non-root user
- [ ] Resource limits đặt (CPU/memory)
- [ ] PodSecurityPolicies hoặc Pod Security Standards
- [ ] NetworkPolicy hạn chế egress
- [ ] RBAC với ServiceAccount quyền tối thiểu
- [ ] Secret không trong ConfigMap
- [ ] Readiness/liveness probes đúng
- [ ] Không log secret trong env

## 6. Monitoring/Logging

- [ ] Không log password, token, authorization code, client secret
- [ ] Audit log ghi: login success/failed, token refresh/revoke, logout, admin action, DB failover
- [ ] Metrics không chứa PII
- [ ] Alert khi login failed spike
- [ ] Alert khi token endpoint error
- [ ] Alert khi DB failover
- [ ] Alert khi audit write failure
- [ ] Request ID/correlation ID cho truy vết
- [ ] Log/audit retention policy rõ ràng

## 7. CI/CD

- [ ] Branch protection: không push trực tiếp `main`
- [ ] PR bắt buộc CI pass
- [ ] Dependency scan trong CI
- [ ] Secret scan trước merge
- [ ] Docker image scan (không critical vulnerability)
- [ ] Helm lint trước deploy
- [ ] Production deploy cần manual approval
- [ ] Rollback plan đã test trên staging

## 8. Go-Live Gate

- [ ] OIDC discovery, authorize, token, userinfo, JWKS, introspection, revocation hoạt động đúng
- [ ] Không còn secret thật trong repository, image, log, CI output
- [ ] Dependency scan và image scan không critical vulnerability
- [ ] PostgreSQL HA failover đã test (Patroni/etcd/HAProxy/PgBouncer)
- [ ] Audit log ghi đầy đủ events
- [ ] Prometheus scrape `/metrics` hoạt động
- [ ] Grafana dashboard có dữ liệu
- [ ] Alertmanager gửi cảnh báo test thành công
- [ ] Helm rollback đã test trên staging
- [ ] Backup restore đã test
- [ ] Incident response runbook sẵn sàng
