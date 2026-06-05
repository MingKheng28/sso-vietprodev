# CI/CD Release Rollback

Tài liệu này mô tả quy trình CI/CD, release và rollback cho SSO production.

## Branch Strategy

| Branch | Mục đích | Protected |
|---|---|---|
| `main` | Production-ready, source of truth | Yes - PR required |
| `develop` | Integration branch cho staging | Yes - PR required |
| `feature/*` | Tính năng mới | No |
| `fix/*` | Sửa lỗi thường | No |
| `hotfix/*` | Sửa lỗi production khẩn cấp | No |
| `release/*` | Chuẩn bị release | No |

### Pull Request Rules

- Bắt buộc CI pass (lint, typecheck, test).
- Ít nhất 1 reviewer approve cho feature thường.
- Ít nhất 2 reviewers approve cho thay đổi auth, security, DB migration.
- Không push trực tiếp vào `main` và `develop`.

## Semantic Versioning

Format: `MAJOR.MINOR.PATCH` (ví dụ `v1.3.0`)

| Loại | Khi nào tăng | Ví dụ |
|---|---|---|
| `PATCH` | Fix bug, security patch | `1.3.0` -> `1.3.1` |
| `MINOR` | Thêm tính năng backward-compatible | `1.3.0` -> `1.4.0` |
| `MAJOR` | Breaking change | `1.3.0` -> `2.0.0` |

## Docker Image Tagging

| Tag | Nguồn | Mục đích |
|---|---|---|
| `v1.3.0` | Git tag `v*` | Production release |
| `main-sha-abc1234` | Branch `main` | Staging |
| `develop-sha-abc1234` | Branch `develop` | Dev |

Không dùng `latest` cho production.

## CI Pipeline

Mỗi push/PR chạy:

```yaml
jobs:
  validate:
    steps:
      - npm ci
      - npm run lint        # ESLint + Prettier
      - npm run typecheck   # TypeScript
      - npm test           # Jest unit tests
```

## Docker Build Pipeline

Khi merge vào `main` hoặc push tag `v*`:

1. Build Docker image.
2. Push lên GHCR: `ghcr.io/OWNER/sso-api:TAG`.
3. Scan image (nếu có Quos).

## Helm Deploy Staging

Tự động qua `workflow_dispatch`:

1. Helm lint.
2. `helm upgrade --install` với `staging-latest`.
3. Chạy migration job.
4. Smoke test health + OIDC discovery.

## Helm Deploy Production

Cần **manual approval**:

1. Chọn tag `v1.3.0` từ dropdown.
2. Review changelog và risk.
3. Nhấn Approve.
4. Pipeline tự động:
   - Helm lint production values.
   - `helm upgrade --install` với tag cố định.
   - Chạy migration job.
   - Smoke test.
5. Nếu fail: tự động rollback.

## Rollback

### Tự động

GitHub Actions `helm-deploy-production.yml` có `rollback` job chạy khi `deploy-production` fail:

```yaml
rollback:
  needs: deploy-production
  if: failure()
  steps:
    - helm rollback sso-api -n sso-prod
```

### Thủ công

```bash
# Xem history
helm history sso-api -n sso-prod

# Rollback
helm rollback sso-api 3 -n sso-prod --wait

# Verify
curl -sf https://sso.example.com/health/live
```

## Migration Safety Rules

1. **Luôn backward compatible**: thêm cột/bảng trước, deploy app, sau đó mới cleanup.
2. **Không xóa cột đang dùng** trong cùng release.
3. **Backup trước migration**: chạy snapshot backup.
4. **Idempotent migration**: có thể chạy nhiều lần không lỗi.
5. **Test migration trên staging** trước production.

## Release Checklist

- [ ] Tất cả tests pass trên CI
- [ ] Security scan pass (không có critical vulnerability)
- [ ] Migration backward compatible
- [ ] Changelog đã cập nhật
- [ ] Docker image đã build và tag đúng
- [ ] Migration đã test trên staging
- [ ] Manual approval đã nhận
- [ ] Post-deploy smoke test pass
- [ ] Monitoring/alerting đã kiểm tra
