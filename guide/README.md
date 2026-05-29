# Guide vận hành dự án SSO

Đọc theo thứ tự local, pgAdmin4, MongoDB, env, OIDC client, onboarding project, HA, Helm, monitoring, CI/CD, security và incident response.

## Bắt đầu nhanh cho người mới

Nếu bạn chưa biết cài gì, setup thế nào, bật dự án ra sao, hãy đọc file này trước:

- [00-setup-and-run-local-full.md](00-setup-and-run-local-full.md)

File này hướng dẫn chi tiết từng bước:

1. Cài Node.js.
2. Cài Docker Desktop.
3. Cài Git, VS Code, pgAdmin4, MongoDB Compass.
4. Tạo `.env`.
5. Bật PostgreSQL và MongoDB local.
6. Chạy migration, seed, generate JWKS.
7. Start SSO API.
8. Kiểm tra health, OIDC discovery, metrics.
9. Xử lý các lỗi thường gặp.

## Lưu ý Project A/B thật

Project A và Project B hiện là hệ thống thật của công ty và chưa được phép sửa code. Vì vậy các guide OIDC/onboarding hiện phải hiểu là chuẩn bị tích hợp/readiness, chưa phải go-live SSO vào Project A/B.

Chiến lược chi tiết nằm ở:

- [../docs/project-ab-integration-strategy.md](../docs/project-ab-integration-strategy.md)

## Thứ tự đọc khuyến nghị

1. [00-setup-and-run-local-full.md](00-setup-and-run-local-full.md) - setup và chạy local từ đầu.
2. [01-local-setup.md](01-local-setup.md) - tóm tắt setup local.
3. [02-pgadmin4-postgresql-setup.md](02-pgadmin4-postgresql-setup.md) - thao tác PostgreSQL bằng pgAdmin4.
4. [03-mongodb-compass-cluster-setup.md](03-mongodb-compass-cluster-setup.md) - thao tác MongoDB bằng Compass.
5. [04-env-and-connection-strings.md](04-env-and-connection-strings.md) - cấu hình `.env` và connection string.
6. [05-oidc-client-registration.md](05-oidc-client-registration.md) - đăng ký OAuth2/OIDC client.
7. [06-project-db-onboarding.md](06-project-db-onboarding.md) - thêm project mới vào SSO.
8. [13-demo-backend-multi-project-sso.md](13-demo-backend-multi-project-sso.md) - test 2 backend demo mô phỏng Project A/B và luồng SSO nhiều dự án.
9. [07-patroni-etcd-haproxy-pgbouncer.md](07-patroni-etcd-haproxy-pgbouncer.md) - PostgreSQL HA production.
10. [08-kubernetes-helm-deployment.md](08-kubernetes-helm-deployment.md) - deploy Kubernetes/Helm.
11. [09-monitoring-prometheus-grafana-alertmanager.md](09-monitoring-prometheus-grafana-alertmanager.md) - monitoring/alerting.
12. [10-cicd-release-rollback.md](10-cicd-release-rollback.md) - CI/CD, release, rollback.
13. [11-security-production-checklist.md](11-security-production-checklist.md) - checklist bảo mật production.
14. [12-incident-response-runbook.md](12-incident-response-runbook.md) - xử lý sự cố.

## Vai trò

- Developer: đọc guide local, env, OIDC client, coding rules.
- DevOps: đọc guide HA, Kubernetes/Helm, monitoring, CI/CD, security.
- Admin hệ thống: đọc guide pgAdmin4, MongoDB, onboarding project, incident response.

## Guide demo backend multi-project SSO

Trước khi sửa Project A/B thật, giai đoạn tiếp theo là tạo 2 backend demo mô phỏng Project A/B thật để chứng minh SSO hoạt động cho nhiều dự án.

Đọc thêm:

- [../plans/demo-backend-multi-project-sso-plan.md](../plans/demo-backend-multi-project-sso-plan.md) - kế hoạch demo backend multi-project SSO.
- [13-demo-backend-multi-project-sso.md](13-demo-backend-multi-project-sso.md) - guide test Demo A/Demo B sau khi coding.

## Nguyên tắc chung

- Không commit secret thật.
- Không commit file `.env`.
- Không dùng Docker tag `latest` cho production.
- Không deploy production thủ công ngoài CI/CD pipeline.
- Mọi project mới phải có OIDC client và connection config rõ ràng.
- Với Project A/B hiện tại, không ghi session/token/cookie vào project khi chưa có phê duyệt bảo mật.
- Demo backend được phép mô phỏng schema/session của Project A/B nhưng không được dùng secret hoặc DB thật khi chưa có phê duyệt.
