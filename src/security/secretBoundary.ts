import { getPool } from '../db/postgres.js';
import { config } from '../config.js';
import { decryptText, requireHex32ByteKey } from './crypto.js';

export type ConnectionPolicy = {
  id: string;
  user_id: string;
  name: string;
  base_host: string;
  allowed_hosts_json: unknown;
  allowed_path_prefixes_json: unknown;
  allow_subdomains: boolean;
  allow_any_path: boolean;
  status: string;
};

export type SecretFillPlan = {
  connectionId: string;
  targetUrl: string;
  resolved: Array<{
    secretType: string;
    secretRef: string;
    keyVersion: string;
  }>;
  missing: string[];
};

export type SecretExecutionArtifacts = {
  connectionId: string;
  connectionName: string;
  connectionBaseHost: string;
  targetUrl: string;
  authState: {
    id: string;
    stateType: string;
    plaintext: string;
    keyVersion: string;
  } | null;
  secrets: Array<{
    id: string;
    secretType: string;
    plaintext: string;
    keyVersion: string;
  }>;
  missing: string[];
};

function getMasterKey(): Buffer {
  return requireHex32ByteKey(config.secretMasterKeyHex, 'CUA_SECRET_MASTER_KEY');
}

export function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

export function normalizePathPrefix(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry || '').trim()).filter(Boolean);
}

function matchesHostPolicy(host: string, policy: ConnectionPolicy): boolean {
  const baseHost = normalizeHost(String(policy.base_host || ''));
  const allowedHosts = Array.from(
    new Set(
      [
        baseHost,
        ...asStringArray(policy.allowed_hosts_json).map(normalizeHost),
      ].filter(Boolean),
    ),
  );

  if (allowedHosts.includes(host)) {
    return true;
  }

  if (!policy.allow_subdomains || !baseHost) {
    return false;
  }

  return host.endsWith(`.${baseHost}`);
}

export function isUrlAllowedByPolicy(targetUrl: string, policy: ConnectionPolicy): boolean {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return false;
  }

  const host = normalizeHost(parsed.hostname);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return false;
  }

  if (!matchesHostPolicy(host, policy)) {
    return false;
  }

  if (policy.allow_any_path) {
    return true;
  }

  const prefixes = asStringArray(policy.allowed_path_prefixes_json)
    .map(normalizePathPrefix)
    .filter(Boolean);
  if (prefixes.length === 0) return true;
  return prefixes.some((prefix) => parsed.pathname.startsWith(prefix));
}

export async function getConnectionPolicyForUser(userId: string, connectionId: string): Promise<ConnectionPolicy | null> {
  const db = getPool();
  const res = await db.query(
    `
    SELECT id, user_id, name, base_host, allowed_hosts_json, allowed_path_prefixes_json, allow_subdomains, allow_any_path, status
    FROM connections
    WHERE id = $1 AND user_id = $2
    LIMIT 1
    `,
    [connectionId, userId],
  );
  if ((res.rowCount ?? 0) === 0) return null;
  return res.rows[0] as ConnectionPolicy;
}

export async function buildSecretFillPlan(
  userId: string,
  connectionId: string,
  targetUrl: string,
  requiredSecretTypes: string[],
): Promise<{ connection: ConnectionPolicy; plan: SecretFillPlan }> {
  const connection = await getConnectionPolicyForUser(userId, connectionId);
  if (!connection) {
    throw new Error('Connection not found');
  }
  if (String(connection.status || '').toLowerCase() !== 'active') {
    throw new Error('Connection is not active');
  }
  if (!isUrlAllowedByPolicy(targetUrl, connection)) {
    throw new Error('Target URL is not allowed for this connection policy');
  }

  const db = getPool();
  const secretRes = await db.query(
    `
    SELECT DISTINCT ON (secret_type) id, secret_type, key_version, created_at
    FROM secrets
    WHERE user_id = $1 AND connection_id = $2
    ORDER BY secret_type, created_at DESC
    `,
    [userId, connectionId],
  );

  const byType = new Map<string, { id: string; keyVersion: string }>();
  for (const row of secretRes.rows) {
    byType.set(String(row.secret_type), {
      id: String(row.id),
      keyVersion: String(row.key_version),
    });
  }

  const resolved = requiredSecretTypes
    .filter((type) => byType.has(type))
    .map((type) => ({
      secretType: type,
      secretRef: `sec_ref:${byType.get(type)!.id}`,
      keyVersion: byType.get(type)!.keyVersion,
    }));

  const missing = requiredSecretTypes.filter((type) => !byType.has(type));

  return {
    connection,
    plan: {
      connectionId,
      targetUrl,
      resolved,
      missing,
    },
  };
}

export async function resolveExecutionArtifacts(
  userId: string,
  connectionId: string,
  targetUrl: string,
  requiredSecretTypes: string[],
): Promise<SecretExecutionArtifacts> {
  const { connection, plan } = await buildSecretFillPlan(userId, connectionId, targetUrl, requiredSecretTypes);
  const db = getPool();

  const authStateRes = await db.query(
    `
    SELECT id, state_type, ciphertext, iv_hex, auth_tag_hex, key_version
    FROM auth_states
    WHERE user_id = $1
      AND connection_id = $2
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId, connectionId],
  );

  let authState: SecretExecutionArtifacts['authState'] = null;
  if ((authStateRes.rowCount ?? 0) > 0) {
    const row = authStateRes.rows[0];
    authState = {
      id: String(row.id),
      stateType: String(row.state_type),
      plaintext: decryptText(String(row.ciphertext), String(row.iv_hex), String(row.auth_tag_hex), getMasterKey()),
      keyVersion: String(row.key_version),
    };
    await db.query('UPDATE auth_states SET last_used_at = NOW() WHERE id = $1', [row.id]);
  }

  const secretIds = plan.resolved.map((entry) => entry.secretRef.replace(/^sec_ref:/, ''));
  const secrets: SecretExecutionArtifacts['secrets'] = [];
  if (secretIds.length > 0) {
    const secretRes = await db.query(
      `
      SELECT id, secret_type, ciphertext, iv_hex, auth_tag_hex, key_version
      FROM secrets
      WHERE user_id = $1 AND connection_id = $2 AND id = ANY($3::text[])
      `,
      [userId, connectionId, secretIds],
    );

    for (const row of secretRes.rows) {
      secrets.push({
        id: String(row.id),
        secretType: String(row.secret_type),
        plaintext: decryptText(String(row.ciphertext), String(row.iv_hex), String(row.auth_tag_hex), getMasterKey()),
        keyVersion: String(row.key_version),
      });
    }

    if (secretIds.length > 0) {
      await db.query('UPDATE secrets SET last_used_at = NOW() WHERE id = ANY($1::text[])', [secretIds]);
    }
  }

  return {
    connectionId,
    connectionName: String(connection.name || ''),
    connectionBaseHost: String(connection.base_host || ''),
    targetUrl,
    authState,
    secrets,
    missing: plan.missing,
  };
}
