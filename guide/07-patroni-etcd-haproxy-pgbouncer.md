# Patroni etcd HAProxy PgBouncer

Tài liệu này hướng dẫn thiết lập PostgreSQL High Availability dùng Patroni, etcd, HAProxy và PgBouncer.

## Kiến trúc

```mermaid
flowchart TD
    SSO[SSO API] --> PGB[PgBouncer :6432]
    PGB --> HAP[HAProxy :5433]
    HAP --> PG1["PostgreSQL Node 1\n(Patroni Leader)"]
    HAP --> PG2["PostgreSQL Node 2\n(Patroni Standby)"]
    HAP --> PG3["PostgreSQL Node 3\n(Patroni Standby)"]
    PG1 --> PAT1[Patroni]
    PG2 --> PAT2[Patroni]
    PG3 --> PAT3[Patroni]
    PAT1 --> ETCD[etcd Cluster]
    PAT2 --> ETCD
    PAT3 --> ETCD
```

## Thứ tự triển khai

### Bước 1: Chuẩn bị hạ tầng

Yêu cầu:
- 3 server/VM cho PostgreSQL nodes (hoặc 3 container với volume để persist data)
- 3 server/VM cho etcd cluster
- 1 server/VM cho HAProxy + PgBouncer (có thể gộp chung)

### Bước 2: Cài đặt etcd cluster

Trên mỗi etcd node, cài etcd và cấu hình:

```bash
# Cài etcd
wget -qO- https://github.com/etcd-io/etcd/releases/download/v3.5.15/etcd-v3.5.15-linux-amd64.tar.gz | tar xz
sudo mv etcd-v3.5.15-linux-amd64/etcd* /usr/local/bin/
```

Cấu hình `/etc/etcd/etcd.conf.yml` (node 1):

```yaml
name: etcd1
data-dir: /var/lib/etcd
listen-peer-urls: http://0.0.0.0:2380
listen-client-urls: http://0.0.0.0:2379
initial-cluster: etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380
initial-cluster-state: new
initial-cluster-token: sso-etcd-cluster
advertise-client-urls: http://etcd1:2379
```

Khởi động etcd và kiểm tra cluster:

```bash
sudo systemctl enable --now etcd
etcdctl --endpoints=http://etcd1:2379,http://etcd2:2379,http://etcd3:2379 endpoint health
```

### Bước 3: Cài đặt PostgreSQL + Patroni

Trên mỗi PostgreSQL node:

```bash
# Cài PostgreSQL 16
sudo apt install -y postgresql-16

# Cài Patroni
pip install patroni[etcd]
```

Cấu hình `/etc/patroni.yml` (node 1):

```yaml
scope: sso-pg-cluster
name: pg1
restapi:
  listen: 0.0.0.0:8008
  connect_address: pg1:8008
etcd:
  host: etcd1:2379
postgresql:
  listen: 0.0.0.0:5432
  data_dir: /var/lib/postgresql/16/main
  parameters:
    max_connections: 200
    shared_buffers: 256MB
    wal_level: replica
    hot_standby: on
    max_wal_senders: 10
  replication:
    username: replicator
    password: CHANGE_ME
  bootstrap:
    dcs:
      postgresql:
        parameters:
          max_connections: 200
          shared_buffers: 256MB
      users:
        postgres:
          password: CHANGE_ME
          options: -superuser
tags:
  nofailover: false
  noloadbalance: false
  clonefrom: false
  nosync: false
```

Khởi động Patroni:

```bash
patroni /etc/patroni.yml
```

Kiểm tra:

```bash
patronictl -c /etc/patroni.yml list
```

Kỳ vọng: Một node là `Leader`, các node khác là `Replica`.

### Bước 4: Cấu hình HAProxy

HAProxy cân bằng tải giữa leader (write) và replicas (read).

Cấu hình `/etc/haproxy/haproxy.cfg`:

```cfg
global
  maxconn 4096
  stats socket /run/haproxy/admin.sock mode 660 level admin
  log localhost local0

defaults
  log global
  retries 3
  timeout connect 10s
  timeout client 30s
  timeout server 30s

listen stats
  bind *:8404
  mode http
  stats enable
  stats uri /stats
  stats refresh 30s

# Primary endpoint (write)
listen postgres_primary
  bind *:5433
  option pgsql-check user postgres
  option httpchk
  http-check expect status 200
  default-server inter 3s fall 2 rise 2 on-marked-down shutdown-sessions
  server pg1 pg1:5432 check port 8008 inter 3s fall 2 rise 2
  server pg2 pg2:5432 check port 8008 inter 3s fall 2 rise 2 backup
  server pg3 pg3:5432 check port 8008 inter 3s fall 2 rise 2 backup
```

### Bước 5: Cấu hình PgBouncer

PgBouncer giảm số connection trực tiếp vào PostgreSQL.

Cấu hình `/etc/pgbouncer/pgbouncer.ini`:

```ini
[databases]
sso_login = host=localhost port=5433 dbname=sso_login

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 500
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
server_lifetime = 3600
server_idle_timeout = 600
admin_users = postgres
```

File `/etc/pgbouncer/userlist.txt`:

```
"postgres" "SCRAM-SHA-256..."
"sso_app_user" "SCRAM-SHA-256..."
```

Khởi động PgBouncer:

```bash
sudo systemctl enable --now pgbouncer
```

### Bước 6: SSO kết nối qua PgBouncer

Trong `.env`:

```env
SSO_LOGIN_PRIMARY_URL=postgresql://sso_app_user:password@localhost:6432/sso_login
SSO_LOGIN_BACKUP_URL=postgresql://sso_app_user:password@localhost:6432/sso_login
```

## Test Failover

### Ngắt Leader

1. Kiểm tra trạng thái:

```bash
patronictl -c /etc/patroni.yml list
```

2. Ngắt leader:

```bash
sudo systemctl stop postgresql
```

3. Kiểm tra Patroni promote standby:

```bash
patronictl -c /etc/patroni.yml list
```

4. Xác nhận HAProxy route tới node mới:

```bash
# HAProxy primary endpoint vẫn hoạt động
pg_isready -h localhost -p 5433
```

5. Xác nhận SSO vẫn hoạt động:

```bash
curl http://localhost:3000/health/live
```

## Quy trình phục hồi

1. Khôi phục node cũ:

```bash
sudo systemctl start postgresql
patronictl -c /etc/patroni.yml reinit sso-pg-cluster pg1
```

2. Xác nhận cluster ổn định:

```bash
patronictl -c /etc/patroni.yml list
```

## Checklist

- [ ] etcd cluster có 3 node healthy
- [ ] Patroni cluster có 1 Leader và 2 Replica
- [ ] HAProxy primary endpoint trỏ tới Leader
- [ ] PgBouncer kết nối tới HAProxy
- [ ] SSO kết nối tới PgBouncer (port 6432)
- [ ] Failover test thành công: ngắt Leader, Patroni promote standby, HAProxy route lại
- [ ] SSO vẫn hoạt động sau failover
