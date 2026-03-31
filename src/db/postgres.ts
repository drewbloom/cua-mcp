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
  `);
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}
