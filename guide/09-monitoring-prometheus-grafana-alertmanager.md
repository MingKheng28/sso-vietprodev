# Monitoring Prometheus Grafana Alertmanager

Tài liệu này hướng dẫn thiết lập monitoring và alerting cho SSO production.

## Metrics Endpoint

SSO expose metrics tại `/metrics` (Prometheus format):

```
# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 1234
http_request_duration_seconds_bucket{le="0.5"} 5678
```

Metrics có sẵn:

| Metric | Type | Mô tả |
|---|---|---|
| `http_requests_total` | Counter | Tổng số HTTP requests |
| `http_request_duration_seconds` | Histogram | Thời gian xử lý request |
| `oidc_authorize_total` | Counter | Số authorize requests |
| `oidc_token_total` | Counter | Số token exchange |
| `login_success_total` | Counter | Số login thành công |
| `login_failed_total` | Counter | Số login thất bại |
| `db_pool_connections_active` | Gauge | Số connection active |
| `db_pool_connections_idle` | Gauge | Số connection idle |

## Cấu hình Prometheus

Thêm scrape config vào `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'sso-api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['sso-api.sso-prod.svc.cluster.local:3000']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'sso-api'
```

Hoặc dùng PrometheusOperator với ServiceMonitor:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: sso-api
  namespace: sso-prod
spec:
  selector:
    matchLabels:
      app: sso-api
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

## Grafana Dashboards

Import dashboard JSON từ `infrastructure/monitoring/grafana/dashboards/`:

| Dashboard | File | Mục đích |
|---|---|---|
| SSO API Overview | `sso-api-dashboard.json` | Uptime, latency, HTTP status |
| OIDC Flow | `oidc-flow-dashboard.json` | Authorize, token, userinfo, error rate |
| PostgreSQL HA | `postgres-ha-dashboard.json` | Connection pool, replication lag |
| MongoDB Audit | `mongodb-audit-dashboard.json` | Write rate, latency |
| HAProxy/PgBouncer | `haproxy-pgbouncer-dashboard.json` | Backend status, connection saturation |

### Import dashboard

1. Mở Grafana > Dashboards > Import.
2. Upload JSON file hoặc paste JSON content.
3. Chọn Prometheus datasource.
4. Nhấn Import.

## Alerting

### Alert rules

Cấu hình trong `infrastructure/monitoring/prometheus/alert-rules.yml`:

```yaml
groups:
  - name: sso-api
    rules:
      - alert: SsoApiDown
        expr: up{job="sso-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "SSO API is down"
          description: "SSO API has been down for more than 1 minute."

      - alert: SsoLoginFailedSpike
        expr: rate(login_failed_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Login failed spike"
          description: "Login failures have spiked above 10/min for 2 minutes."

      - alert: SsoTokenEndpointHighErrorRate
        expr: rate(oidc_token_total{status="error"}[5m]) / rate(oidc_token_total[5m]) > 0.05
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Token endpoint error rate > 5%"
          description: "Token endpoint is returning errors at high rate."

      - alert: SsoDbPoolExhausted
        expr: db_pool_connections_active / db_pool_connections_max > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "DB pool usage above 90% for 5 minutes."

      - alert: SsoMongoAuditWriteFailed
        expr: rate(audit_write_errors_total[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MongoDB audit write failures"
          description: "Audit log writes are failing."
```

## Alertmanager

Cấu hình `infrastructure/monitoring/alertmanager/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'email-and-slack'
  routes:
    - match:
        severity: critical
      receiver: 'email-and-slack'
      repeat_interval: 1h

receivers:
  - name: 'email-and-slack'
    email_configs:
      - to: sso-alerts@example.com
        send_resolved: true
    slack_configs:
      - channel: '#sso-alerts'
        send_resolved: true
        api_url: CHANGE_ME_SLACK_WEBHOOK
```

## Health Check Endpoints

SSO có 3 health endpoints:

| Endpoint | Mục đích |
|---|---|
| `/health/live` | Liveness probe - app đang chạy |
| `/health/ready` | Readiness probe - sẵn sàng nhận traffic |
| `/health/dependencies` | Chi tiết trạng thái dependencies |

Dùng trong Kubernetes probes:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: http
  initialDelaySeconds: 10
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /health/ready
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Checklist

- [ ] Prometheus scrape `/metrics` thành công
- [ ] Tất cả Grafana dashboards import và có dữ liệu
- [ ] Alert rules đã load vào Prometheus
- [ ] Alertmanager nhận alerts
- [ ] Test alert gửi được notification (email/slack)
- [ ] Kubernetes probes dùng đúng endpoints
- [ ] Health check endpoints trả `ok` trên production
