import { Pool } from 'pg';
import { config } from '../config.js';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required when CUA_PERSISTENCE=postgres.');
  }
  if (!pool) {
    pool = new Pool({ connectionString: config.databaseUrl });
  }
  return pool;
}

export async function initPostgres(): Promise<void> {
  if (config.persistence !== 'postgres') return;

  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS cua_runs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      input_json JSONB NOT NULL,
      output_summary TEXT NULL,
      error_text TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cua_run_events (
      id BIGSERIAL PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES cua_runs(id) ON DELETE CASCADE,
      event_timestamp TIMESTAMPTZ NOT NULL,
      event_type TEXT NOT NULL,
      payload_json JSONB NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cua_run_events_run_id_id
      ON cua_run_events(run_id, id);

    CREATE TABLE IF NOT EXISTS cua_recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NULL,
      prompt_template TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_login_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempt_count INTEGER NOT NULL,
      max_attempts INTEGER NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_auth_login_codes_email_created
      ON auth_login_codes(email, created_at DESC);

    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      last_seen_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ NULL,
      user_agent TEXT NULL,
      ip_address TEXT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
      ON user_sessions(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      base_host TEXT NOT NULL,
      allowed_hosts_json JSONB NOT NULL,
      allowed_path_prefixes_json JSONB NOT NULL,
      auth_method TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_connections_user_id
      ON connections(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS user_api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      allowed_connection_ids_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      last_used_at TIMESTAMPTZ NULL,
      revoked_at TIMESTAMPTZ NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id
      ON user_api_keys(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS secret_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS secrets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
      secret_profile_id TEXT NULL REFERENCES secret_profiles(id) ON DELETE SET NULL,
      secret_type TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv_hex TEXT NOT NULL,
      auth_tag_hex TEXT NOT NULL,
      key_version TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      last_used_at TIMESTAMPTZ NULL
    );

    CREATE INDEX IF NOT EXISTS idx_secrets_user_connection
      ON secrets(user_id, connection_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS auth_states (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
      state_type TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv_hex TEXT NOT NULL,
      auth_tag_hex TEXT NOT NULL,
      key_version TEXT NOT NULL,
      expires_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      last_used_at TIMESTAMPTZ NULL
    );

    CREATE INDEX IF NOT EXISTS idx_auth_states_user_connection
      ON auth_states(user_id, connection_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS security_audit_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      event_scope TEXT NOT NULL,
      details_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_scope
      ON security_audit_logs(user_id, event_scope, created_at DESC);
  `);
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}
