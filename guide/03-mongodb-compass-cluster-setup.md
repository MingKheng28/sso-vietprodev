# MongoDB Compass Cluster Setup

Tài liệu này hướng dẫn cấu hình MongoDB bằng MongoDB Compass để quản lý audit log.

## Muc tiêu

- Kết nối MongoDB Compass tới MongoDB local hoặc cluster.
- Tạo database `sso_audit`.
- Tạo collection `audit_logs` với indexes.
- Xác nhận SSO ghi được audit event.

## Du kien

- MongoDB Compass đã cài đặt.
- MongoDB đang chạy (local Docker hoặc cluster).

## Ket noi MongoDB Compass

### Local Docker

Connection string:

```
mongodb://localhost:27017
```

Neu co auth:

```
mongodb://username:password@localhost:27017
```

### Production/Cluster

Neu dung replica set:

```
mongodb://mongo1:27017,mongo2:27017,mongo3:27017/sso_audit?replicaSet=rs0
```

Neu dung sharded cluster:

```
mongodb://mongos1:27017,mongos2:27017/sso_audit
```

### Các bước

1. Mo MongoDB Compass.
2. Chon `New Connection`.
3. Paste connection string.
4. Neu co auth, chon `Advanced Connection Options` > `Authentication`.
5. Neu dung replica set, chon `Advanced Connection Options` > `DNS Seedlist`.
6. Nhan `Connect`.

## Tao database va collection

### Tạo database

1. Trong left panel, chon `Create Database`.
2. Database name: `sso_audit`.
3. Collection name: `audit_logs`.
4. Nhan `Create Database`.

### Tạo indexes

Mo `Query` tab trong collection `sso_audit.audit_logs`, chon `Indexes`, tao các index sau:

| Index Name | Key | Options |
|---|---|---|
| `idx_created_at` | `{ createdAt: -1 }` | Background: true |
| `idx_event_type` | `{ eventType: 1, createdAt: -1 }` | Background: true |
| `idx_user_id` | `{ userId: 1, createdAt: -1 }` | Background: true, Sparse: true |
| `idx_client_app` | `{ clientApp: 1, createdAt: -1 }` | Background: true, Sparse: true |
| `idx_request_id` | `{ requestId: 1 }` | Background: true, Unique: true, Sparse: true |

Có thể chạy script tự động trong `infrastructure/mongodb/indexes.js`:

```bash
mongosh < infrastructure/mongodb/indexes.js
```

Hoặc chạy trong Compass Query Editor:

```javascript
// Index 1: createdAt descending
db.audit_logs.createIndex({ createdAt: -1 }, { name: "idx_created_at", background: true });

// Index 2: eventType + createdAt
db.audit_logs.createIndex(
  { eventType: 1, createdAt: -1 },
  { name: "idx_event_type", background: true }
);

// Index 3: userId + createdAt
db.audit_logs.createIndex(
  { userId: 1, createdAt: -1 },
  { name: "idx_user_id", background: true, sparse: true }
);

// Index 4: clientApp + createdAt
db.audit_logs.createIndex(
  { clientApp: 1, createdAt: -1 },
  { name: "idx_client_app", background: true, sparse: true }
);

// Index 5: requestId unique
db.audit_logs.createIndex(
  { requestId: 1 },
  { name: "idx_request_id", background: true, unique: true, sparse: true }
);
```

## Test insert audit event

Trong Compass Query Editor:

```javascript
db.audit_logs.insertOne({
  eventType: "TEST_EVENT",
  status: "success",
  createdAt: new Date(),
  requestId: "test-" + Date.now(),
  ip: "127.0.0.1",
  userAgent: "pgAdmin4-Test"
});
```

Kỳ vọng: Document được insert thành công.

## Xác nhận SSO ghi audit log

1. Chạy SSO: `npm run start:dev`.
2. Thử login sai password trên trình duyệt: `http://localhost:3000/oidc/interaction`.
3. Mở Compass, refresh `sso_audit.audit_logs`.
4. Kỳ vọng: Có document với `eventType: "LOGIN_FAILED"` hoặc `LOGIN_SUCCESS`.

## Security

### Local dev

- Không cần auth cho local MongoDB.
- Khong can TLS cho local.

### Production

Bắt buộc:

- Bật authentication: `auth=true` hoặc xác thực qua LDAP/X.509.
- Bật TLS: `tls=true`, `tlsAllowInvalidCertificates=false`.
- Network whitelisting: chỉ cho phép SSO service kết nối.
- Role MongoDB cho app: `readWrite` trên `sso_audit`, không phải `dbAdmin`.
- Không dùng root/admin user cho app.

## Checklist

- [ ] Compass kết nối thành công
- [ ] Database `sso_audit` tồn tại
- [ ] Collection `audit_logs` tồn tại
- [ ] 5 indexes đã được tạo
- [ ] Test insert thành công
- [ ] SSO ghi được audit event sau login test

## Lỗi thường gặp

### Lỗi `authentication failed`

- Kiểm tra username/password trong connection string
- Kiểm tra user đã được tạo trong MongoDB: `db.getUsers()`

### Lỗi `connection refused`

- MongoDB chưa chạy: `docker ps`
- Sai port

### Không thấy database sau khi tạo

- Refresh Object Explorer trong Compass
- Kiểm tra connection string có đúng database name
