CREATE TABLE auth_admin (
  singleton SMALLINT PRIMARY KEY CHECK (singleton = 1),
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL,
  config_fingerprint BYTEA NOT NULL CHECK (octet_length(config_fingerprint) = 32)
);
CREATE TABLE auth_passkey (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_admin(user_id),
  credential_id BYTEA NOT NULL UNIQUE,
  credential JSONB NOT NULL,
  format_version SMALLINT NOT NULL DEFAULT 1 CHECK (format_version = 1),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 64),
  created_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ
);
CREATE TABLE auth_session (
  token_hash BYTEA PRIMARY KEY CHECK (octet_length(token_hash) = 32),
  user_id UUID NOT NULL REFERENCES auth_admin(user_id),
  passkey_id UUID REFERENCES auth_passkey(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  authenticated_at TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL,
  CHECK (absolute_expires_at > created_at),
  CHECK (last_seen_at >= created_at AND authenticated_at >= created_at)
);
CREATE INDEX auth_session_expiry ON auth_session(absolute_expires_at);
CREATE INDEX auth_session_idle ON auth_session(last_seen_at);
CREATE INDEX auth_session_passkey ON auth_session(passkey_id);
