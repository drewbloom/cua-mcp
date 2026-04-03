import { getPool } from '../db/postgres.js';
import type { CuaUserSettings } from './types.js';

const DEFAULT_SETTINGS: Omit<CuaUserSettings, 'userId'> = {
  runRetentionDays: 30,
  zdrEnabled: false,
  persistRunEvents: true,
  persistRunOutput: true,
};

function toEffectiveSettings(row: any, userId: string): CuaUserSettings {
  const zdrEnabled = Boolean(row?.zdr_enabled);
  return {
    userId,
    runRetentionDays: Number(row?.run_retention_days || DEFAULT_SETTINGS.runRetentionDays),
    zdrEnabled,
    persistRunEvents: zdrEnabled ? false : row?.persist_run_events !== undefined ? Boolean(row.persist_run_events) : DEFAULT_SETTINGS.persistRunEvents,
    persistRunOutput: zdrEnabled ? false : row?.persist_run_output !== undefined ? Boolean(row.persist_run_output) : DEFAULT_SETTINGS.persistRunOutput,
  };
}

export async function getUserCuaSettings(userId: string): Promise<CuaUserSettings> {
  const db = getPool();
  const result = await db.query(
    `
    SELECT user_id, run_retention_days, zdr_enabled, persist_run_events, persist_run_output
    FROM user_cua_settings
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId],
  );

  if ((result.rowCount ?? 0) === 0) {
    return {
      userId,
      ...DEFAULT_SETTINGS,
    };
  }

  return toEffectiveSettings(result.rows[0], userId);
}

export async function updateUserCuaSettings(
  userId: string,
  input: Partial<Pick<CuaUserSettings, 'runRetentionDays' | 'zdrEnabled' | 'persistRunEvents' | 'persistRunOutput'>>,
): Promise<CuaUserSettings> {
  const current = await getUserCuaSettings(userId);
  const next: CuaUserSettings = {
    userId,
    runRetentionDays: Math.max(1, Math.min(365, Number(input.runRetentionDays ?? current.runRetentionDays))),
    zdrEnabled: input.zdrEnabled !== undefined ? Boolean(input.zdrEnabled) : current.zdrEnabled,
    persistRunEvents: input.persistRunEvents !== undefined ? Boolean(input.persistRunEvents) : current.persistRunEvents,
    persistRunOutput: input.persistRunOutput !== undefined ? Boolean(input.persistRunOutput) : current.persistRunOutput,
  };

  const db = getPool();
  await db.query(
    `
    INSERT INTO user_cua_settings (user_id, run_retention_days, zdr_enabled, persist_run_events, persist_run_output, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET run_retention_days = EXCLUDED.run_retention_days,
        zdr_enabled = EXCLUDED.zdr_enabled,
        persist_run_events = EXCLUDED.persist_run_events,
        persist_run_output = EXCLUDED.persist_run_output,
        updated_at = NOW()
    `,
    [
      userId,
      next.runRetentionDays,
      next.zdrEnabled,
      next.zdrEnabled ? false : next.persistRunEvents,
      next.zdrEnabled ? false : next.persistRunOutput,
    ],
  );

  return getUserCuaSettings(userId);
}