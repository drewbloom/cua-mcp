import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { initPostgres, getPool } from '../db/postgres.js';
import { cuaRepository } from '../db/cuaRepository.js';
import type { CuaRunRecord } from '../cua/types.js';

function nowIso(): string {
  return new Date().toISOString();
}

async function main(): Promise<void> {
  if (config.persistence !== 'postgres') {
    throw new Error('CUA_PERSISTENCE must be set to postgres for this smoke test.');
  }
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required for postgres smoke test.');
  }

  await initPostgres();

  const runId = `smoke-${randomUUID()}`;
  const recipeId = `smoke-${randomUUID()}`;
  const timestamp = nowIso();

  const run: CuaRunRecord = {
    id: runId,
    status: 'running',
    input: {
      task: 'postgres smoke test run',
      environment: 'web',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    events: [],
  };

  await cuaRepository.upsertRun(run);
  await cuaRepository.appendEvent(runId, {
    timestamp: nowIso(),
    type: 'smoke_event',
    payload: {
      source: 'postgresSmoke',
      ok: true,
    },
  });

  await cuaRepository.saveRecipe({
    id: recipeId,
    name: 'smoke recipe',
    description: 'repository persistence smoke test',
    promptTemplate: 'open {{url}} and summarize',
    createdAt: nowIso(),
  });

  const persistedRun = await cuaRepository.getRun(runId);
  const persistedRecipe = await cuaRepository.getRecipe(recipeId);

  if (!persistedRun) {
    throw new Error('Smoke test failed: run not found after insert.');
  }
  if (!persistedRecipe) {
    throw new Error('Smoke test failed: recipe not found after insert.');
  }
  if (persistedRun.events.length === 0) {
    throw new Error('Smoke test failed: run events were not persisted.');
  }

  const db = getPool();
  const counts = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM cua_runs) AS run_count,
      (SELECT COUNT(*)::int FROM cua_run_events) AS event_count,
      (SELECT COUNT(*)::int FROM cua_recipes) AS recipe_count
  `);

  const summary = {
    ok: true,
    runId,
    recipeId,
    counts: counts.rows[0],
    detail: 'Postgres persistence is working for runs, events, and recipes.',
  };

  console.log(JSON.stringify(summary, null, 2));
  await db.end();
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
});
