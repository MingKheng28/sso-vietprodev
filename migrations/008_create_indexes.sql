-- Migration: 008_create_indexes.sql
-- Performance indexes for commonly queried columns across all tables.

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status) WHERE status != 'active';
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_app_code ON clients (app_code);
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON clients (client_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status) WHERE status != 'active';

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
-- Note: Partial index with time predicate (expires_at > NOW()) is not supported
-- because NOW() is not IMMUTABLE. Use regular index + query filter instead.

-- Refresh tokens table indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens (expires_at) WHERE revoked_at IS NULL;
-- Note: Partial index on expires_at with time predicate removed.
-- For expired rows cleanup, use a scheduled job instead.

-- Project DB connections indexes
CREATE INDEX IF NOT EXISTS idx_project_db_connections_app_code ON project_db_connections (app_code);
CREATE INDEX IF NOT EXISTS idx_project_db_connections_status ON project_db_connections (status) WHERE status != 'active';

-- Login attempts (redundant with 007_create_login_attempts but idempotent)
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_lower ON login_attempts (lower(email));
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until ON login_attempts (locked_until) WHERE locked_until IS NOT NULL;
