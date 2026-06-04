-- Migration: 007_create_login_attempts.sql
-- Tracks login attempts for brute-force protection and account lockout.

CREATE TABLE IF NOT EXISTS login_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  user_id       UUID,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  locked_until  TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_login_attempts_email_lower
  ON login_attempts (lower(email));

CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until
  ON login_attempts (locked_until)
  WHERE locked_until IS NOT NULL;

COMMENT ON TABLE login_attempts IS 'Tracks failed login attempts for brute-force protection and temporary account lockout.';
COMMENT ON COLUMN login_attempts.locked_until IS 'Set when account is temporarily locked after too many failed attempts. NULL means not locked.';
