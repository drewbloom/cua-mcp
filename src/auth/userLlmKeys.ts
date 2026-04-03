import { getPool } from '../db/postgres.js';
import { config } from '../config.js';
import { decryptText, requireHex32ByteKey } from '../security/crypto.js';

function getMasterKey(): Buffer {
  return requireHex32ByteKey(config.secretMasterKeyHex, 'CUA_SECRET_MASTER_KEY');
}

export async function getActiveOpenAiApiKeyForUser(userId: string): Promise<string | null> {
  const db = getPool();
  const res = await db.query(
    `
    SELECT ciphertext, iv_hex, auth_tag_hex
    FROM user_llm_keys
    WHERE user_id = $1
      AND provider = 'openai'
      AND is_active = TRUE
      AND revoked_at IS NULL
    LIMIT 1
    `,
    [userId],
  );

  if ((res.rowCount ?? 0) === 0) return null;
  const row = res.rows[0];
  const plaintext = decryptText(String(row.ciphertext), String(row.iv_hex), String(row.auth_tag_hex), getMasterKey());
  await db.query('UPDATE user_llm_keys SET last_used_at = NOW() WHERE user_id = $1 AND provider = $2 AND is_active = TRUE AND revoked_at IS NULL', [userId, 'openai']);
  return plaintext;
}