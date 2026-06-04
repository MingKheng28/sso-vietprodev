# pgAdmin4 Connections Guide

## Overview

pgAdmin4 là công cụ quản lý PostgreSQL. Hướng dẫn này mô tả cách kết nối pgAdmin4 tới các endpoint PostgreSQL của SSO.

## Connection Endpoints

### Local Development

```
Host: localhost
Port: 5432
Database: sso_login
Username: sso_app_user
```

### Production HA

```
Host: pgbouncer.internal (hoặc IP PgBouncer)
Port: 6432
Database: sso_login
Username: sso_app_user
```

## Kết nối PgBouncer vs Direct PostgreSQL

### Qua PgBouncer (Production)

- PgBouncer dùng transaction pooling mode.
- Một số pgAdmin4 operations có thể không hoạt động (vì PgBouncer không hỗ trợ prepared statements trong transaction mode).
- **Nên dùng cho xem dữ liệu và query đơn giản.**

### Direct PostgreSQL (Admin)

- Kết nối trực tiếp tới một PostgreSQL node (không qua PgBouncer).
- Dùng cho: admin operations, restore, migration, troubleshooting.
- **Chỉ dùng khi cần, không dùng thường xuyên.**

## pgAdmin4 Connection via PgBouncer

1. Mở pgAdmin4.
2. `Servers` > `Register` > `Server`.
3. Tab General: Name: `SSO HA via PgBouncer`.
4. Tab Connection:

```
Host: pgbouncer.internal
Port: 6432
Maintenance database: sso_login
Username: sso_app_user
Password: [password]
```

5. Tab Parameters:
   - `connect_timeout`: 10
   - `statement_timeout`: 30000

6. Save.

> Lưu ý: Một số pgAdmin4 features (table designer, backup/restore) không hoạt động qua PgBouncer transaction mode. Dùng psql hoặc direct connection khi cần.

## pgAdmin4 Direct Connection (Admin Only)

Chỉ dùng cho admin operations:

```
Host: pg1.internal
Port: 5432
Maintenance database: postgres
Username: postgres
Password: [admin password]
```

## Các Databases quan trọng

| Database | Purpose |
|---|---|
| `sso_login` | SSO core: users, clients, sessions, tokens |
| `sso_login_backup` | Backup DB |
| `project_a` | Project A (read-only) |
| `project_b` | Project B (read-only) |

## Security Notes

- Không dùng superuser (`postgres`) cho app connection.
- App chỉ có quyền trên `sso_login`.
- pgAdmin4 nên được truy cập từ trusted network.
- Không lưu password trong pgAdmin4 nếu máy không secure.
