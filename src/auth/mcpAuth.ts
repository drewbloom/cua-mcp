import { getPool } from '../db/postgres.js';
import { hashValue, isSameHash } from '../security/crypto.js';

export type McpAuthContext = {
  userId: string;
  email: string;
  apiKeyId: string;
  allowedConnectionIds: string[];
  requestId?: string;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry || '').trim()).filter(Boolean);
}

export async function authenticateMcpApiKey(rawKey: string): Promise<McpAuthContext | null> {
  const candidate = String(rawKey || '').trim();
  if (!candidate) return null;

  const prefix = candidate.slice(0, 8);
  const candidateHash = hashValue(candidate);
  const db = getPool();
  const res = await db.query(
    `
    SELECT k.id, k.user_id, k.key_hash, k.allowed_connection_ids_json, u.email
    FROM user_api_keys k
    JOIN users u ON u.id = k.user_id
    WHERE k.key_prefix = $1
      AND k.revoked_at IS NULL
    LIMIT 1
    `,
    [prefix],
  );

  if ((res.rowCount ?? 0) === 0) return null;
  const row = res.rows[0];
  if (!isSameHash(candidateHash, String(row.key_hash))) return null;

  await db.query('UPDATE user_api_keys SET last_used_at = NOW() WHERE id = $1', [row.id]);

  return {
    userId: String(row.user_id),
    email: String(row.email),
    apiKeyId: String(row.id),
    allowedConnectionIds: asStringArray(row.allowed_connection_ids_json),
  };
}