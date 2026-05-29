# SQL schema cho demo_project_a và demo_project_b

Tài liệu này cung cấp SQL schema chuẩn để chạy thủ công trong pgAdmin4 cho 2 database demo:

- `demo_project_a`.
- `demo_project_b`.

Schema được thiết kế dựa trên cấu trúc thật của SIED, nhưng rút gọn vừa đủ cho mục tiêu demo SSO multi-project.

## 1. Cách chạy trong pgAdmin4

Làm lần lượt cho từng database:

1. Trong pgAdmin4, chọn database `demo_project_a`.
2. Mở Query Tool.
3. Copy toàn bộ SQL ở mục 3.
4. Bấm Execute.
5. Lặp lại y hệt cho database `demo_project_b`.

Lưu ý quan trọng:

- Query này tạo schema giống nhau cho 2 DB demo.
- Không chạy query này vào DB thật `sied_dev`, `vietprodev_sso`, hoặc DB production.
- Nếu chạy lại nhiều lần, query dùng `IF NOT EXISTS` nên không phá bảng đang có. Tuy nhiên phần seed dùng `ON CONFLICT` để tránh trùng dữ liệu.

## 2. Bảng được tạo

| Bảng/View | Mục đích |
|---|---|
| `users` | Thông tin user nội bộ project |
| `user_auth` | Password hash, login attempts, 2FA fields mô phỏng SIED |
| `roles` | Vai trò nội bộ project |
| `permissions` | Quyền nội bộ project |
| `user_roles` | Gán role cho user |
| `role_permissions` | Gán permission cho role |
| `user_sessions` | Session nội bộ, lưu token dạng `BYTEA` để mô phỏng encrypted/hashed token |
| `active_users` | View user active |
| `user_role_details` | View user + role |
| `user_sessions_detailed` | View session active + user info |

## 3. SQL schema chuẩn

```sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_last_activity_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  status user_status DEFAULT 'pending_verification',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]+$'),
  CONSTRAINT users_valid_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification'))
);

COMMENT ON TABLE users IS 'Basic user information table - authentication data stored in user_auth table';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS user_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  last_login_at TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  twofa_secret VARCHAR(255),
  twofa_backup_codes TEXT[],
  twofa_enabled BOOLEAN DEFAULT FALSE,
  twofa_method VARCHAR(20) DEFAULT 'totp',
  password_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_auth_twofa_method CHECK (twofa_method IN ('totp', 'sms', 'email'))
);

COMMENT ON TABLE user_auth IS 'User authentication data including passwords, login attempts, and 2FA information';
COMMENT ON COLUMN user_auth.password_hash IS 'Bcrypt/Argon2 hashed password for demo local login';
COMMENT ON COLUMN user_auth.login_attempts IS 'Failed login attempts counter';
COMMENT ON COLUMN user_auth.locked_until IS 'Account lockout timestamp';

DROP TRIGGER IF EXISTS update_user_auth_updated_at ON user_auth;
CREATE TRIGGER update_user_auth_updated_at
BEFORE UPDATE ON user_auth
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

COMMENT ON TABLE roles IS 'System roles for RBAC';

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(150) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  module VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

COMMENT ON TABLE permissions IS 'System permissions for RBAC';

DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
CREATE TRIGGER update_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Role-permission mappings';

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token BYTEA NOT NULL UNIQUE,
  refresh_token BYTEA NOT NULL UNIQUE,
  token_version INTEGER DEFAULT 1,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_sessions IS 'Active user sessions for token management';
COMMENT ON COLUMN user_sessions.session_token IS 'Encrypted or hashed JWT access token as BYTEA';
COMMENT ON COLUMN user_sessions.refresh_token IS 'Encrypted or hashed JWT refresh token as BYTEA';
COMMENT ON COLUMN user_sessions.token_version IS 'Token version for rotation';

DROP TRIGGER IF EXISTS update_user_sessions_activity ON user_sessions;
CREATE TRIGGER update_user_sessions_activity
BEFORE UPDATE ON user_sessions
FOR EACH ROW
EXECUTE FUNCTION update_last_activity_column();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE INDEX IF NOT EXISTS idx_user_auth_user_id ON user_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_user_auth_locked_until ON user_auth(locked_until);

CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_module_action ON permissions(module, action);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_version ON user_sessions(token_version);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token_hash ON user_sessions USING hash(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token_hash ON user_sessions USING hash(refresh_token);

CREATE OR REPLACE VIEW active_users AS
SELECT
  id,
  email,
  username,
  first_name,
  last_name,
  phone,
  avatar_url,
  status,
  created_at,
  updated_at
FROM users
WHERE status = 'active'
  AND deleted_at IS NULL;

CREATE OR REPLACE VIEW user_role_details AS
SELECT
  u.id AS user_id,
  u.email,
  u.username,
  u.first_name,
  u.last_name,
  r.id AS role_id,
  r.code AS role_code,
  r.name AS role_name,
  ur.assigned_at,
  ur.expires_at,
  ur.is_active
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.deleted_at IS NULL
  AND ur.is_active = TRUE
  AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP);

CREATE OR REPLACE VIEW user_sessions_detailed AS
SELECT
  us.id,
  us.user_id,
  us.session_token,
  us.refresh_token,
  us.token_version,
  us.device_info,
  us.ip_address,
  us.user_agent,
  us.expires_at,
  us.refresh_expires_at,
  us.is_active,
  us.created_at,
  us.last_activity_at,
  u.email,
  u.username,
  u.first_name,
  u.last_name
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = TRUE;

INSERT INTO roles(code, name, description, is_system)
VALUES
  ('admin', 'Administrator', 'Full access for demo project', TRUE),
  ('user', 'User', 'Default authenticated user', TRUE),
  ('editor', 'Editor', 'Can manage demo content', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions(code, name, module, action, description)
VALUES
  ('auth.login', 'Login', 'auth', 'login', 'Can login to demo project'),
  ('auth.logout', 'Logout', 'auth', 'logout', 'Can logout from demo project'),
  ('auth.refresh', 'Refresh Token', 'auth', 'refresh', 'Can refresh token'),
  ('user.read_self', 'Read Own Profile', 'user', 'read_self', 'Can read own profile'),
  ('admin.read_users', 'Read Users', 'admin', 'read_users', 'Can read users'),
  ('admin.manage_roles', 'Manage Roles', 'admin', 'manage_roles', 'Can manage roles')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('auth.login', 'auth.logout', 'auth.refresh', 'user.read_self')
WHERE r.code = 'user'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.code = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

WITH demo_user AS (
  INSERT INTO users(email, username, first_name, last_name, status)
  VALUES ('demo.user@example.com', 'demo_user', 'Demo', 'User', 'active')
  ON CONFLICT (email) DO UPDATE
  SET username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP
  RETURNING id
), demo_auth AS (
  INSERT INTO user_auth(user_id, password_hash)
  SELECT id, '$2b$10$demo.hash.placeholder.replace.in.code' FROM demo_user
  ON CONFLICT (user_id) DO NOTHING
  RETURNING user_id
)
INSERT INTO user_roles(user_id, role_id)
SELECT du.id, r.id
FROM demo_user du
JOIN roles r ON r.code = 'user'
ON CONFLICT (user_id, role_id) DO NOTHING;

WITH admin_user AS (
  INSERT INTO users(email, username, first_name, last_name, status)
  VALUES ('demo.admin@example.com', 'demo_admin', 'Demo', 'Admin', 'active')
  ON CONFLICT (email) DO UPDATE
  SET username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP
  RETURNING id
), admin_auth AS (
  INSERT INTO user_auth(user_id, password_hash)
  SELECT id, '$2b$10$demo.hash.placeholder.replace.in.code' FROM admin_user
  ON CONFLICT (user_id) DO NOTHING
  RETURNING user_id
)
INSERT INTO user_roles(user_id, role_id)
SELECT au.id, r.id
FROM admin_user au
JOIN roles r ON r.code = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

COMMIT;
```

## 4. Query kiểm tra sau khi chạy schema

Chạy trong từng database demo:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Kỳ vọng thấy các bảng/view chính:

```text
active_users
permissions
role_permissions
roles
user_auth
user_role_details
user_roles
user_sessions
user_sessions_detailed
users
```

Kiểm tra seed user:

```sql
SELECT id, email, username, status, created_at
FROM users
ORDER BY email;
```

Kiểm tra roles/permissions:

```sql
SELECT r.code AS role_code, p.code AS permission_code
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
ORDER BY r.code, p.code;
```

Kiểm tra view user-role:

```sql
SELECT * FROM user_role_details ORDER BY email, role_code;
```

## 5. Reset schema demo nếu cần

Chỉ chạy trong DB demo, không chạy trong DB thật:

```sql
DROP VIEW IF EXISTS user_sessions_detailed;
DROP VIEW IF EXISTS user_role_details;
DROP VIEW IF EXISTS active_users;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS user_auth;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS user_status;
```

Sau đó chạy lại SQL schema ở mục 3.
