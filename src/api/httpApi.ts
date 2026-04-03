import type { IncomingMessage, ServerResponse } from 'node:http';
import { createCipheriv, createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { URL } from 'node:url';
import { getPool } from '../db/postgres.js';
import { config } from '../config.js';

type JsonObject = Record<string, unknown>;

type AuthContext = {
  userId: string;
  email: string;
  sessionId: string;
};

type ConnectionPolicy = {
  id: string;
  user_id: string;
  base_host: string;
  allowed_hosts_json: unknown;
  allowed_path_prefixes_json: unknown;
  status: string;
};

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function parseCookies(request: IncomingMessage): Record<string, string> {
  const cookieHeader = String(request.headers.cookie || '');
  if (!cookieHeader) return {};
  const output: Record<string, string> = {};

  for (const pair of cookieHeader.split(';')) {
    const [rawKey, ...rawVal] = pair.split('=');
    const key = rawKey.trim();
    const value = rawVal.join('=').trim();
    if (!key) continue;
    output[key] = decodeURIComponent(value);
  }

  return output;
}

async function readJsonBody(request: IncomingMessage): Promise<JsonObject> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }

  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON body must be an object');
  }
  return parsed as JsonObject;
}

function writeJson(response: ServerResponse, status: number, body: JsonObject, extraHeaders: Record<string, string> = {}): void {
  response.writeHead(status, {
    'content-type': 'application/json',
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
}

function writeApiUnauthorized(response: ServerResponse): void {
  writeJson(response, 401, {
    error: 'Unauthorized',
    message: 'Session required.',
  });
}

function isSameHash(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, 'hex');
  const right = Buffer.from(rightHex, 'hex');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function getAuthContext(request: IncomingMessage): Promise<AuthContext | null> {
  const cookies = parseCookies(request);
  const token = cookies[config.sessionCookieName];
  if (!token) return null;

  const tokenHash = hashValue(token);
  const db = getPool();
  const res = await db.query(
    `
    SELECT s.id, s.user_id, u.email, s.expires_at, s.revoked_at
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token_hash = $1
    LIMIT 1
    `,
    [tokenHash],
  );

  if ((res.rowCount ?? 0) === 0) return null;
  const row = res.rows[0];
  if (row.revoked_at) return null;
  const expiresAt = new Date(row.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  await db.query('UPDATE user_sessions SET last_seen_at = NOW() WHERE id = $1', [row.id]);

  return {
    userId: String(row.user_id),
    email: String(row.email),
    sessionId: String(row.id),
  };
}

function buildSessionCookie(token: string, clear: boolean = false): string {
  const secure = config.nodeEnv === 'production' ? '; Secure' : '';
  const maxAge = clear ? 0 : config.sessionTtlDays * 24 * 60 * 60;
  const value = clear ? '' : encodeURIComponent(token);
  return `${config.sessionCookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function normalizeEmail(raw: unknown): string {
  return String(raw || '').trim().toLowerCase();
}

function requireString(value: unknown, field: string): string {
  const out = String(value || '').trim();
  if (!out) {
    throw new Error(`${field} is required`);
  }
  return out;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || '').trim())
    .filter(Boolean);
}

function toBase64Url(value: Buffer): string {
  return value.toString('base64url');
}

function isHex32ByteKey(value: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(value);
}

function requireSecretMasterKey(): Buffer {
  const raw = String(config.secretMasterKeyHex || '').trim();
  if (!isHex32ByteKey(raw)) {
    throw new Error('CUA_SECRET_MASTER_KEY must be a 64-char hex string for secret encryption.');
  }
  return Buffer.from(raw, 'hex');
}

function encryptSecretValue(plaintext: string): { ciphertext: string; ivHex: string; authTagHex: string; keyVersion: string } {
  const key = requireSecretMasterKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('base64'),
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    keyVersion: 'v1',
  };
}

function redactAuditDetails(details: JsonObject): JsonObject {
  const redact = (value: unknown, keyHint?: string): unknown => {
    const loweredKey = String(keyHint || '').toLowerCase();
    const shouldRedact =
      loweredKey.includes('secret') ||
      loweredKey.includes('password') ||
      loweredKey.includes('token') ||
      loweredKey.includes('cookie') ||
      loweredKey.includes('code') ||
      loweredKey.includes('otp') ||
      loweredKey.includes('ciphertext');

    if (shouldRedact) return '[REDACTED]';

    if (Array.isArray(value)) {
      return value.map((entry) => redact(entry));
    }
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        out[key] = redact(child, key);
      }
      return out;
    }
    if (typeof value === 'string' && value.length > 512) {
      return `${value.slice(0, 128)}...[TRUNCATED]`;
    }
    return value;
  };

  return redact(details) as JsonObject;
}

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

function normalizePathPrefix(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function isUrlAllowedByPolicy(targetUrl: string, policy: ConnectionPolicy): boolean {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return false;
  }

  const host = normalizeHost(parsed.hostname);
  const allowedHosts = Array.from(
    new Set(
      [
        normalizeHost(String(policy.base_host || '')),
        ...asStringArray(policy.allowed_hosts_json).map(normalizeHost),
      ].filter(Boolean),
    ),
  );
  if (!allowedHosts.includes(host)) {
    return false;
  }

  const prefixes = asStringArray(policy.allowed_path_prefixes_json)
    .map(normalizePathPrefix)
    .filter(Boolean);
  if (prefixes.length === 0) return true;
  return prefixes.some((prefix) => parsed.pathname.startsWith(prefix));
}

const accountApiPaths = [
  '/api/auth/request-code',
  '/api/auth/verify-code',
  '/api/session/me',
  '/api/session/logout',
  '/api/keys',
  '/api/connections',
];

function accountApiPathAllowed(pathname: string): boolean {
  if (accountApiPaths.includes(pathname)) return true;
  if (/^\/api\/keys\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/secrets$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/secrets\/[^/]+$/.test(pathname)) return true;
  if (pathname === '/api/cua/secret-fill-plan') return true;
  return false;
}

function secretApiPathAllowed(pathname: string): boolean {
  if (/^\/api\/connections\/[^/]+\/secrets$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/secrets\/[^/]+$/.test(pathname)) return true;
  if (pathname === '/api/cua/secret-fill-plan') return true;
  return false;
}

async function getConnectionForUser(userId: string, connectionId: string): Promise<ConnectionPolicy | null> {
  const db = getPool();
  const res = await db.query(
    `
    SELECT id, user_id, base_host, allowed_hosts_json, allowed_path_prefixes_json, status
    FROM connections
    WHERE id = $1 AND user_id = $2
    LIMIT 1
    `,
    [connectionId, userId],
  );
  if ((res.rowCount ?? 0) === 0) return null;
  return res.rows[0] as ConnectionPolicy;
}

async function upsertUser(email: string, displayName?: string): Promise<{ id: string; email: string; displayName: string | null }> {
  const db = getPool();
  const existing = await db.query('SELECT id, email, display_name FROM users WHERE email = $1 LIMIT 1', [email]);
  if ((existing.rowCount ?? 0) > 0) {
    const row = existing.rows[0];
    if (displayName && displayName !== row.display_name) {
      await db.query('UPDATE users SET display_name = $2, updated_at = NOW() WHERE id = $1', [row.id, displayName]);
      row.display_name = displayName;
    }
    return {
      id: String(row.id),
      email: String(row.email),
      displayName: row.display_name ? String(row.display_name) : null,
    };
  }

  const id = randomUUID();
  await db.query(
    'INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
    [id, email, displayName || null],
  );
  return {
    id,
    email,
    displayName: displayName || null,
  };
}

async function logSecurityEvent(userId: string | null, eventType: string, eventScope: string, details: JsonObject): Promise<void> {
  const db = getPool();
  await db.query(
    'INSERT INTO security_audit_logs (user_id, event_type, event_scope, details_json, created_at) VALUES ($1, $2, $3, $4::jsonb, NOW())',
    [userId, eventType, eventScope, JSON.stringify(redactAuditDetails(details))],
  );
}

async function handleConnectionSecretsList(request: IncomingMessage, response: ServerResponse, connectionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const connection = await getConnectionForUser(auth.userId, connectionId);
  if (!connection) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }

  const db = getPool();
  const res = await db.query(
    `
    SELECT id, secret_type, key_version, created_at, updated_at, last_used_at
    FROM secrets
    WHERE user_id = $1 AND connection_id = $2
    ORDER BY created_at DESC
    `,
    [auth.userId, connectionId],
  );

  writeJson(response, 200, {
    secrets: res.rows.map((row) => ({
      id: String(row.id),
      reference: `sec_ref:${row.id}`,
      secretType: String(row.secret_type),
      keyVersion: String(row.key_version),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at).toISOString() : null,
    })),
  });
}

async function handleConnectionSecretsCreate(request: IncomingMessage, response: ServerResponse, connectionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const connection = await getConnectionForUser(auth.userId, connectionId);
  if (!connection) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }

  const body = await readJsonBody(request);
  const secretType = requireString(body.secretType, 'secretType').toLowerCase();
  const secretValue = requireString(body.secretValue, 'secretValue');
  const secretProfileId = String(body.secretProfileId || '').trim() || null;

  const allowedTypes = new Set(['username', 'password', 'otp', 'api_token', 'cookie_bundle']);
  if (!allowedTypes.has(secretType)) {
    writeJson(response, 400, { error: 'Invalid secretType' });
    return;
  }

  const encrypted = encryptSecretValue(secretValue);
  const secretId = randomUUID();
  const db = getPool();
  await db.query(
    `
    INSERT INTO secrets (
      id, user_id, connection_id, secret_profile_id, secret_type,
      ciphertext, iv_hex, auth_tag_hex, key_version,
      created_at, updated_at, last_used_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NULL)
    `,
    [
      secretId,
      auth.userId,
      connectionId,
      secretProfileId,
      secretType,
      encrypted.ciphertext,
      encrypted.ivHex,
      encrypted.authTagHex,
      encrypted.keyVersion,
    ],
  );

  await logSecurityEvent(auth.userId, 'secret_created', 'secret', {
    connectionId,
    secretId,
    secretType,
  });

  writeJson(response, 200, {
    success: true,
    secret: {
      id: secretId,
      reference: `sec_ref:${secretId}`,
      secretType,
      keyVersion: encrypted.keyVersion,
      createdAt: new Date().toISOString(),
    },
  });
}

async function handleConnectionSecretsDelete(request: IncomingMessage, response: ServerResponse, connectionId: string, secretId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const connection = await getConnectionForUser(auth.userId, connectionId);
  if (!connection) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }

  const db = getPool();
  const res = await db.query(
    'DELETE FROM secrets WHERE id = $1 AND user_id = $2 AND connection_id = $3 RETURNING id',
    [secretId, auth.userId, connectionId],
  );
  if ((res.rowCount ?? 0) === 0) {
    writeJson(response, 404, { error: 'Secret not found' });
    return;
  }

  await logSecurityEvent(auth.userId, 'secret_deleted', 'secret', {
    connectionId,
    secretId,
  });

  writeJson(response, 200, { success: true });
}

async function handleCuaSecretFillPlan(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const body = await readJsonBody(request);
  const connectionId = requireString(body.connectionId, 'connectionId');
  const targetUrl = requireString(body.targetUrl, 'targetUrl');
  const requiredSecretTypes = Array.from(new Set(asStringArray(body.requiredSecretTypes).map((v) => v.toLowerCase())));

  const connection = await getConnectionForUser(auth.userId, connectionId);
  if (!connection) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }
  if (String(connection.status || '').toLowerCase() !== 'active') {
    writeJson(response, 409, { error: 'Connection is not active' });
    return;
  }
  if (!isUrlAllowedByPolicy(targetUrl, connection)) {
    await logSecurityEvent(auth.userId, 'secret_fill_denied_url', 'secret_execution', {
      connectionId,
      targetUrl,
      requiredSecretTypes,
    });
    writeJson(response, 403, { error: 'Target URL is not allowed for this connection policy' });
    return;
  }

  const db = getPool();
  const secretRes = await db.query(
    `
    SELECT DISTINCT ON (secret_type) id, secret_type, key_version, created_at
    FROM secrets
    WHERE user_id = $1 AND connection_id = $2
    ORDER BY secret_type, created_at DESC
    `,
    [auth.userId, connectionId],
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

  await logSecurityEvent(auth.userId, 'secret_fill_plan_requested', 'secret_execution', {
    connectionId,
    targetUrl,
    requiredSecretTypes,
    resolvedTypes: resolved.map((entry) => entry.secretType),
    missingTypes: missing,
  });

  writeJson(response, 200, {
    success: missing.length === 0,
    connectionId,
    targetUrl,
    resolved,
    missing,
    note:
      missing.length === 0
        ? 'Secret fill plan ready. CUA can use secret refs on this allowed URL.'
        : 'Some required secret types are missing; user should add connection secrets before headless auth tasks.',
  });
}

async function handleAuthRequestCode(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  if (!email || !email.includes('@')) {
    writeJson(response, 400, { error: 'Invalid email' });
    return;
  }

  const displayName = String(body.displayName || '').trim() || null;
  const user = await upsertUser(email, displayName || undefined);
  const code = String(randomInt(100000, 1000000));
  const codeHash = hashValue(code);

  const db = getPool();
  await db.query(
    `
    INSERT INTO auth_login_codes (id, user_id, email, code_hash, attempt_count, max_attempts, expires_at, consumed_at, created_at)
    VALUES ($1, $2, $3, $4, 0, $5, NOW() + ($6 || ' minutes')::interval, NULL, NOW())
    `,
    [randomUUID(), user.id, email, codeHash, config.otpMaxAttempts, String(config.otpTtlMinutes)],
  );

  await logSecurityEvent(user.id, 'otp_requested', 'auth', { email });
  console.log(`[auth] OTP for ${email}: ${code}`);

  writeJson(response, 200, {
    success: true,
    message: 'Login code generated. Delivery provider not configured; code logged server-side for development.',
  });
}

async function handleAuthVerifyCode(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const code = requireString(body.code, 'code');

  const db = getPool();
  const codeRes = await db.query(
    `
    SELECT id, user_id, code_hash, attempt_count, max_attempts, expires_at, consumed_at
    FROM auth_login_codes
    WHERE email = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [email],
  );

  if ((codeRes.rowCount ?? 0) === 0) {
    writeJson(response, 401, { error: 'Invalid code' });
    return;
  }

  const row = codeRes.rows[0];
  if (row.consumed_at) {
    writeJson(response, 401, { error: 'Code already used' });
    return;
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    writeJson(response, 401, { error: 'Code expired' });
    return;
  }

  if (Number(row.attempt_count) >= Number(row.max_attempts)) {
    writeJson(response, 429, { error: 'Too many attempts' });
    return;
  }

  const matches = isSameHash(hashValue(code), String(row.code_hash));
  if (!matches) {
    await db.query('UPDATE auth_login_codes SET attempt_count = attempt_count + 1 WHERE id = $1', [row.id]);
    writeJson(response, 401, { error: 'Invalid code' });
    return;
  }

  await db.query('UPDATE auth_login_codes SET consumed_at = NOW() WHERE id = $1', [row.id]);

  const sessionToken = randomBytes(24).toString('hex');
  const sessionTokenHash = hashValue(sessionToken);
  const sessionId = randomUUID();

  await db.query(
    `
    INSERT INTO user_sessions (id, user_id, session_token_hash, expires_at, created_at, last_seen_at, revoked_at, user_agent, ip_address)
    VALUES ($1, $2, $3, NOW() + ($4 || ' days')::interval, NOW(), NOW(), NULL, $5, $6)
    `,
    [
      sessionId,
      row.user_id,
      sessionTokenHash,
      String(config.sessionTtlDays),
      String(request.headers['user-agent'] || ''),
      String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || ''),
    ],
  );

  const userRes = await db.query('SELECT id, email, display_name FROM users WHERE id = $1 LIMIT 1', [row.user_id]);
  const user = userRes.rows[0];

  await logSecurityEvent(String(row.user_id), 'session_started', 'auth', { sessionId });

  writeJson(
    response,
    200,
    {
      success: true,
      user: {
        id: String(user.id),
        email: String(user.email),
        displayName: user.display_name ? String(user.display_name) : null,
      },
    },
    {
      'set-cookie': buildSessionCookie(sessionToken),
    },
  );
}

async function handleSessionMe(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await getAuthContext(request);
  if (!auth) {
    writeApiUnauthorized(response);
    return;
  }

  const db = getPool();
  const userRes = await db.query('SELECT id, email, display_name, created_at FROM users WHERE id = $1 LIMIT 1', [auth.userId]);
  const user = userRes.rows[0];

  writeJson(response, 200, {
    authenticated: true,
    user: {
      id: String(user.id),
      email: String(user.email),
      displayName: user.display_name ? String(user.display_name) : null,
      createdAt: new Date(user.created_at).toISOString(),
    },
  });
}

async function handleSessionLogout(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await getAuthContext(request);
  if (auth) {
    const db = getPool();
    await db.query('UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1', [auth.sessionId]);
    await logSecurityEvent(auth.userId, 'session_revoked', 'auth', { sessionId: auth.sessionId });
  }

  writeJson(
    response,
    200,
    { success: true },
    {
      'set-cookie': buildSessionCookie('', true),
    },
  );
}

async function requireAuth(request: IncomingMessage, response: ServerResponse): Promise<AuthContext | null> {
  const auth = await getAuthContext(request);
  if (!auth) {
    writeApiUnauthorized(response);
    return null;
  }
  return auth;
}

async function handleApiKeysList(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const db = getPool();
  const res = await db.query(
    `
    SELECT id, name, key_prefix, allowed_connection_ids_json, created_at, last_used_at, revoked_at
    FROM user_api_keys
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [auth.userId],
  );

  writeJson(response, 200, {
    apiKeys: res.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      keyPrefix: String(row.key_prefix),
      allowedConnectionIds: row.allowed_connection_ids_json || [],
      createdAt: new Date(row.created_at).toISOString(),
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at).toISOString() : null,
      revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    })),
  });
}

async function handleApiKeysCreate(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const body = await readJsonBody(request);
  const name = requireString(body.name, 'name');
  const allowedConnectionIds = asStringArray(body.allowedConnectionIds);

  const rawKey = randomBytes(24).toString('hex');
  const keyPrefix = rawKey.slice(0, 8);
  const keyHash = hashValue(rawKey);
  const apiKeyId = randomUUID();

  const db = getPool();
  await db.query(
    `
    INSERT INTO user_api_keys (id, user_id, name, key_prefix, key_hash, allowed_connection_ids_json, created_at, last_used_at, revoked_at)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW(), NULL, NULL)
    `,
    [apiKeyId, auth.userId, name, keyPrefix, keyHash, JSON.stringify(allowedConnectionIds)],
  );

  await logSecurityEvent(auth.userId, 'api_key_created', 'api_key', { apiKeyId, keyPrefix });

  writeJson(response, 200, {
    success: true,
    apiKey: {
      id: apiKeyId,
      name,
      keyPrefix,
      allowedConnectionIds,
      createdAt: new Date().toISOString(),
    },
    secret: rawKey,
    note: 'Store this key now. It is only returned once.',
  });
}

async function handleApiKeysRevoke(request: IncomingMessage, response: ServerResponse, apiKeyId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const db = getPool();
  const res = await db.query(
    'UPDATE user_api_keys SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL RETURNING id',
    [apiKeyId, auth.userId],
  );

  if ((res.rowCount ?? 0) === 0) {
    writeJson(response, 404, { error: 'API key not found' });
    return;
  }

  await logSecurityEvent(auth.userId, 'api_key_revoked', 'api_key', { apiKeyId });
  writeJson(response, 200, { success: true });
}

async function handleConnectionsList(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const db = getPool();
  const res = await db.query(
    `
    SELECT id, name, base_host, allowed_hosts_json, allowed_path_prefixes_json, auth_method, status, created_at, updated_at
    FROM connections
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [auth.userId],
  );

  writeJson(response, 200, {
    connections: res.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      baseHost: String(row.base_host),
      allowedHosts: row.allowed_hosts_json || [],
      allowedPathPrefixes: row.allowed_path_prefixes_json || [],
      authMethod: String(row.auth_method),
      status: String(row.status),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    })),
  });
}

async function handleConnectionsCreate(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const body = await readJsonBody(request);
  const name = requireString(body.name, 'name');
  const baseHost = requireString(body.baseHost, 'baseHost').toLowerCase();
  const allowedHosts = asStringArray(body.allowedHosts).map((host) => host.toLowerCase());
  const allowedPathPrefixes = asStringArray(body.allowedPathPrefixes);
  const authMethod = String(body.authMethod || 'oauth').trim().toLowerCase() || 'oauth';

  const dedupHosts = Array.from(new Set([baseHost, ...allowedHosts]));
  const dedupPaths = Array.from(new Set(allowedPathPrefixes));

  const connectionId = randomUUID();
  const db = getPool();
  await db.query(
    `
    INSERT INTO connections (
      id, user_id, name, base_host, allowed_hosts_json, allowed_path_prefixes_json, auth_method, status, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, 'active', NOW(), NOW())
    `,
    [connectionId, auth.userId, name, baseHost, JSON.stringify(dedupHosts), JSON.stringify(dedupPaths), authMethod],
  );

  await logSecurityEvent(auth.userId, 'connection_created', 'connection', {
    connectionId,
    baseHost,
    authMethod,
  });

  writeJson(response, 200, {
    success: true,
    connection: {
      id: connectionId,
      name,
      baseHost,
      allowedHosts: dedupHosts,
      allowedPathPrefixes: dedupPaths,
      authMethod,
      status: 'active',
    },
  });
}

async function handleConnectionPatch(request: IncomingMessage, response: ServerResponse, connectionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const body = await readJsonBody(request);
  const updates: string[] = [];
  const values: unknown[] = [];

  const setJson = (column: string, value: unknown) => {
    updates.push(`${column} = $${values.length + 1}::jsonb`);
    values.push(JSON.stringify(value));
  };

  if (body.name !== undefined) {
    updates.push(`name = $${values.length + 1}`);
    values.push(requireString(body.name, 'name'));
  }
  if (body.allowedHosts !== undefined) {
    const hosts = Array.from(new Set(asStringArray(body.allowedHosts).map((host) => host.toLowerCase())));
    setJson('allowed_hosts_json', hosts);
  }
  if (body.allowedPathPrefixes !== undefined) {
    const paths = Array.from(new Set(asStringArray(body.allowedPathPrefixes)));
    setJson('allowed_path_prefixes_json', paths);
  }
  if (body.status !== undefined) {
    const status = String(body.status || '').trim().toLowerCase();
    if (!['active', 'paused', 'disabled'].includes(status)) {
      writeJson(response, 400, { error: 'Invalid status' });
      return;
    }
    updates.push(`status = $${values.length + 1}`);
    values.push(status);
  }

  if (updates.length === 0) {
    writeJson(response, 400, { error: 'No updatable fields provided' });
    return;
  }

  updates.push('updated_at = NOW()');

  const db = getPool();
  const sql = `
    UPDATE connections
    SET ${updates.join(', ')}
    WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
    RETURNING id, name, base_host, allowed_hosts_json, allowed_path_prefixes_json, auth_method, status, created_at, updated_at
  `;

  const res = await db.query(sql, [...values, connectionId, auth.userId]);
  if ((res.rowCount ?? 0) === 0) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }

  await logSecurityEvent(auth.userId, 'connection_updated', 'connection', { connectionId, fields: updates });

  const row = res.rows[0];
  writeJson(response, 200, {
    success: true,
    connection: {
      id: String(row.id),
      name: String(row.name),
      baseHost: String(row.base_host),
      allowedHosts: row.allowed_hosts_json || [],
      allowedPathPrefixes: row.allowed_path_prefixes_json || [],
      authMethod: String(row.auth_method),
      status: String(row.status),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    },
  });
}

export async function handleApiRequest(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean> {
  if (!url.pathname.startsWith('/api/')) {
    return false;
  }

  if (!config.enableAccountApi && accountApiPathAllowed(url.pathname)) {
    writeJson(response, 404, {
      error: 'Not Found',
      message: 'Account API is disabled. Set CUA_ENABLE_ACCOUNT_API=true to enable.',
    });
    return true;
  }

  if (!config.enableSecretApi && secretApiPathAllowed(url.pathname)) {
    writeJson(response, 404, {
      error: 'Not Found',
      message: 'Secret API is disabled. Set CUA_ENABLE_SECRET_API=true to enable.',
    });
    return true;
  }

  const origin = config.frontendOrigin || '*';
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.writeHead(204).end();
    return true;
  }

  try {
    if (request.method === 'POST' && url.pathname === '/api/auth/request-code') {
      await handleAuthRequestCode(request, response);
      return true;
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/verify-code') {
      await handleAuthVerifyCode(request, response);
      return true;
    }
    if (request.method === 'GET' && url.pathname === '/api/session/me') {
      await handleSessionMe(request, response);
      return true;
    }
    if (request.method === 'POST' && url.pathname === '/api/session/logout') {
      await handleSessionLogout(request, response);
      return true;
    }

    if (request.method === 'GET' && url.pathname === '/api/keys') {
      await handleApiKeysList(request, response);
      return true;
    }
    if (request.method === 'POST' && url.pathname === '/api/keys') {
      await handleApiKeysCreate(request, response);
      return true;
    }

    const keyMatch = url.pathname.match(/^\/api\/keys\/([^/]+)$/);
    if (keyMatch && request.method === 'DELETE') {
      await handleApiKeysRevoke(request, response, keyMatch[1]);
      return true;
    }

    if (request.method === 'GET' && url.pathname === '/api/connections') {
      await handleConnectionsList(request, response);
      return true;
    }
    if (request.method === 'POST' && url.pathname === '/api/connections') {
      await handleConnectionsCreate(request, response);
      return true;
    }

    const connectionMatch = url.pathname.match(/^\/api\/connections\/([^/]+)$/);
    if (connectionMatch && request.method === 'PATCH') {
      await handleConnectionPatch(request, response, connectionMatch[1]);
      return true;
    }

    const connectionSecretsMatch = url.pathname.match(/^\/api\/connections\/([^/]+)\/secrets$/);
    if (connectionSecretsMatch && request.method === 'GET') {
      await handleConnectionSecretsList(request, response, connectionSecretsMatch[1]);
      return true;
    }
    if (connectionSecretsMatch && request.method === 'POST') {
      await handleConnectionSecretsCreate(request, response, connectionSecretsMatch[1]);
      return true;
    }

    const connectionSecretMatch = url.pathname.match(/^\/api\/connections\/([^/]+)\/secrets\/([^/]+)$/);
    if (connectionSecretMatch && request.method === 'DELETE') {
      await handleConnectionSecretsDelete(request, response, connectionSecretMatch[1], connectionSecretMatch[2]);
      return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/cua/secret-fill-plan') {
      await handleCuaSecretFillPlan(request, response);
      return true;
    }

    writeJson(response, 404, {
      error: 'Not Found',
      path: url.pathname,
    });
    return true;
  } catch (error: any) {
    console.error('[api] request failed', error);
    writeJson(response, 500, {
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    });
    return true;
  }
}

export const __testables = {
  normalizeHost,
  normalizePathPrefix,
  isUrlAllowedByPolicy,
  redactAuditDetails,
  accountApiPathAllowed,
  secretApiPathAllowed,
};
