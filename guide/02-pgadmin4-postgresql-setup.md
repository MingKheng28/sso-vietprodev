# pgAdmin4 PostgreSQL Setup

Tài liệu này hướng dẫn cấu hình PostgreSQL bằng pgAdmin4 để quản lý SSO Login DB và project DB.

## Muc tiêu

- Kết nối pgAdmin4 tới PostgreSQL local hoặc HA endpoint.
- Tạo database `sso_login`.
- Tạo app user với quyền tối thiểu.
- Lấy connection string để điền vào `.env`.

## Du kien

- pgAdmin4 đã cài đặt.
- PostgreSQL đang chạy (local Docker hoặc HA endpoint).

## Ket noi pgAdmin4

### Bước 1: Tao server mới

1. Mo pgAdmin4.
2. Chuot phai vao `Servers` trong Object Explorer.
3. Chon `Register` > `Server...`.

### Bước 2: Tab General

- Name: `SSO Local` (hoac ten moi truong thuc te, vi du `SSO Staging HA`)

### Bước 3: Tab Connection

| Truong | Gia tri local | Gia tri HA |
|---|---|---|
| Host name/address | `localhost` | Endpoint PgBouncer/HAProxy (vi du `pgbouncer.internal`) |
| Port | `5432` (Docker local) | Port PgBouncer (vi du `6432`) |
| Maintenance database | `postgres` | `postgres` |
| Username | `postgres` (local Docker) | User quan ly |
| Password | Mat khau postgres local | Mat khau tuong ung |

### Bước 4: Save

Nhan `Save`. pgAdmin4 se ket noi va hien thi server trong Object Explorer.

## Tao database sso_login

Neu dung Docker local (khong co san):

1. Mo query tool: Chuot phai vao server > `Query Tool`.
2. Chay:

```sql
CREATE DATABASE sso_login;
```

## Tao app user voi quyen toi thieu

> Nguyên tac: Không dùng superuser cho app. App user chi co quyen trên database `sso_login`.

### Bước 1: Tao role/app user

```sql
-- Tao user cho app SSO
CREATE ROLE sso_app_user WITH LOGIN PASSWORD 'your-secure-password-here';

-- Chi cho phep ket noi database sso_login
GRANT CONNECT ON DATABASE sso_login TO sso_app_user;

-- Tao schema moi cho app
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION sso_app_user;

-- Grant quyen tren schema
GRANT USAGE ON SCHEMA app TO sso_app_user;
GRANT CREATE ON SCHEMA app TO sso_app_user;

-- Grant quyen CRUD tren cac bang cua app schema
-- (Sau khi migration chay, cap quyen tren bang cu the)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO sso_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO sso_app_user;
```

### Bước 2: Grant quyen sau migration

Sau khi chay `npm run migration:run`, cap quyen:

```sql
-- Ket noi voi superuser, chay:
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sso_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sso_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sso_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO sso_app_user;
```

## Test ket noi

Chay trong Query Tool:

```sql
SELECT version();
-- Kỳ vọng: PostgreSQL 16.x
```

## Tao connection string

Format: `postgresql://username:password@host:port/database`

| Moi truong | Connection string |
|---|---|
| Local | `postgresql://sso_app_user:password@localhost:5432/sso_login` |
| HA | `postgresql://sso_app_user:password@pgbouncer.internal:6432/sso_login` |

## Checklist

- [ ] pgAdmin4 ket noi thanh cong
- [ ] Database `sso_login` ton tai
- [ ] User `sso_app_user` da tao
- [ ] `sso_app_user` khong phai superuser
- [ ] Connection string da dua vao `.env`, khong commit len Git
- [ ] Migration chay thanh cong voi app user

## Lỗi thuong gap

### Lỗi `connection refused`

- Kiem tra PostgreSQL/PGbouncer da chay chua: `docker ps`
- Kiem tra port dung chua
- Neu dung PgBouncer, dam bao PgBouncer dang listen dung port

### Lỗi `password authentication failed`

- Kiem tra mat khau nhap trong pgAdmin4
- Kiem tra user da tao chua
- Neu dung Docker, mat khau trong Docker env phai khop

### Lỗi `permission denied for database`

- `sso_app_user` chua co quyen CONNECT tren `sso_login`
- Chay `GRANT CONNECT ON DATABASE sso_login TO sso_app_user;`
