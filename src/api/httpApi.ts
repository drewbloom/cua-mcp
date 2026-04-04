import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import path from 'node:path';
import { getPool } from '../db/postgres.js';
import { config } from '../config.js';
import { DASHBOARD_APP_HTML } from '../ui/onboardingAppHtml.js';
import { PUBLIC_APP_HTML } from '../ui/publicAppHtml.js';
import { LANDING_PAGE_HTML } from '../ui/landingPageHtml.js';
import { encryptText, hashValue, isSameHash, requireHex32ByteKey } from '../security/crypto.js';
import { buildSecretFillPlan, getConnectionPolicyForUser, isUrlAllowedByPolicy, normalizeHost, normalizePathPrefix } from '../security/secretBoundary.js';
import { cancelCaptureSession, finalizeCaptureSession, getCaptureSnapshot, listCaptureSnapshots, performCaptureAction, startCaptureSession } from '../security/authCapture.js';
import { cuaRuntime } from '../cua/runtime.js';
import { getUserCuaSettings, updateUserCuaSettings } from '../cua/userSettings.js';
import { deleteOrchestrationPattern, listOrchestrationPatterns, upsertOrchestrationPattern } from '../orchestration/patternLibrary.js';

type JsonObject = Record<string, unknown>;

type AuthContext = {
  userId: string;
  email: string;
  sessionId: string;
};

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
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'same-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()'
      .replace(/, /g, ', '),
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
}

function writeHtml(response: ServerResponse, status: number, html: string): void {
  response.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'same-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()'
      .replace(/, /g, ', '),
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'content-security-policy': "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:; font-src 'self' data:",
  });
  response.end(html);
}

async function writeStaticFile(response: ServerResponse, filePath: string, contentType: string): Promise<void> {
  const body = await readFile(filePath);
  response.writeHead(200, {
    'content-type': contentType,
    'cache-control': 'public, max-age=86400',
    'x-content-type-options': 'nosniff',
    'cross-origin-resource-policy': 'same-origin',
  });
  response.end(body);
}

function writeRedirect(response: ServerResponse, location: string): void {
  response.writeHead(302, {
    location,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'same-origin',
  });
  response.end();
}

function writeApiUnauthorized(response: ServerResponse): void {
  writeJson(response, 401, {
    error: 'Unauthorized',
    message: 'Session required.',
  });
}

function getRequestIp(request: IncomingMessage): string {
  const forwarded = String(request.headers['x-forwarded-for'] || '').trim();
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return String(request.socket.remoteAddress || 'unknown').trim() || 'unknown';
}

function isAllowedOrigin(request: IncomingMessage): boolean {
  const configured = String(config.frontendOrigin || '').trim();
  const origin = String(request.headers.origin || '').trim();
  if (!origin) return true;
  if (!configured) {
    const proto = String(request.headers['x-forwarded-proto'] || 'http').split(',')[0].trim() || 'http';
    const host = String(request.headers.host || '').trim();
    if (!host) return false;
    return origin === `${proto}://${host}`;
  }
  return origin === configured;
}

function writeForbiddenOrigin(response: ServerResponse): void {
  writeJson(response, 403, {
    error: 'Forbidden',
    message: 'Request origin is not allowed.',
  });
}

function getCorsOrigin(request: IncomingMessage): string {
  if (config.frontendOrigin) return config.frontendOrigin;
  const origin = String(request.headers.origin || '').trim();
  if (origin) return origin;
  const proto = String(request.headers['x-forwarded-proto'] || 'http').split(',')[0].trim() || 'http';
  const host = String(request.headers.host || '').trim();
  return host ? `${proto}://${host}` : 'http://localhost';
}

async function getAuthContext(request: IncomingMessage): Promise<AuthContext | null> {
  const cookies = parseCookies(request);
  const token = cookies[config.sessionCookieName];
  if (!token) return null;

  const tokenHash = hashValue(token);
  const db = getPool();
  const res = await db.query(
    `
    SELECT s.id, s.user_id, u.email, s.expires_at, s.absolute_expires_at, s.revoked_at
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
  const now = Date.now();
  const idleExpiresAt = new Date(row.expires_at).getTime();
  const absoluteExpiresAt = row.absolute_expires_at ? new Date(row.absolute_expires_at).getTime() : idleExpiresAt;
  if (!Number.isFinite(idleExpiresAt) || idleExpiresAt < now) return null;
  if (!Number.isFinite(absoluteExpiresAt) || absoluteExpiresAt < now) return null;

  const nextIdleExpiry = new Date(Math.min(now + config.sessionIdleTtlHours * 60 * 60 * 1000, absoluteExpiresAt));
  await db.query('UPDATE user_sessions SET last_seen_at = NOW(), expires_at = $2 WHERE id = $1', [row.id, nextIdleExpiry]);

  return {
    userId: String(row.user_id),
    email: String(row.email),
    sessionId: String(row.id),
  };
}

function buildSessionCookie(token: string, clear: boolean = false): string {
  const secure = config.nodeEnv === 'production' ? '; Secure' : '';
  const maxAge = clear ? 0 : config.sessionIdleTtlHours * 60 * 60;
  const value = clear ? '' : encodeURIComponent(token);
  return `${config.sessionCookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
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

function asOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  throw new Error('Boolean value expected');
}

function serializeConnectionRow(row: any): JsonObject {
  return {
    id: String(row.id),
    name: String(row.name),
    baseHost: String(row.base_host),
    allowedHosts: row.allowed_hosts_json || [],
    allowedPathPrefixes: row.allowed_path_prefixes_json || [],
    allowSubdomains: Boolean(row.allow_subdomains),
    allowAnyPath: Boolean(row.allow_any_path),
    authMethod: String(row.auth_method),
    status: String(row.status),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

function toBase64Url(value: Buffer): string {
  return value.toString('base64url');
}

function requireSecretMasterKey(): Buffer {
  return requireHex32ByteKey(config.secretMasterKeyHex, 'CUA_SECRET_MASTER_KEY');
}

function encryptSecretValue(plaintext: string): { ciphertext: string; ivHex: string; authTagHex: string; keyVersion: string } {
  return encryptText(plaintext, requireSecretMasterKey());
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

const accountApiPaths = [
  '/api/auth/request-code',
  '/api/auth/verify-code',
  '/api/session/me',
  '/api/session/logout',
  '/api/settings/runtime',
  '/api/keys',
  '/api/llm-keys',
  '/api/runs',
  '/api/connections',
  '/api/orchestration-patterns',
];

function accountApiPathAllowed(pathname: string): boolean {
  if (accountApiPaths.includes(pathname)) return true;
  if (/^\/api\/keys\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/llm-keys\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/runs\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/orchestration-patterns\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/secrets$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/secrets\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/auth-states$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/auth-states\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/capture-sessions$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/capture-sessions\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/capture-sessions\/[^/]+\/actions$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/capture-sessions\/[^/]+\/finalize$/.test(pathname)) return true;
  if (pathname === '/api/cua/secret-fill-plan') return true;
  return false;
}

function secretApiPathAllowed(pathname: string): boolean {
  if (/^\/api\/connections\/[^/]+\/secrets$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/secrets\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/auth-states$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/auth-states\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/capture-sessions$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/capture-sessions\/[^/]+$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/capture-sessions\/[^/]+\/actions$/.test(pathname)) return true;
  if (/^\/api\/connections\/[^/]+\/capture-sessions\/[^/]+\/finalize$/.test(pathname)) return true;
  if (pathname === '/api/cua/secret-fill-plan') return true;
  return false;
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

async function getUserByEmail(email: string): Promise<{ id: string; email: string; displayName: string | null } | null> {
  const db = getPool();
  const existing = await db.query('SELECT id, email, display_name FROM users WHERE email = $1 LIMIT 1', [email]);
  if ((existing.rowCount ?? 0) === 0) {
    return null;
  }

  const row = existing.rows[0];
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: row.display_name ? String(row.display_name) : null,
  };
}

async function logSecurityEvent(userId: string | null, eventType: string, eventScope: string, details: JsonObject): Promise<void> {
  const db = getPool();
  await db.query(
    'INSERT INTO security_audit_logs (user_id, event_type, event_scope, details_json, created_at) VALUES ($1, $2, $3, $4::jsonb, NOW())',
    [userId, eventType, eventScope, JSON.stringify(redactAuditDetails(details))],
  );
}

async function recordRateLimitEvent(actionName: string, scopeKey: string): Promise<void> {
  const db = getPool();
  await db.query(
    'INSERT INTO auth_rate_limit_events (action_name, scope_key, created_at) VALUES ($1, $2, NOW())',
    [actionName, scopeKey],
  );
}

async function countRecentRateLimitEvents(actionName: string, scopeKey: string, windowMinutes: number): Promise<number> {
  const db = getPool();
  const res = await db.query(
    `
    SELECT COUNT(*)::int AS count
    FROM auth_rate_limit_events
    WHERE action_name = $1
      AND scope_key = $2
      AND created_at >= NOW() - ($3 || ' minutes')::interval
    `,
    [actionName, scopeKey, String(windowMinutes)],
  );
  return Number(res.rows[0]?.count || 0);
}

async function enforceRateLimit(actionName: string, scopeKey: string, limit: number, windowMinutes: number): Promise<boolean> {
  const count = await countRecentRateLimitEvents(actionName, scopeKey, windowMinutes);
  if (count >= limit) {
    return false;
  }
  await recordRateLimitEvent(actionName, scopeKey);
  return true;
}

function getOtpEmailHtml(code: string): string {
  const brandName = config.resendFromName || 'CUA MCP';
  return `<!doctype html>
  <html>
    <body style="margin:0;padding:0;background:#f4f7fb;color:#102033;font-family:'Segoe UI',Avenir Next,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 18px;">
        <div style="border-radius:24px;overflow:hidden;background:#ffffff;border:1px solid #d9e2ec;box-shadow:0 18px 48px rgba(16,32,51,0.08);">
          <div style="padding:28px 28px 12px;">
            <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#5e738a;">${brandName}</div>
            <h1 style="margin:14px 0 8px;font-size:32px;line-height:1.1;letter-spacing:-0.03em;color:#102033;">Your sign-in code</h1>
            <p style="margin:0;font-size:15px;line-height:1.6;color:#496176;">Use this one-time code to sign in to your dashboard.</p>
          </div>
          <div style="padding:12px 28px 28px;">
            <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#5e738a;margin-bottom:10px;">Verification code</div>
            <div style="font-size:36px;font-weight:700;letter-spacing:0.18em;color:#102033;padding:18px 20px;border-radius:18px;background:#f4f7fb;border:1px solid #d9e2ec;text-align:center;">${code}</div>
            <p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#496176;">This code expires in ${config.otpTtlMinutes} minutes and can only be used once.</p>
            <p style="margin:12px 0 0;font-size:14px;line-height:1.7;color:#496176;">If you did not request this code, you can ignore this email.</p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

function computeSessionExpiries(baseMs: number = Date.now()): { idleExpiresAt: Date; absoluteExpiresAt: Date } {
  const idleExpiresAt = new Date(baseMs + config.sessionIdleTtlHours * 60 * 60 * 1000);
  const absoluteExpiresAt = new Date(baseMs + config.sessionAbsoluteTtlDays * 24 * 60 * 60 * 1000);
  return { idleExpiresAt, absoluteExpiresAt };
}

async function enforceGlobalApiRateLimit(request: IncomingMessage, auth: AuthContext | null, pathname: string): Promise<{ ok: true } | { ok: false; status: number; body: JsonObject }> {
  const ip = getRequestIp(request);
  const isMutation = Boolean(request.method && ['POST', 'PATCH', 'DELETE'].includes(request.method));
  const windowMinutes = config.apiRateLimitWindowMinutes;

  const ipLimit = isMutation ? config.apiMutationLimitPerIp : config.apiRequestLimitPerIp;
  const ipAction = isMutation ? 'api_mutation_ip' : 'api_request_ip';
  const ipAllowed = await enforceRateLimit(ipAction, `ip:${ip}`, ipLimit, windowMinutes);
  if (!ipAllowed) {
    return {
      ok: false,
      status: 429,
      body: {
        error: 'Too many requests',
        message: 'API rate limit exceeded for this IP. Please wait and try again.',
        path: pathname,
      },
    };
  }

  if (isMutation && auth) {
    const userAllowed = await enforceRateLimit('api_mutation_user', `user:${auth.userId}`, config.apiMutationLimitPerUser, windowMinutes);
    if (!userAllowed) {
      return {
        ok: false,
        status: 429,
        body: {
          error: 'Too many requests',
          message: 'API mutation limit exceeded for this user. Please wait and try again.',
          path: pathname,
        },
      };
    }
  }

  return { ok: true };
}

async function sendOtpEmail(email: string, code: string): Promise<{ delivered: boolean; mode: 'resend' | 'dev-log' }> {
  const fromEmail = config.resendFromEmail;
  const resendApiKey = config.resendApiKey;

  if (!resendApiKey || !fromEmail) {
    if (config.nodeEnv === 'production') {
      throw new Error('Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.');
    }

    console.log(`[auth] OTP for ${email}: ${code}`);
    return { delivered: true, mode: 'dev-log' };
  }

  const from = config.resendFromName ? `${config.resendFromName} <${fromEmail}>` : fromEmail;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your CUA MCP login code',
      text: `Your CUA MCP login code is ${code}. It expires in ${config.otpTtlMinutes} minutes.`,
      html: getOtpEmailHtml(code),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email delivery failed (${response.status}): ${body}`);
  }

  return { delivered: true, mode: 'resend' };
}

async function handleConnectionSecretsList(request: IncomingMessage, response: ServerResponse, connectionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const policy = await getConnectionPolicyForUser(auth.userId, connectionId);
  if (!policy) {
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

  const policy = await getConnectionPolicyForUser(auth.userId, connectionId);
  if (!policy) {
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

  const policy = await getConnectionPolicyForUser(auth.userId, connectionId);
  if (!policy) {
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

async function handleConnectionAuthStatesList(request: IncomingMessage, response: ServerResponse, connectionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const policy = await getConnectionPolicyForUser(auth.userId, connectionId);
  if (!policy) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }

  const db = getPool();
  const res = await db.query(
    `
    SELECT id, state_type, key_version, expires_at, created_at, updated_at, last_used_at
    FROM auth_states
    WHERE user_id = $1 AND connection_id = $2
    ORDER BY created_at DESC
    `,
    [auth.userId, connectionId],
  );

  writeJson(response, 200, {
    authStates: res.rows.map((row) => ({
      id: String(row.id),
      reference: `auth_state_ref:${row.id}`,
      stateType: String(row.state_type),
      keyVersion: String(row.key_version),
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at).toISOString() : null,
    })),
  });
}

async function handleConnectionAuthStatesCreate(request: IncomingMessage, response: ServerResponse, connectionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const policy = await getConnectionPolicyForUser(auth.userId, connectionId);
  if (!policy) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }

  const body = await readJsonBody(request);
  const stateType = requireString(body.stateType, 'stateType').toLowerCase();
  const statePayload = requireString(body.statePayload, 'statePayload');
  const expiresAtRaw = String(body.expiresAt || '').trim();

  const allowedTypes = new Set(['playwright_storage_state_json', 'cookie_bundle_json']);
  if (!allowedTypes.has(stateType)) {
    writeJson(response, 400, { error: 'Invalid stateType' });
    return;
  }

  try {
    JSON.parse(statePayload);
  } catch {
    writeJson(response, 400, { error: 'statePayload must be valid JSON' });
    return;
  }

  let expiresAt: string | null = null;
  if (expiresAtRaw) {
    const parsed = new Date(expiresAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      writeJson(response, 400, { error: 'expiresAt must be a valid ISO timestamp' });
      return;
    }
    expiresAt = parsed.toISOString();
  }

  const encrypted = encryptSecretValue(statePayload);
  const stateId = randomUUID();
  const db = getPool();
  await db.query(
    `
    INSERT INTO auth_states (
      id, user_id, connection_id, state_type,
      ciphertext, iv_hex, auth_tag_hex, key_version,
      expires_at, created_at, updated_at, last_used_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NULL)
    `,
    [
      stateId,
      auth.userId,
      connectionId,
      stateType,
      encrypted.ciphertext,
      encrypted.ivHex,
      encrypted.authTagHex,
      encrypted.keyVersion,
      expiresAt,
    ],
  );

  await logSecurityEvent(auth.userId, 'auth_state_created', 'auth_state', {
    connectionId,
    authStateId: stateId,
    stateType,
    expiresAt,
  });

  writeJson(response, 200, {
    success: true,
    authState: {
      id: stateId,
      reference: `auth_state_ref:${stateId}`,
      stateType,
      keyVersion: encrypted.keyVersion,
      expiresAt,
      createdAt: new Date().toISOString(),
    },
  });
}

async function handleConnectionAuthStatesDelete(request: IncomingMessage, response: ServerResponse, connectionId: string, authStateId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const policy = await getConnectionPolicyForUser(auth.userId, connectionId);
  if (!policy) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }

  const db = getPool();
  const res = await db.query(
    'DELETE FROM auth_states WHERE id = $1 AND user_id = $2 AND connection_id = $3 RETURNING id',
    [authStateId, auth.userId, connectionId],
  );
  if ((res.rowCount ?? 0) === 0) {
    writeJson(response, 404, { error: 'Auth state not found' });
    return;
  }

  await logSecurityEvent(auth.userId, 'auth_state_deleted', 'auth_state', {
    connectionId,
    authStateId,
  });

  writeJson(response, 200, { success: true });
}

async function handleCaptureSessionStart(request: IncomingMessage, response: ServerResponse, connectionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const policy = await getConnectionPolicyForUser(auth.userId, connectionId);
  if (!policy) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }

  const body = await readJsonBody(request);
  const requestedStartUrl = String(body.startUrl || '').trim();
  const defaultUrl = `https://${policy.base_host}`;
  const startUrl = requestedStartUrl || defaultUrl;

  try {
    new URL(startUrl);
  } catch {
    writeJson(response, 400, { error: 'startUrl must be a valid URL' });
    return;
  }

  if (!isUrlAllowedByPolicy(startUrl, policy)) {
    writeJson(response, 403, { error: 'Start URL is not allowed for this connection policy' });
    return;
  }

  const snapshot = await startCaptureSession({
    userId: auth.userId,
    connectionId,
    startUrl,
  });

  await logSecurityEvent(auth.userId, 'auth_capture_started', 'auth_capture', {
    connectionId,
    captureSessionId: snapshot.sessionId,
    startUrl,
  });

  writeJson(response, 200, {
    success: true,
    capture: snapshot,
      connection: {
        id: connectionId,
        baseHost: String(policy.base_host),
        allowSubdomains: Boolean(policy.allow_subdomains),
        allowAnyPath: Boolean(policy.allow_any_path),
      },
  });
}

async function handleCaptureSessionList(request: IncomingMessage, response: ServerResponse, connectionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const policy = await getConnectionPolicyForUser(auth.userId, connectionId);
  if (!policy) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }

  const url = new URL(request.url || '/', 'http://localhost');
  const limitRaw = Number(url.searchParams.get('limit') || '20');
  const captures = await listCaptureSnapshots({
    userId: auth.userId,
    connectionId,
    limit: Number.isFinite(limitRaw) ? limitRaw : 20,
  });

  writeJson(response, 200, {
    success: true,
    captures,
  });
}

async function handleCaptureSessionGet(request: IncomingMessage, response: ServerResponse, connectionId: string, sessionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  try {
    const snapshot = await getCaptureSnapshot({ userId: auth.userId, connectionId, sessionId });
    writeJson(response, 200, { success: true, capture: snapshot });
  } catch {
    writeJson(response, 404, { error: 'Capture session not found' });
  }
}

async function handleCaptureSessionAction(request: IncomingMessage, response: ServerResponse, connectionId: string, sessionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const body = await readJsonBody(request);
  const actionType = requireString(body.actionType, 'actionType').toLowerCase();
  try {
    const snapshot = await performCaptureAction({
      userId: auth.userId,
      connectionId,
      sessionId,
      action:
        actionType === 'navigate'
          ? { actionType: 'navigate', url: requireString(body.url, 'url') }
          : actionType === 'click'
            ? { actionType: 'click', x: Number(body.x || 0), y: Number(body.y || 0) }
            : actionType === 'type'
              ? { actionType: 'type', text: requireString(body.text, 'text') }
              : actionType === 'keypress'
                ? { actionType: 'keypress', keys: asStringArray(body.keys) }
                : actionType === 'scroll'
                  ? { actionType: 'scroll', deltaX: Number(body.deltaX || 0), deltaY: Number(body.deltaY || 600) }
                  : { actionType: 'wait', ms: Number(body.ms || 1000) },
    });
    writeJson(response, 200, { success: true, capture: snapshot });
  } catch (error: any) {
    const message = String(error?.message || 'Capture session not found');
    writeJson(response, message.toLowerCase().includes('no longer active') ? 409 : 404, { error: message });
  }
}

async function handleCaptureSessionFinalize(request: IncomingMessage, response: ServerResponse, connectionId: string, sessionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const policy = await getConnectionPolicyForUser(auth.userId, connectionId);
  if (!policy) {
    writeJson(response, 404, { error: 'Connection not found' });
    return;
  }

  const body = await readJsonBody(request);
  const expiresAtRaw = String(body.expiresAt || '').trim();
  let expiresAt: string | null = null;
  if (expiresAtRaw) {
    const parsed = new Date(expiresAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      writeJson(response, 400, { error: 'expiresAt must be a valid ISO timestamp' });
      return;
    }
    expiresAt = parsed.toISOString();
  }

  try {
    const { snapshot, storageStateJson } = await finalizeCaptureSession({ userId: auth.userId, connectionId, sessionId });
    const encrypted = encryptSecretValue(storageStateJson);
    const authStateId = randomUUID();
    const db = getPool();

    const existingHosts = Array.from(
      new Set(
        [
          String(policy.base_host || '').trim().toLowerCase(),
          ...asStringArray(policy.allowed_hosts_json).map((host) => host.trim().toLowerCase()),
        ].filter(Boolean),
      ),
    );
    const existingPaths = asStringArray(policy.allowed_path_prefixes_json);

    await db.query('BEGIN');
    try {
      await db.query(
        `
        INSERT INTO auth_states (
          id, user_id, connection_id, state_type,
          ciphertext, iv_hex, auth_tag_hex, key_version,
          expires_at, created_at, updated_at, last_used_at
        )
        VALUES ($1, $2, $3, 'playwright_storage_state_json', $4, $5, $6, $7, $8, NOW(), NOW(), NULL)
        `,
        [
          authStateId,
          auth.userId,
          connectionId,
          encrypted.ciphertext,
          encrypted.ivHex,
          encrypted.authTagHex,
          encrypted.keyVersion,
          expiresAt,
        ],
      );

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    await logSecurityEvent(auth.userId, 'auth_capture_finalized', 'auth_capture', {
      connectionId,
      captureSessionId: sessionId,
      authStateId,
      discoveredHosts: snapshot.discoveredHosts,
      discoveredPathPrefixes: snapshot.discoveredPathPrefixes,
      allowlistUpdated: false,
    });

    writeJson(response, 200, {
      success: true,
      capture: snapshot,
      authState: {
        id: authStateId,
        reference: `auth_state_ref:${authStateId}`,
        stateType: 'playwright_storage_state_json',
        expiresAt,
      },
      connection: {
        id: connectionId,
        name: String(policy.name || ''),
        baseHost: String(policy.base_host || ''),
        allowedHosts: existingHosts,
        allowedPathPrefixes: existingPaths,
        allowSubdomains: Boolean(policy.allow_subdomains),
        allowAnyPath: Boolean(policy.allow_any_path),
      },
      discoveredHosts: snapshot.discoveredHosts,
      discoveredPathPrefixes: snapshot.discoveredPathPrefixes,
      allowlistUpdated: false,
    });
  } catch (error: any) {
    const message = String(error?.message || 'Capture session not found');
    writeJson(response, message.toLowerCase().includes('no longer active') ? 409 : 404, { error: message });
  }
}

async function handleCaptureSessionCancel(request: IncomingMessage, response: ServerResponse, connectionId: string, sessionId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;
  try {
    await cancelCaptureSession({ userId: auth.userId, connectionId, sessionId });
    await logSecurityEvent(auth.userId, 'auth_capture_cancelled', 'auth_capture', {
      connectionId,
      captureSessionId: sessionId,
    });
    writeJson(response, 200, { success: true });
  } catch (error: any) {
    const message = String(error?.message || 'Capture session not found');
    writeJson(response, message.toLowerCase().includes('no longer active') ? 409 : 404, { error: message });
  }
}

async function handleCuaSecretFillPlan(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const body = await readJsonBody(request);
  const connectionId = requireString(body.connectionId, 'connectionId');
  const targetUrl = requireString(body.targetUrl, 'targetUrl');
  const requiredSecretTypes = Array.from(new Set(asStringArray(body.requiredSecretTypes).map((v) => v.toLowerCase())));

  let resolved: Array<{ secretType: string; secretRef: string; keyVersion: string }> = [];
  let missing: string[] = [];
  try {
    const result = await buildSecretFillPlan(auth.userId, connectionId, targetUrl, requiredSecretTypes);
    resolved = result.plan.resolved;
    missing = result.plan.missing;
  } catch (error: any) {
    const message = String(error?.message || 'Secret fill plan failed');
    const status = message.includes('not allowed') ? 403 : message.includes('not active') ? 409 : message.includes('not found') ? 404 : 400;
    await logSecurityEvent(auth.userId, 'secret_fill_denied_url', 'secret_execution', {
      connectionId,
      targetUrl,
      requiredSecretTypes,
      message,
    });
    writeJson(response, status, { error: message });
    return;
  }

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

  const mode = String(body.mode || 'register').trim().toLowerCase();
  if (mode !== 'register' && mode !== 'signin') {
    writeJson(response, 400, { error: 'Invalid auth mode' });
    return;
  }

  const displayName = String(body.displayName || '').trim() || null;
  const existingUser = await getUserByEmail(email);
  if (mode === 'signin' && !existingUser) {
    writeJson(response, 404, {
      error: 'Registration required',
      message: 'No account exists for that email yet. Finish onboarding first.',
      registrationRequired: true,
    });
    return;
  }

  const user = existingUser
    ? await upsertUser(email, mode === 'register' ? displayName || undefined : undefined)
    : await upsertUser(email, displayName || undefined);
  const ip = getRequestIp(request);

  const emailAllowed = await enforceRateLimit('otp_request_email', `email:${email}`, config.authRequestLimitPerEmail, config.authRequestWindowMinutes);
  const ipAllowed = await enforceRateLimit('otp_request_ip', `ip:${ip}`, config.authRequestLimitPerIp, config.authRequestWindowMinutes);
  if (!emailAllowed || !ipAllowed) {
    await logSecurityEvent(user.id, 'otp_request_rate_limited', 'auth', { email, ip });
    writeJson(response, 429, {
      error: 'Too many requests',
      message: 'Too many login code requests. Please wait and try again.',
    });
    return;
  }

  const code = String(randomInt(100000, 1000000));
  const codeHash = hashValue(code);

  const db = getPool();
  await db.query(
    `
    UPDATE auth_login_codes
    SET consumed_at = NOW()
    WHERE email = $1 AND consumed_at IS NULL
    `,
    [email],
  );

  await db.query(
    `
    INSERT INTO auth_login_codes (id, user_id, email, code_hash, attempt_count, max_attempts, expires_at, consumed_at, created_at)
    VALUES ($1, $2, $3, $4, 0, $5, NOW() + ($6 || ' minutes')::interval, NULL, NOW())
    `,
    [randomUUID(), user.id, email, codeHash, config.otpMaxAttempts, String(config.otpTtlMinutes)],
  );

  const delivery = await sendOtpEmail(email, code);
  await logSecurityEvent(user.id, 'otp_requested', 'auth', { email, deliveryMode: delivery.mode, ip });

  writeJson(response, 200, {
    success: true,
    message: 'Login code sent.',
    mode,
    existingUser: Boolean(existingUser),
  });
}

async function handleAuthVerifyCode(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const code = requireString(body.code, 'code');
  const ip = getRequestIp(request);

  const emailAllowed = await enforceRateLimit('otp_verify_email', `email:${email}`, config.authVerifyLimitPerEmail, config.authVerifyWindowMinutes);
  const ipAllowed = await enforceRateLimit('otp_verify_ip', `ip:${ip}`, config.authVerifyLimitPerIp, config.authVerifyWindowMinutes);
  if (!emailAllowed || !ipAllowed) {
    await logSecurityEvent(null, 'otp_verify_rate_limited', 'auth', { email, ip });
    writeJson(response, 429, {
      error: 'Too many attempts',
      message: 'Too many verification attempts. Please request a new code shortly.',
    });
    return;
  }

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
    const nextAttemptCount = Number(row.attempt_count) + 1;
    const exhausted = nextAttemptCount >= Number(row.max_attempts);
    await db.query(
      `
      UPDATE auth_login_codes
      SET attempt_count = attempt_count + 1,
          consumed_at = CASE WHEN $2::boolean THEN NOW() ELSE consumed_at END
      WHERE id = $1
      `,
      [row.id, exhausted],
    );
    await logSecurityEvent(String(row.user_id), exhausted ? 'otp_exhausted' : 'otp_invalid', 'auth', { email, ip, attemptCount: nextAttemptCount });
    if (exhausted) {
      writeJson(response, 429, { error: 'Too many attempts', message: 'Code invalid too many times. Request a new code.' });
      return;
    }
    writeJson(response, 401, { error: 'Invalid code' });
    return;
  }

  await db.query('UPDATE auth_login_codes SET consumed_at = NOW() WHERE id = $1', [row.id]);

  const sessionToken = randomBytes(24).toString('hex');
  const sessionTokenHash = hashValue(sessionToken);
  const sessionId = randomUUID();
  const { idleExpiresAt, absoluteExpiresAt } = computeSessionExpiries();

  await db.query(
    `
    INSERT INTO user_sessions (id, user_id, session_token_hash, expires_at, absolute_expires_at, created_at, last_seen_at, revoked_at, user_agent, ip_address)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NULL, $6, $7)
    `,
    [
      sessionId,
      row.user_id,
      sessionTokenHash,
      idleExpiresAt,
      absoluteExpiresAt,
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
  const sessionRes = await db.query(
    'SELECT created_at, expires_at, absolute_expires_at, last_seen_at FROM user_sessions WHERE id = $1 LIMIT 1',
    [auth.sessionId],
  );
  const session = sessionRes.rows[0];

  writeJson(response, 200, {
    authenticated: true,
    user: {
      id: String(user.id),
      email: String(user.email),
      displayName: user.display_name ? String(user.display_name) : null,
      createdAt: new Date(user.created_at).toISOString(),
    },
    session: session
      ? {
          id: String(auth.sessionId),
          createdAt: new Date(session.created_at).toISOString(),
          expiresAt: new Date(session.expires_at).toISOString(),
          absoluteExpiresAt: session.absolute_expires_at ? new Date(session.absolute_expires_at).toISOString() : null,
          lastSeenAt: session.last_seen_at ? new Date(session.last_seen_at).toISOString() : null,
        }
      : null,
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

async function handleOrchestrationPatternsList(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const patterns = await listOrchestrationPatterns(auth.userId);
  writeJson(response, 200, { patterns });
}

async function handleOrchestrationPatternCreate(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const body = await readJsonBody(request);
  const pattern = await upsertOrchestrationPattern(auth.userId, {
    name: requireString(body.name, 'name'),
    summary: 'summary' in body ? String(body.summary || '') : undefined,
    urls: 'urls' in body ? asStringArray(body.urls) : undefined,
    stepsMarkdown: requireString(body.stepsMarkdown, 'stepsMarkdown'),
    knownIssuesMarkdown: 'knownIssuesMarkdown' in body ? String(body.knownIssuesMarkdown || '') : undefined,
  });

  await logSecurityEvent(auth.userId, 'orchestration_pattern_created', 'orchestration', {
    patternId: pattern.id,
    name: pattern.name,
    urlCount: pattern.urls.length,
  });

  writeJson(response, 200, { success: true, pattern });
}

async function handleOrchestrationPatternPatch(request: IncomingMessage, response: ServerResponse, patternId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const existing = (await listOrchestrationPatterns(auth.userId)).find((pattern) => pattern.id === patternId);
  if (!existing) {
    writeJson(response, 404, { error: 'Pattern not found' });
    return;
  }

  const body = await readJsonBody(request);
  const pattern = await upsertOrchestrationPattern(auth.userId, {
    patternId,
    name: 'name' in body ? requireString(body.name, 'name') : existing.name,
    summary: 'summary' in body ? String(body.summary || '') : existing.summary || undefined,
    urls: 'urls' in body ? asStringArray(body.urls) : existing.urls,
    stepsMarkdown: 'stepsMarkdown' in body ? requireString(body.stepsMarkdown, 'stepsMarkdown') : existing.stepsMarkdown,
    knownIssuesMarkdown:
      'knownIssuesMarkdown' in body ? String(body.knownIssuesMarkdown || '') : existing.knownIssuesMarkdown || undefined,
  });

  await logSecurityEvent(auth.userId, 'orchestration_pattern_updated', 'orchestration', {
    patternId: pattern.id,
    name: pattern.name,
    urlCount: pattern.urls.length,
  });

  writeJson(response, 200, { success: true, pattern });
}

async function handleOrchestrationPatternDelete(request: IncomingMessage, response: ServerResponse, patternId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const deleted = await deleteOrchestrationPattern(auth.userId, patternId);
  if (!deleted) {
    writeJson(response, 404, { error: 'Pattern not found' });
    return;
  }

  await logSecurityEvent(auth.userId, 'orchestration_pattern_deleted', 'orchestration', {
    patternId,
  });

  writeJson(response, 200, { success: true, patternId });
}

async function handleRuntimeSettingsGet(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const settings = await getUserCuaSettings(auth.userId);
  writeJson(response, 200, { settings });
}

async function handleRuntimeSettingsPatch(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const body = await readJsonBody(request);
  const input: {
    runRetentionDays?: number;
    zdrEnabled?: boolean;
    persistRunEvents?: boolean;
    persistRunOutput?: boolean;
  } = {};

  if (body.runRetentionDays !== undefined) {
    const runRetentionDays = Number(body.runRetentionDays);
    if (!Number.isFinite(runRetentionDays)) {
      writeJson(response, 400, { error: 'runRetentionDays must be a number' });
      return;
    }
    input.runRetentionDays = runRetentionDays;
  }
  if (body.zdrEnabled !== undefined) {
    input.zdrEnabled = Boolean(body.zdrEnabled);
  }
  if (body.persistRunEvents !== undefined) {
    input.persistRunEvents = Boolean(body.persistRunEvents);
  }
  if (body.persistRunOutput !== undefined) {
    input.persistRunOutput = Boolean(body.persistRunOutput);
  }

  if (Object.keys(input).length === 0) {
    writeJson(response, 400, { error: 'No updatable fields provided' });
    return;
  }

  const settings = await updateUserCuaSettings(auth.userId, input);
  cuaRuntime.invalidateUserSettings(auth.userId);
  await logSecurityEvent(auth.userId, 'runtime_settings_updated', 'runtime', {
    fields: Object.keys(input),
    zdrEnabled: settings.zdrEnabled,
    runRetentionDays: settings.runRetentionDays,
    persistRunEvents: settings.persistRunEvents,
    persistRunOutput: settings.persistRunOutput,
  });

  writeJson(response, 200, { success: true, settings });
}

async function handleRunsList(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const runs = await cuaRuntime.listRuns(auth.userId);
  writeJson(response, 200, { runs });
}

async function handleRunGet(request: IncomingMessage, response: ServerResponse, runId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const run = await cuaRuntime.getRun(runId, auth.userId);
  if (!run) {
    writeJson(response, 404, { error: 'Run not found' });
    return;
  }

  writeJson(response, 200, { run });
}

async function handleRunDelete(request: IncomingMessage, response: ServerResponse, runId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const deleted = await cuaRuntime.deleteRun(runId, auth.userId);
  if (!deleted) {
    writeJson(response, 404, { error: 'Run not found' });
    return;
  }

  await logSecurityEvent(auth.userId, 'run_deleted', 'runtime', { runId });
  writeJson(response, 200, { success: true, runId });
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
  if (allowedConnectionIds.length > 0) {
    const scopeRes = await db.query(
      'SELECT id FROM connections WHERE user_id = $1 AND id = ANY($2::text[])',
      [auth.userId, allowedConnectionIds],
    );
    const owned = new Set(scopeRes.rows.map((row) => String(row.id)));
    const invalid = allowedConnectionIds.filter((id) => !owned.has(id));
    if (invalid.length > 0) {
      writeJson(response, 400, {
        error: 'Invalid allowedConnectionIds',
        message: 'All scoped connection ids must belong to the current user.',
        invalidConnectionIds: invalid,
      });
      return;
    }
  }

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

async function handleLlmKeysList(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const db = getPool();
  const res = await db.query(
    `
    SELECT id, provider, name, key_version, is_active, created_at, updated_at, last_used_at, revoked_at
    FROM user_llm_keys
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [auth.userId],
  );

  writeJson(response, 200, {
    llmKeys: res.rows.map((row) => ({
      id: String(row.id),
      provider: String(row.provider),
      name: String(row.name),
      keyVersion: String(row.key_version),
      isActive: Boolean(row.is_active) && !row.revoked_at,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at).toISOString() : null,
      revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    })),
  });
}

async function handleLlmKeysCreate(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const body = await readJsonBody(request);
  const provider = String(body.provider || 'openai').trim().toLowerCase() || 'openai';
  const name = requireString(body.name, 'name');
  const apiKey = requireString(body.apiKey, 'apiKey');
  const activate = body.activate === undefined ? true : Boolean(body.activate);

  if (provider !== 'openai') {
    writeJson(response, 400, { error: 'Unsupported provider', supportedProviders: ['openai'] });
    return;
  }

  const encrypted = encryptSecretValue(apiKey);
  const llmKeyId = randomUUID();
  const db = getPool();

  await db.query('BEGIN');
  try {
    if (activate) {
      await db.query(
        `
        UPDATE user_llm_keys
        SET is_active = FALSE, updated_at = NOW()
        WHERE user_id = $1 AND provider = $2 AND revoked_at IS NULL
        `,
        [auth.userId, provider],
      );
    }

    await db.query(
      `
      INSERT INTO user_llm_keys (
        id, user_id, provider, name, ciphertext, iv_hex, auth_tag_hex, key_version,
        is_active, created_at, updated_at, last_used_at, revoked_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NULL, NULL)
      `,
      [
        llmKeyId,
        auth.userId,
        provider,
        name,
        encrypted.ciphertext,
        encrypted.ivHex,
        encrypted.authTagHex,
        encrypted.keyVersion,
        activate,
      ],
    );

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }

  await logSecurityEvent(auth.userId, 'llm_key_created', 'llm_key', {
    llmKeyId,
    provider,
    activate,
  });

  writeJson(response, 200, {
    success: true,
    llmKey: {
      id: llmKeyId,
      provider,
      name,
      isActive: activate,
      keyVersion: encrypted.keyVersion,
      createdAt: new Date().toISOString(),
    },
  });
}

async function handleLlmKeyActivate(request: IncomingMessage, response: ServerResponse, llmKeyId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const db = getPool();
  const existing = await db.query(
    'SELECT id, provider, revoked_at FROM user_llm_keys WHERE id = $1 AND user_id = $2 LIMIT 1',
    [llmKeyId, auth.userId],
  );

  if ((existing.rowCount ?? 0) === 0) {
    writeJson(response, 404, { error: 'LLM key not found' });
    return;
  }

  const row = existing.rows[0];
  if (row.revoked_at) {
    writeJson(response, 409, { error: 'LLM key has been revoked' });
    return;
  }

  await db.query('BEGIN');
  try {
    await db.query(
      `
      UPDATE user_llm_keys
      SET is_active = FALSE, updated_at = NOW()
      WHERE user_id = $1 AND provider = $2 AND revoked_at IS NULL
      `,
      [auth.userId, row.provider],
    );
    await db.query(
      `
      UPDATE user_llm_keys
      SET is_active = TRUE, updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
      `,
      [llmKeyId, auth.userId],
    );
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }

  await logSecurityEvent(auth.userId, 'llm_key_activated', 'llm_key', { llmKeyId, provider: String(row.provider) });
  writeJson(response, 200, { success: true, llmKeyId, provider: String(row.provider), isActive: true });
}

async function handleLlmKeyRevoke(request: IncomingMessage, response: ServerResponse, llmKeyId: string): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const db = getPool();
  const res = await db.query(
    `
    UPDATE user_llm_keys
    SET revoked_at = NOW(), is_active = FALSE, updated_at = NOW()
    WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
    RETURNING id, provider
    `,
    [llmKeyId, auth.userId],
  );

  if ((res.rowCount ?? 0) === 0) {
    writeJson(response, 404, { error: 'LLM key not found' });
    return;
  }

  await logSecurityEvent(auth.userId, 'llm_key_revoked', 'llm_key', {
    llmKeyId,
    provider: String(res.rows[0].provider),
  });
  writeJson(response, 200, { success: true });
}

async function handleConnectionsList(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const db = getPool();
  const res = await db.query(
    `
    SELECT id, name, base_host, allowed_hosts_json, allowed_path_prefixes_json, allow_subdomains, allow_any_path, auth_method, status, created_at, updated_at
    FROM connections
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [auth.userId],
  );

  writeJson(response, 200, {
    connections: res.rows.map((row) => serializeConnectionRow(row)),
  });
}

async function handleConnectionsCreate(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const auth = await requireAuth(request, response);
  if (!auth) return;

  const body = await readJsonBody(request);
  const name = requireString(body.name, 'name');
  const baseHost = normalizeHost(requireString(body.baseHost, 'baseHost'));
  const allowedHosts = asStringArray(body.allowedHosts).map((host) => normalizeHost(host));
  const allowedPathPrefixes = asStringArray(body.allowedPathPrefixes).map((path) => normalizePathPrefix(path));
  const allowSubdomains = asOptionalBoolean(body.allowSubdomains) ?? false;
  const allowAnyPath = asOptionalBoolean(body.allowAnyPath) ?? false;
  const authMethod = String(body.authMethod || 'oauth').trim().toLowerCase() || 'oauth';

  const dedupHosts = Array.from(new Set([baseHost, ...allowedHosts]));
  const dedupPaths = Array.from(new Set(allowedPathPrefixes));

  const connectionId = randomUUID();
  const db = getPool();
  await db.query(
    `
    INSERT INTO connections (
      id, user_id, name, base_host, allowed_hosts_json, allowed_path_prefixes_json, allow_subdomains, allow_any_path, auth_method, status, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, 'active', NOW(), NOW())
    `,
    [
      connectionId,
      auth.userId,
      name,
      baseHost,
      JSON.stringify(dedupHosts),
      JSON.stringify(dedupPaths),
      allowSubdomains,
      allowAnyPath,
      authMethod,
    ],
  );

  await logSecurityEvent(auth.userId, 'connection_created', 'connection', {
    connectionId,
    baseHost,
    allowSubdomains,
    allowAnyPath,
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
      allowSubdomains,
      allowAnyPath,
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
    const hosts = Array.from(new Set(asStringArray(body.allowedHosts).map((host) => normalizeHost(host))));
    setJson('allowed_hosts_json', hosts);
  }
  if (body.allowedPathPrefixes !== undefined) {
    const paths = Array.from(new Set(asStringArray(body.allowedPathPrefixes).map((path) => normalizePathPrefix(path))));
    setJson('allowed_path_prefixes_json', paths);
  }
  if (body.allowSubdomains !== undefined) {
    updates.push(`allow_subdomains = $${values.length + 1}`);
    values.push(asOptionalBoolean(body.allowSubdomains));
  }
  if (body.allowAnyPath !== undefined) {
    updates.push(`allow_any_path = $${values.length + 1}`);
    values.push(asOptionalBoolean(body.allowAnyPath));
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
    RETURNING id, name, base_host, allowed_hosts_json, allowed_path_prefixes_json, allow_subdomains, allow_any_path, auth_method, status, created_at, updated_at
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
    connection: serializeConnectionRow(row),
  });
}

export async function handleApiRequest(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean> {
  if (!url.pathname.startsWith('/api/')) {
    return false;
  }

  if (request.method && ['POST', 'PATCH', 'DELETE'].includes(request.method) && !isAllowedOrigin(request)) {
    writeForbiddenOrigin(response);
    return true;
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

  const authContext = await getAuthContext(request);
  const rateLimit = await enforceGlobalApiRateLimit(request, authContext, url.pathname);
  if (!rateLimit.ok) {
    writeJson(response, rateLimit.status, rateLimit.body);
    return true;
  }

  const origin = getCorsOrigin(request);
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

    if (request.method === 'GET' && url.pathname === '/api/orchestration-patterns') {
      await handleOrchestrationPatternsList(request, response);
      return true;
    }
    if (request.method === 'POST' && url.pathname === '/api/orchestration-patterns') {
      await handleOrchestrationPatternCreate(request, response);
      return true;
    }

    const orchestrationPatternMatch = url.pathname.match(/^\/api\/orchestration-patterns\/([^/]+)$/);
    if (orchestrationPatternMatch && request.method === 'PATCH') {
      await handleOrchestrationPatternPatch(request, response, orchestrationPatternMatch[1]);
      return true;
    }
    if (orchestrationPatternMatch && request.method === 'DELETE') {
      await handleOrchestrationPatternDelete(request, response, orchestrationPatternMatch[1]);
      return true;
    }

    if (request.method === 'GET' && url.pathname === '/api/settings/runtime') {
      await handleRuntimeSettingsGet(request, response);
      return true;
    }
    if (request.method === 'PATCH' && url.pathname === '/api/settings/runtime') {
      await handleRuntimeSettingsPatch(request, response);
      return true;
    }

    if (request.method === 'GET' && url.pathname === '/api/runs') {
      await handleRunsList(request, response);
      return true;
    }

    const runMatch = url.pathname.match(/^\/api\/runs\/([^/]+)$/);
    if (runMatch && request.method === 'GET') {
      await handleRunGet(request, response, runMatch[1]);
      return true;
    }
    if (runMatch && request.method === 'DELETE') {
      await handleRunDelete(request, response, runMatch[1]);
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

    if (request.method === 'GET' && url.pathname === '/api/llm-keys') {
      await handleLlmKeysList(request, response);
      return true;
    }
    if (request.method === 'POST' && url.pathname === '/api/llm-keys') {
      await handleLlmKeysCreate(request, response);
      return true;
    }

    const keyMatch = url.pathname.match(/^\/api\/keys\/([^/]+)$/);
    if (keyMatch && request.method === 'DELETE') {
      await handleApiKeysRevoke(request, response, keyMatch[1]);
      return true;
    }

    const llmKeyMatch = url.pathname.match(/^\/api\/llm-keys\/([^/]+)$/);
    if (llmKeyMatch && request.method === 'PATCH') {
      await handleLlmKeyActivate(request, response, llmKeyMatch[1]);
      return true;
    }
    if (llmKeyMatch && request.method === 'DELETE') {
      await handleLlmKeyRevoke(request, response, llmKeyMatch[1]);
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

    const connectionAuthStatesMatch = url.pathname.match(/^\/api\/connections\/([^/]+)\/auth-states$/);
    if (connectionAuthStatesMatch && request.method === 'GET') {
      await handleConnectionAuthStatesList(request, response, connectionAuthStatesMatch[1]);
      return true;
    }
    if (connectionAuthStatesMatch && request.method === 'POST') {
      await handleConnectionAuthStatesCreate(request, response, connectionAuthStatesMatch[1]);
      return true;
    }

    const connectionAuthStateMatch = url.pathname.match(/^\/api\/connections\/([^/]+)\/auth-states\/([^/]+)$/);
    if (connectionAuthStateMatch && request.method === 'DELETE') {
      await handleConnectionAuthStatesDelete(request, response, connectionAuthStateMatch[1], connectionAuthStateMatch[2]);
      return true;
    }

    const captureSessionsMatch = url.pathname.match(/^\/api\/connections\/([^/]+)\/capture-sessions$/);
    if (captureSessionsMatch && request.method === 'GET') {
      await handleCaptureSessionList(request, response, captureSessionsMatch[1]);
      return true;
    }
    if (captureSessionsMatch && request.method === 'POST') {
      await handleCaptureSessionStart(request, response, captureSessionsMatch[1]);
      return true;
    }

    const captureSessionMatch = url.pathname.match(/^\/api\/connections\/([^/]+)\/capture-sessions\/([^/]+)$/);
    if (captureSessionMatch && request.method === 'GET') {
      await handleCaptureSessionGet(request, response, captureSessionMatch[1], captureSessionMatch[2]);
      return true;
    }
    if (captureSessionMatch && request.method === 'DELETE') {
      await handleCaptureSessionCancel(request, response, captureSessionMatch[1], captureSessionMatch[2]);
      return true;
    }

    const captureSessionActionMatch = url.pathname.match(/^\/api\/connections\/([^/]+)\/capture-sessions\/([^/]+)\/actions$/);
    if (captureSessionActionMatch && request.method === 'POST') {
      await handleCaptureSessionAction(request, response, captureSessionActionMatch[1], captureSessionActionMatch[2]);
      return true;
    }

    const captureSessionFinalizeMatch = url.pathname.match(/^\/api\/connections\/([^/]+)\/capture-sessions\/([^/]+)\/finalize$/);
    if (captureSessionFinalizeMatch && request.method === 'POST') {
      await handleCaptureSessionFinalize(request, response, captureSessionFinalizeMatch[1], captureSessionFinalizeMatch[2]);
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

export async function handleFrontendRequest(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean> {
  if (request.method !== 'GET') {
    return false;
  }

  const staticAssets: Record<string, { filePath: string; contentType: string }> = {
    '/favicon.ico': { filePath: 'favicon.ico', contentType: 'image/x-icon' },
    '/assets/brand/favicon-16x16.png': { filePath: 'public/brand/favicon-16x16.png', contentType: 'image/png' },
    '/assets/brand/favicon-32x32.png': { filePath: 'public/brand/favicon-32x32.png', contentType: 'image/png' },
    '/assets/brand/apple-touch-icon.png': { filePath: 'public/brand/apple-touch-icon.png', contentType: 'image/png' },
    '/assets/brand/android-chrome-192x192.png': { filePath: 'public/brand/android-chrome-192x192.png', contentType: 'image/png' },
    '/assets/brand/android-chrome-512x512.png': { filePath: 'public/brand/android-chrome-512x512.png', contentType: 'image/png' },
    '/assets/brand/site.webmanifest': { filePath: 'public/brand/site.webmanifest', contentType: 'application/manifest+json' },
  };

  const asset = staticAssets[url.pathname];
  if (asset) {
    await writeStaticFile(response, path.join(process.cwd(), asset.filePath), asset.contentType);
    return true;
  }

  if (url.pathname === '/' || url.pathname === '') {
    writeHtml(response, 200, LANDING_PAGE_HTML);
    return true;
  }

  if (url.pathname === '/app' || url.pathname === '/app/') {
    const auth = await getAuthContext(request);
    if (auth) {
      writeRedirect(response, '/dashboard');
      return true;
    }

    writeHtml(response, 200, PUBLIC_APP_HTML);
    return true;
  }

  if (url.pathname === '/sign-in' || url.pathname === '/sign-in/') {
    const auth = await getAuthContext(request);
    if (auth) {
      writeRedirect(response, '/dashboard');
      return true;
    }

    writeHtml(response, 200, PUBLIC_APP_HTML);
    return true;
  }

  if (url.pathname === '/dashboard' || url.pathname === '/dashboard/') {
    const auth = await getAuthContext(request);
    if (!auth) {
      writeRedirect(response, '/sign-in');
      return true;
    }

    writeHtml(response, 200, DASHBOARD_APP_HTML);
    return true;
  }

  return false;
}

export const __testables = {
  normalizeHost,
  normalizePathPrefix,
  isUrlAllowedByPolicy,
  redactAuditDetails,
  accountApiPathAllowed,
  secretApiPathAllowed,
};
