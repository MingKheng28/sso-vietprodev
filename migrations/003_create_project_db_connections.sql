CREATE TABLE IF NOT EXISTS project_db_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_code TEXT NOT NULL REFERENCES clients(app_code),
  provider TEXT NOT NULL DEFAULT 'postgresql',
  connection_string_env TEXT NOT NULL,
  user_table TEXT NOT NULL DEFAULT 'users',
  user_id_column TEXT NOT NULL DEFAULT 'id',
  email_column TEXT NOT NULL DEFAULT 'email',
  json_profile_column TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(app_code)
);
CREATE TABLE IF NOT EXISTS user_app_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sso_user_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  external_user_id TEXT NOT NULL,
  external_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, external_user_id)
);
