CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_code TEXT UNIQUE NOT NULL,
  client_id TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT,
  name TEXT NOT NULL,
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  post_logout_redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  grant_types TEXT[] NOT NULL DEFAULT '{authorization_code,refresh_token}',
  response_types TEXT[] NOT NULL DEFAULT '{code}',
  scopes TEXT[] NOT NULL DEFAULT '{openid,profile,email}',
  token_endpoint_auth_method TEXT NOT NULL DEFAULT 'none',
  require_pkce BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
