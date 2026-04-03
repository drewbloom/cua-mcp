import { getPool } from './postgres.js';
import type { CuaEvent, CuaRecipe, CuaRunRecord } from '../cua/types.js';

function toDate(value: string): Date {
  return new Date(value);
}

function mapRunRow(row: any): Omit<CuaRunRecord, 'events'> {
  return {
    id: String(row.id),
    userId: String(row.user_id || ''),
    status: row.status,
    input: row.input_json,
    outputSummary: row.output_summary || undefined,
    error: row.error_text || undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  } as Omit<CuaRunRecord, 'events'>;
}

function mapEventRow(row: any): CuaEvent {
  return {
    timestamp: new Date(row.event_timestamp).toISOString(),
    type: String(row.event_type),
    payload: (row.payload_json || {}) as Record<string, unknown>,
  };
}

function mapRecipeRow(row: any): CuaRecipe {
  return {
    id: String(row.id),
    userId: String(row.user_id || ''),
    name: String(row.name),
    description: row.description || undefined,
    promptTemplate: String(row.prompt_template),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export const cuaRepository = {
  async upsertRun(run: CuaRunRecord): Promise<void> {
    const db = getPool();
    await db.query(
      `
      INSERT INTO cua_runs (id, user_id, status, input_json, output_summary, error_text, created_at, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          status = EXCLUDED.status,
          input_json = EXCLUDED.input_json,
          output_summary = EXCLUDED.output_summary,
          error_text = EXCLUDED.error_text,
          updated_at = EXCLUDED.updated_at
      `,
      [
        run.id,
        run.userId,
        run.status,
        JSON.stringify(run.input),
        run.outputSummary || null,
        run.error || null,
        toDate(run.createdAt),
        toDate(run.updatedAt),
      ],
    );
  },

  async appendEvent(runId: string, event: CuaEvent): Promise<void> {
    const db = getPool();
    await db.query(
      `
      INSERT INTO cua_run_events (run_id, event_timestamp, event_type, payload_json)
      VALUES ($1, $2, $3, $4::jsonb)
      `,
      [runId, toDate(event.timestamp), event.type, JSON.stringify(event.payload || {})],
    );
  },

  async getRun(runId: string, userId: string): Promise<CuaRunRecord | undefined> {
    const db = getPool();
    const runRes = await db.query('SELECT * FROM cua_runs WHERE id = $1 AND user_id = $2', [runId, userId]);
    if (runRes.rowCount === 0) return undefined;

    const evtRes = await db.query(
      'SELECT event_timestamp, event_type, payload_json FROM cua_run_events WHERE run_id = $1 ORDER BY id ASC',
      [runId],
    );

    const base = mapRunRow(runRes.rows[0]);
    return {
      ...base,
      events: evtRes.rows.map(mapEventRow),
    };
  },

  async listRuns(userId: string, limit: number = 50): Promise<CuaRunRecord[]> {
    const db = getPool();
    const runRes = await db.query(
      'SELECT * FROM cua_runs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );

    const runs: CuaRunRecord[] = [];
    for (const row of runRes.rows) {
      const runId = String(row.id);
      const evtRes = await db.query(
        'SELECT event_timestamp, event_type, payload_json FROM cua_run_events WHERE run_id = $1 ORDER BY id ASC',
        [runId],
      );
      const base = mapRunRow(row);
      runs.push({
        ...base,
        events: evtRes.rows.map(mapEventRow),
      });
    }
    return runs;
  },

  async deleteRun(runId: string, userId: string): Promise<boolean> {
    const db = getPool();
    const result = await db.query('DELETE FROM cua_runs WHERE id = $1 AND user_id = $2', [runId, userId]);
    return (result.rowCount ?? 0) > 0;
  },

  async cleanupExpiredRuns(userId: string, retentionDays: number): Promise<number> {
    const db = getPool();
    const result = await db.query(
      `
      DELETE FROM cua_runs
      WHERE user_id = $1
        AND created_at < NOW() - ($2 || ' days')::interval
      `,
      [userId, String(retentionDays)],
    );
    return Number(result.rowCount || 0);
  },

  async saveRecipe(recipe: CuaRecipe): Promise<void> {
    const db = getPool();
    await db.query(
      `
      INSERT INTO cua_recipes (id, user_id, name, description, prompt_template, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
      `,
      [recipe.id, recipe.userId, recipe.name, recipe.description || null, recipe.promptTemplate, toDate(recipe.createdAt)],
    );
  },

  async getRecipe(recipeId: string, userId: string): Promise<CuaRecipe | undefined> {
    const db = getPool();
    const res = await db.query('SELECT * FROM cua_recipes WHERE id = $1 AND user_id = $2', [recipeId, userId]);
    if (res.rowCount === 0) return undefined;
    return mapRecipeRow(res.rows[0]);
  },

  async listRecipes(userId: string, limit: number = 100): Promise<CuaRecipe[]> {
    const db = getPool();
    const res = await db.query('SELECT * FROM cua_recipes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [userId, limit]);
    return res.rows.map(mapRecipeRow);
  },
};
