# Failover Runbook

## Tự động vs Thủ công

### Patroni/etcd Failover

**Tự động hoàn toàn.** Không cần can thiệp thủ công.

Patroni tự động:
1. Phát hiện Leader failure
2. Bầu cử Leader mới từ các Standby
3. Promote Standby thành Leader
4. HAProxy tự động route tới Leader mới

### Application Failover (SSO)

**Tự động.** SSO chỉ kết nối tới PgBouncer endpoint. PgBouncer/HAProxy xử lý routing.

## Khi nào cần can thiệp thủ công

1. Patroni cluster không tự phục hồi sau 5 phút.
2. etcd quorum mất (>1 node etcd chết).
3. PgBouncer không kết nối được.
4. HAProxy không route đúng.

## Manual Intervention

### 1. Kiểm tra Patroni cluster

```bash
patronictl -c /etc/patroni.yml list
```

Output mẫu:
```
+ Cluster: sso-pg-cluster ---+
| Member    | Host       | Role    | State   | TL  | Lag in MB |
+-----------+------------+---------+---------+-----+-----------+
| pg1       | 10.0.0.1  | Leader  | running |  1 |           |
| pg2       | 10.0.0.2  | Replica | running |  1 |   0.0     |
| pg3       | 10.0.0.3  | Replica | running |  1 |   0.0     |
```

### 2. Kiểm tra etcd health

```bash
etcdctl --endpoints=http://etcd1:2379,http://etcd2:2379,http://etcd3:2379 endpoint health
```

### 3. Force failover thủ công

Chỉ khi Patroni không tự failover và cần can thiệp:

```bash
# Switch Leader từ pg1 sang pg2
patronictl -c /etc/patroni.yml switchover sso-pg-cluster --candidate pg2
```

### 4. Restart Patroni trên node lỗi

```bash
# Trên node pg1
sudo systemctl restart patroni
```

### 5. Reinit node

Khi node không thể catch up:

```bash
patronictl -c /etc/patroni.yml reinit sso-pg-cluster pg1 --force
```

## SSO vẫn hoạt động?

Trong hầu hết trường hợp, **SSO vẫn hoạt động** vì PgBouncer giữ connection pool. Chỉ có write operations bị interrupt tạm thời.

Kiểm tra:

```bash
curl -sf https://sso.example.com/health/ready
```

## Post-Failover Checklist

- [ ] Patroni cluster có đúng 1 Leader
- [ ] Replicas đồng bộ (Lag in MB ~ 0)
- [ ] HAProxy primary endpoint trỏ tới Leader mới
- [ ] PgBouncer kết nối được
- [ ] SSO `/health/ready` trả `ok`
- [ ] Test login thử
