CREATE TABLE IF NOT EXISTS roles (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS permissions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS user_roles (user_id UUID REFERENCES users(id), role_id UUID REFERENCES roles(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(user_id, role_id));
CREATE TABLE IF NOT EXISTS role_permissions (role_id UUID REFERENCES roles(id), permission_id UUID REFERENCES permissions(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(role_id, permission_id));
