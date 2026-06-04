# Kubernetes Helm Deployment

Tài liệu này hướng dẫn deploy SSO lên Kubernetes bằng Helm.

## Chuẩn bị

### Điều kiện tiên quyết

- Kubernetes cluster đã sẵn sàng.
- `kubectl` đã cấu hình đúng cluster.
- Helm 3 đã cài.
- Docker image đã build và push lên registry (xem `.github/workflows/docker-build.yml`).

### Namespace

Tạo namespaces:

```bash
kubectl create namespace sso-dev
kubectl create namespace sso-staging
kubectl create namespace sso-prod
```

### Secrets

Tạo Kubernetes Secret cho production:

```bash
kubectl create secret generic sso-api-secrets \
  --from-literal=SSO_LOGIN_PRIMARY_URL="postgresql://sso_app_user:CHANGE_ME@pgbouncer.internal:6432/sso_login" \
  --from-literal=SSO_LOGIN_BACKUP_URL="postgresql://sso_app_user:CHANGE_ME@pgbouncer.internal:6432/sso_login" \
  --from-literal=MONGODB_AUDIT_URL="mongodb://mongo_user:CHANGE_ME@mongo1:27017,mongo2:27017,mongo3:27017/sso_audit?replicaSet=rs0" \
  --from-literal=SESSION_SECRET="CHANGE_ME_min_32_chars" \
  --from-literal=ADMIN_API_KEY="CHANGE_ME" \
  --from-literal=OIDC_ISSUER="https://sso.example.com" \
  --from-literal=OIDC_PRIVATE_JWK_PATH="/run/secrets/oidc-private.jwk" \
  --namespace sso-prod
```

### Docker image tag

Điều chỉnh `infrastructure/helm/sso-api/values.yaml`:

```yaml
image:
  repository: ghcr.io/YOUR_OWNER/sso-api
  tag: v1.0.0
  pullPolicy: Always  # Hoặc IfNotPresent
```

Hoặc khi deploy:

```bash
helm upgrade --install sso-api infrastructure/helm/sso-api \
  --set image.repository=ghcr.io/YOUR_OWNER/sso-api \
  --set image.tag=v1.0.0
```

## Deploy Staging

### Helm lint

```bash
helm lint infrastructure/helm/sso-api \
  --values infrastructure/helm/sso-api/values-staging.yaml \
  --values infrastructure/helm/sso-api/values.yaml
```

### Deploy

```bash
helm upgrade --install sso-api infrastructure/helm/sso-api \
  --namespace sso-staging \
  --create-namespace \
  --values infrastructure/helm/sso-api/values-staging.yaml \
  --values infrastructure/helm/sso-api/values.yaml \
  --set image.repository=ghcr.io/YOUR_OWNER/sso-api \
  --set image.tag=staging-latest \
  --timeout 5m \
  --wait
```

### Kiểm tra rollout

```bash
kubectl rollout status deployment/sso-api -n sso-staging
kubectl get pods -n sso-staging
kubectl get svc -n sso-staging
```

### Chạy migration

```bash
kubectl apply -f infrastructure/kubernetes/jobs/migration-job.yml -n sso-staging
kubectl get job -n sso-staging
kubectl logs job/sso-api-migration -n sso-staging
```

### Smoke test

```bash
# Health check
curl http://sso-staging.INGRESS_DOMAIN/health/live

# OIDC discovery
curl http://sso-staging.INGRESS_DOMAIN/.well-known/openid-configuration | jq .issuer
```

## Deploy Production

### Quy trình

1. **Manual approval** từ người có quyền release.
2. **Tag Docker image** với SemVer: `v1.0.0`, `v1.0.1`, v.v.
3. **Chạy Helm deploy**:

```bash
helm upgrade --install sso-api infrastructure/helm/sso-api \
  --namespace sso-prod \
  --create-namespace \
  --values infrastructure/helm/sso-api/values-prod.yaml \
  --values infrastructure/helm/sso-api/values.yaml \
  --set image.repository=ghcr.io/YOUR_OWNER/sso-api \
  --set image.tag=v1.0.0 \
  --set image.pullPolicy=Always \
  --timeout 10m \
  --wait
```

4. **Chạy migration job**:

```bash
kubectl set image deployment/sso-api-migration sso-api=ghcr.io/YOUR_OWNER/sso-api:v1.0.0 -n sso-prod
kubectl rollout status job/sso-api-migration -n sso-prod
```

5. **Post-deploy verify**:

```bash
curl -sf https://sso.example.com/health/live
curl -sf https://sso.example.com/.well-known/openid-configuration | jq -e .issuer
```

## Rollback

### Rollback Helm release

```bash
# Xem history
helm history sso-api -n sso-prod

# Rollback về revision 3
helm rollback sso-api 3 -n sso-prod --wait

# Kiểm tra
kubectl rollout status deployment/sso-api -n sso-prod
```

### Rollback migration

Rollback migration phải thận trọng. Nguyên tắc:

- Migration phải **backward compatible** (không xóa cột đang dùng).
- Nếu migration không backward compatible: ưu tiên **forward-fix** thay vì rollback.

Nếu cần rollback schema:

```bash
kubectl exec -it deploy/sso-api -n sso-prod -- sh
# Sau đó chạy migration rollback SQL thủ công
```

## Cấu hình values theo môi trường

| Tham số | Staging | Production |
|---|---|---|
| `NODE_ENV` | `staging` | `production` |
| `COOKIE_SECURE` | `false` | `true` |
| `image.tag` | `staging-latest` | SemVer cố định |
| `replicaCount` | 1 | 2 |
| `autoscaling.enabled` | `false` | `true` |
| `ingress.host` | `sso-staging.example.com` | `sso.example.com` |

## Troubleshooting

### Pod không start

```bash
kubectl describe pod -n sso-prod -l app=sso-api
kubectl logs -n sso-prod -l app=sso-api --previous
```

### Migration job fail

```bash
kubectl logs job/sso-api-migration -n sso-prod
```

### Health check fail

```bash
kubectl exec -it deploy/sso-api -n sso-prod -- curl localhost:3000/health/live
```

## Checklist

- [ ] Namespace đã tạo
- [ ] Secrets đã tạo
- [ ] Image đã push lên registry
- [ ] Helm lint pass
- [ ] Migration job chạy thành công
- [ ] Health check trả `ok`
- [ ] OIDC discovery đúng issuer
- [ ] Rollback plan sẵn sàng
