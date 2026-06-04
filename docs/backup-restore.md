# Backup and Restore

## Backup Layers

SSO có 2 lớp backup:

### Layer 1: Streaming Replication (Primary HA)

- Patroni duy trì streaming replication giữa Leader và Replicas.
- Data gần real-time (thường < 1 giây lag).
- Tự động, không cần cấu hình thêm.

### Layer 2: Snapshot Backup (Phục vụ khôi phục dữ liệu đã xóa/lỗi logic)

- Chạy định kỳ mỗi 5 phút (configurable qua `BACKUP_VERIFY_CRON`).
- Backup verify: kiểm tra backup gần nhất có thể restore.
- Lưu trữ: snapshot, không phải primary HA.

## Backup Strategy

| Backup Type | Frequency | Retention | Tool |
|---|---|---|---|
| Streaming replication | Real-time | N/A | Patroni |
| Snapshot | 5 phút | Theo chính sách | pg_dump hoặc snapshot volume |
| Archive WAL | Continuous | 7 ngày | PostgreSQL archive_mode |

## Verify Backup

Script `infrastructure/postgres-ha/scripts/backup-snapshot.ps1` kiểm tra:

1. Backup mới nhất có thể restore.
2. Không có lỗi corrupt.
3. WAL archive hoạt động.

## Restore Procedure

### 1. Point-in-time Recovery (PITR)

Dùng when đã lỗi logic (xóa nhầm, update nhầm):

```bash
# Tạo timeline mới từ backup gần nhất
pg_restore -h pg_backup_server -U postgres -d sso_login_backup latest_backup.dump

# Replay WAL tới thời điểm mong muốn
pg_basebackup -h pg_primary -U replicator -D /var/lib/postgresql/16/main \
  --checkpoint=fast --wal-method=stream --progress
```

### 2. Full Restore

Khi toàn bộ cluster lỗi:

```bash
# Khôi phục từ backup snapshot
kubectl exec -it pg-backup-pod -n sso-prod -- \
  /scripts/restore-snapshot.ps1 --backup-id=latest
```

## MongoDB Audit Backup

Audit log trên MongoDB:

1. MongoDB replica set cung cấp redundancy.
2. Backup định kỳ qua MongoDB backup tool.
3. Audit log nên được coi là append-only.

## Checklist

- [ ] Streaming replication hoạt động (Lag ~ 0)
- [ ] Backup snapshot chạy định kỳ
- [ ] Backup verify thành công
- [ ] Restore test đã thực hiện
- [ ] Backup retention policy rõ ràng
