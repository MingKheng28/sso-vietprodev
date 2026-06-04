# Incident Response Runbook

Tài liệu này hướng dẫn xử lý sự cố production.

## 1. Sự cố Login Lỗi Hàng Loạt

### Triệu chứng

- Người dùng không đăng nhập được.
- Grafana: `login_failed_total` spike cao bất thường.
- Alert: `SsoLoginFailedSpike` firing.

### Bước xử lý

1. **Xác nhận scope:**

```bash
# Kiểm tra login failed rate
curl -s http://prometheus:9090/api/v1/query?query=rate(login_failed_total[5m])

# Kiểm tra health
curl -sf https://sso.example.com/health/ready
```

2. **Kiểm tra nguyên nhân:**

- Check DB connection: SSO kết nối được PostgreSQL?
- Check SSO OIDC configuration: issuer đúng?
- Check recent deployment: có deploy gần đây không?
- Check client registration: clients có đúng redirect_uri?

3. **Nếu do deployment mới:**

```bash
# Rollback ngay
helm rollback sso-api -n sso-prod --wait
```

4. **Nếu do DB issue:**

- Kiểm tra PgBouncer/HAProxy/Patroni.
- Xem chi tiết trong `guide/07-patroni-etcd-haproxy-pgbouncer.md`.

5. **Thông báo:**

- Gửi thông báo tới người dùng qua kênh nội bộ.
- Ghi incident report.

## 2. Sự cố DB Failover

### Triệu chứng

- Alert: `Patroni failover` firing.
- SSO `/health/ready` degraded.
- Logs có `DB_FAILOVER_STARTED`.

### Bước xử lý

1. **Không cần hành động ngay** từ phía SSO.

Application SSO không tự promote DB. Patroni/etcd xử lý tự động.

2. **Xác nhận failover đang diễn ra:**

```bash
patronictl -c /etc/patroni.yml list
```

3. **Xác nhận SSO tự phục hồi:**

```bash
# Chờ HAProxy/PgBouncer route lại
sleep 30
curl -sf https://sso.example.com/health/ready
```

4. **Kiểm tra audit log:**

```bash
# Xác nhận audit event được ghi
db.audit_logs.find({ eventType: /^DB_/ }).sort({ createdAt: -1 }).limit(5)
```

5. **Post-incident:**

- Xác nhận Patroni cluster ổn định.
- Kiểm tra replication lag trên replicas.
- Review nguyên nhân gốc failover.

## 3. Sự cố MongoDB Audit Lỗi

### Triệu chứng

- Alert: `SsoMongoAuditWriteFailed` firing.
- SSO vẫn chạy nhưng audit không ghi.

### Bước xử lý

1. **Kiểm tra MongoDB cluster:**

```bash
# Check MongoDB status
mongosh --eval "rs.status()"
```

2. **Kiểm tra credential/TLS:**

```bash
# Test connection từ SSO pod
kubectl exec -it deploy/sso-api -n sso-prod -- \
  mongosh "$MONGODB_AUDIT_URL" --eval "db.adminCommand({ping:1})"
```

3. **Kiểm tra collection/index:**

```bash
# Verify audit_logs collection tồn tại
mongosh "$MONGODB_AUDIT_URL" --eval "db.getCollectionNames()"
```

4. **Restart audit writer nếu cần:**

```bash
# Không cần restart toàn app, audit writer sẽ retry
# Kiểm tra sau 1 phút
sleep 60
kubectl logs -n sso-prod -l app=sso-api --tail=50 | grep audit
```

5. **Nếu MongoDB không phục hồi:**

- Không restart SSO vội (audit write fail không ảnh hưởng login).
- Phục hồi MongoDB trước.
- Kiểm tra audit queue/buffer trong SSO nếu có.

## 4. Sự cố OIDC Signing Key

### Triệu chứng

- Token verify failed ở client.
- Alert: OIDC signing error.

### Bước xử lý

1. **Không xoay key đột ngột** nếu có grace period.

2. **Kiểm tra JWKS endpoint:**

```bash
curl -sf https://sso.example.com/oauth/jwks | jq .
```

3. **Nếu key bị lộ:**

- Khẩn cấp: restore key từ backup.
- Cập nhật secret store.
- Notify clients để update JWKS cache.
- Không xoá key cũ ngay - grace period cho clients.

4. **Key rotation plan:**

```bash
# Tạo key mới
npm run jwks:generate

# Update secret store
kubectl create secret generic sso-api-jwks --from-file=oidc-private.jwk.json=secrets/oidc-private.jwk.json --dry-run=client -o yaml | kubectl apply -f -
```

## 5. Sự cố Token Endpoint Lỗi

### Triệu chứng

- Alert: `SsoTokenEndpointHighErrorRate`.
- Client báo token exchange failed.

### Bước xử lý

1. **Kiểm tra logs:**

```bash
kubectl logs -n sso-prod -l app=sso-api --tail=100 | grep token
```

2. **Kiểm tra common causes:**

- Client dùng sai `client_id` hoặc `client_secret`?
- Authorization code đã hết hạn hoặc đã dùng?
- PKCE `code_verifier` không khớp?

3. **Check OIDC Grant table:**

```sql
SELECT id, client_id, expires_at FROM oidc_grants
WHERE expires_at < NOW()
ORDER BY expires_at DESC LIMIT 10;
```

## Rollback Emergency

Nếu cần rollback production ngay:

```bash
# Xem revisions
helm history sso-api -n sso-prod

# Rollback về revision ổn định gần nhất
helm rollback sso-api REVISION -n sso-prod --wait

# Verify
curl -sf https://sso.example.com/health/live
curl -sf https://sso.example.com/.well-known/openid-configuration | jq .issuer
```

## Incident Report Template

Sau mỗi sự cố, ghi:

```
# Incident Report - [Ngày]

## Tóm tắt
[Mô tả ngắn sự cố]

## Thời gian
- Phát hiện: [Thời điểm]
- Phục hồi: [Thời điểm]
- Tổng downtime: [X phút]

## Nguyên nhân gốc
[Root cause]

## Hành động phục hồi
1. [Bước 1]
2. [Bước 2]

## Lessons Learned
[Những điều cần cải thiện]

## Action Items
- [ ] [Hành động 1]
- [ ] [Hành động 2]
```
