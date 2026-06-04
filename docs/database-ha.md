# Database HA Architecture

## Overview

SSO production sử dụng PostgreSQL High Availability thông qua Patroni, etcd, HAProxy và PgBouncer.

## Component Roles

| Component | Role |
|---|---|
| **Patroni** | Quản lý PostgreSQL cluster, streaming replication, leader election, automatic failover |
| **etcd** | Distributed consensus store cho Patroni, tránh split-brain |
| **HAProxy** | Route traffic đến PostgreSQL primary cho write |
| **PgBouncer** | Connection pooling, giảm số connection trực tiếp vào PostgreSQL |

## Connection Flow

```
SSO API
  └─> PgBouncer (:6432)
        └─> HAProxy (:5433)
              └─> PostgreSQL Primary (write)
              └─> PostgreSQL Replicas (read)
```

## Failover Flow

```mermaid
sequenceDiagram
    participant P1 as PostgreSQL Node 1 (Leader)
    participant P2 as PostgreSQL Node 2 (Standby)
    participant ETCD as etcd
    participant HAP as HAProxy
    participant SSO as SSO API

    Note over P1: Node 1 Leader đang active
    P1->>ETCD: Leader heartbeat OK

    Note over P1: Node 1 gặp sự cố (network/server)
    P1-xETCD: Heartbeat lost

    ETCD->>ETCD: Leader election
    ETCD-->>P2: Promote Node 2

    P2->>P2: Promote to Leader
    P2->>ETCD: New leader heartbeat

    Note over HAP: HAProxy nhận biết primary mới
    HAP->>P2: Route writes to Node 2

    Note over SSO: SSO tự động chuyển qua PgBouncer
    SSO->>HAP: Write requests via PgBouncer
```

## Connection Manager

SSO có `DbConnectionManager` quản lý connection pools:

- `getWritePool()`: Connection tới PgBouncer (route tới primary)
- `getReadPool()`: Connection tới PgBouncer (hiện tại cùng endpoint - read/write chưa split)
- `getProjectPool(appCode)`: Connection tới project DB riêng

Xem chi tiết:
- Source: `src/db-manager/`
- Health: `src/health/`

## Monitoring

Health check endpoint `/health/dependencies` kiểm tra:
- PostgreSQL via direct query
- MongoDB via ping
- HAProxy stats
- PgBouncer admin
- Patroni API

Grafana dashboard: `infrastructure/monitoring/grafana/dashboards/postgres-ha-dashboard.json`

## Local Development

Local dev dùng `docker-compose.local.yml` với PostgreSQL và MongoDB đơn node. Không cần Patroni/HAProxy/PgBouncer ở local.

Xem `docker-compose.ha.yml` để biết cấu hình HA infrastructure local.
