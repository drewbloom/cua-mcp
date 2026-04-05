import { randomUUID } from 'node:crypto';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { config } from '../config.js';
import { getPool } from '../db/postgres.js';
import { getConnectionPolicyForUser, isUrlAllowedByPolicy } from './secretBoundary.js';

type CaptureStatus = 'starting' | 'ready' | 'failed' | 'completed' | 'cancelled';

type CaptureActionInput =
  | { actionType: 'navigate'; url: string }
  | { actionType: 'click'; x: number; y: number }
  | { actionType: 'type'; text: string }
  | { actionType: 'keypress'; keys: string[] }
  | { actionType: 'scroll'; deltaX?: number; deltaY?: number }
  | { actionType: 'wait'; ms?: number };

export type CaptureSnapshot = {
  sessionId: string;
  status: CaptureStatus;
  currentUrl: string;
  title: string;
  screenshotDataUrl: string | null;
  lastError: string | null;
  startedAt: string;
  updatedAt: string;
  seenUrls: string[];
  discoveredHosts: string[];
  discoveredPathPrefixes: string[];
  endedReason?: string | null;
};

type InternalCaptureSession = {
  id: string;
  userId: string;
  connectionId: string;
  startedAt: string;
  updatedAt: string;
  status: CaptureStatus;
  currentUrl: string;
  title: string;
  screenshotDataUrl: string | null;
  lastError: string | null;
  seenUrls: Set<string>;
  discoveredHosts: Set<string>;
  discoveredPathPrefixes: Set<string>;
  endedReason: string | null;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  timeoutHandle: NodeJS.Timeout | null;
};

const CAPTURE_SESSION_TTL_MS = 15 * 60 * 1000;
const sessions = new Map<string, InternalCaptureSession>();

function isCaptureConnectionFkError(error: unknown): boolean {
  const value = error as { code?: string; constraint?: string } | null;
  return value?.code === '23503' && String(value?.constraint || '').includes('capture_sessions_connection_id_fkey');
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizePlaywrightKey(key: string): string {
  const value = key.trim().toUpperCase();
  const map: Record<string, string> = {
    ALT: 'Alt',
    CTRL: 'Control',
    CONTROL: 'Control',
    CMD: 'Meta',
    COMMAND: 'Meta',
    META: 'Meta',
    SHIFT: 'Shift',
    ESC: 'Escape',
    ENTER: 'Enter',
    RETURN: 'Enter',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    DEL: 'Delete',
    TAB: 'Tab',
    SPACE: ' ',
    SPACEBAR: ' ',
  };
  return map[value] || key;
}

function toPathPrefix(pathname: string): string {
  const clean = pathname.trim() || '/';
  if (clean === '/') return '/';
  const parts = clean.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  return `/${parts[0]}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

async function waitForPageSettled(page: Page): Promise<void> {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: config.browserNavigationTimeoutMs });
  } catch {
    // Continue.
  }
  try {
    await page.waitForLoadState('networkidle', { timeout: Math.min(config.browserNavigationTimeoutMs, 5000) });
  } catch {
    // Continue.
  }
  if (config.browserPostActionWaitMs > 0) {
    await sleep(config.browserPostActionWaitMs);
  }
}

async function captureScreenshot(page: Page): Promise<string> {
  const image = await page.screenshot({ type: 'png', fullPage: false });
  return `data:image/png;base64,${image.toString('base64')}`;
}

function buildSnapshot(session: InternalCaptureSession): CaptureSnapshot {
  return {
    sessionId: session.id,
    status: session.status,
    currentUrl: session.currentUrl,
    title: session.title,
    screenshotDataUrl: session.screenshotDataUrl,
    lastError: session.lastError,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    seenUrls: [...session.seenUrls],
    discoveredHosts: [...session.discoveredHosts],
    discoveredPathPrefixes: [...session.discoveredPathPrefixes],
    endedReason: session.endedReason,
  };
}

async function persistSnapshot(session: InternalCaptureSession): Promise<boolean> {
  const db = getPool();
  try {
    await db.query(
      `
      INSERT INTO capture_sessions (
        id, user_id, connection_id, status, current_url, title,
        screenshot_data_url, last_error, ended_reason,
        seen_urls_json, discovered_hosts_json, discovered_path_prefixes_json,
        started_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13, $14)
      ON CONFLICT (id)
      DO UPDATE SET
        status = EXCLUDED.status,
        current_url = EXCLUDED.current_url,
        title = EXCLUDED.title,
        screenshot_data_url = EXCLUDED.screenshot_data_url,
        last_error = EXCLUDED.last_error,
        ended_reason = EXCLUDED.ended_reason,
        seen_urls_json = EXCLUDED.seen_urls_json,
        discovered_hosts_json = EXCLUDED.discovered_hosts_json,
        discovered_path_prefixes_json = EXCLUDED.discovered_path_prefixes_json,
        updated_at = EXCLUDED.updated_at
      `,
      [
        session.id,
        session.userId,
        session.connectionId,
        session.status,
        session.currentUrl,
        session.title,
        null,
        session.lastError,
        session.endedReason,
        JSON.stringify([...session.seenUrls]),
        JSON.stringify([...session.discoveredHosts]),
        JSON.stringify([...session.discoveredPathPrefixes]),
        session.startedAt,
        session.updatedAt,
      ],
    );
    return true;
  } catch (error) {
    if (isCaptureConnectionFkError(error)) {
      return false;
    }
    throw error;
  }
}

function rowToSnapshot(row: any): CaptureSnapshot {
  return {
    sessionId: String(row.id),
    status: String(row.status) as CaptureStatus,
    currentUrl: String(row.current_url || 'about:blank'),
    title: String(row.title || ''),
    screenshotDataUrl: row.screenshot_data_url ? String(row.screenshot_data_url) : null,
    lastError: row.last_error ? String(row.last_error) : null,
    startedAt: new Date(row.started_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    seenUrls: Array.isArray(row.seen_urls_json) ? row.seen_urls_json.map((value: unknown) => String(value)) : [],
    discoveredHosts: Array.isArray(row.discovered_hosts_json) ? row.discovered_hosts_json.map((value: unknown) => String(value)) : [],
    discoveredPathPrefixes: Array.isArray(row.discovered_path_prefixes_json) ? row.discovered_path_prefixes_json.map((value: unknown) => String(value)) : [],
    endedReason: row.ended_reason ? String(row.ended_reason) : null,
  };
}

async function getPersistedSnapshot(sessionId: string, userId: string, connectionId: string): Promise<CaptureSnapshot | null> {
  const db = getPool();
  const res = await db.query(
    `
    SELECT id, status, current_url, title, screenshot_data_url, last_error, ended_reason,
           seen_urls_json, discovered_hosts_json, discovered_path_prefixes_json,
           started_at, updated_at
    FROM capture_sessions
    WHERE id = $1 AND user_id = $2 AND connection_id = $3
    LIMIT 1
    `,
    [sessionId, userId, connectionId],
  );
  if ((res.rowCount ?? 0) === 0) return null;
  return rowToSnapshot(res.rows[0]);
}

export async function listCaptureSnapshots(params: {
  userId: string;
  connectionId: string;
  limit?: number;
}): Promise<CaptureSnapshot[]> {
  const db = getPool();
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const res = await db.query(
    `
    SELECT id, status, current_url, title, screenshot_data_url, last_error, ended_reason,
           seen_urls_json, discovered_hosts_json, discovered_path_prefixes_json,
           started_at, updated_at
    FROM capture_sessions
    WHERE user_id = $1 AND connection_id = $2
    ORDER BY updated_at DESC
    LIMIT $3
    `,
    [params.userId, params.connectionId, limit],
  );

  return res.rows.map(rowToSnapshot);
}

async function refreshSnapshot(session: InternalCaptureSession): Promise<CaptureSnapshot> {
  session.currentUrl = session.page.url();
  try {
    session.title = await session.page.title();
  } catch {
    session.title = '';
  }
  session.seenUrls.add(session.currentUrl);
  try {
    const parsed = new URL(session.currentUrl);
    session.discoveredHosts.add(parsed.host.toLowerCase());
    session.discoveredPathPrefixes.add(toPathPrefix(parsed.pathname));
  } catch {
    // Ignore non-http URLs.
  }
  session.screenshotDataUrl = await captureScreenshot(session.page);
  session.updatedAt = nowIso();
  await persistSnapshot(session);
  return buildSnapshot(session);
}

async function closeSession(session: InternalCaptureSession): Promise<void> {
  if (session.timeoutHandle) {
    clearTimeout(session.timeoutHandle);
    session.timeoutHandle = null;
  }
  session.updatedAt = nowIso();
  try {
    await persistSnapshot(session);
  } catch {
    // Ignore persistence failures while closing in-memory browser resources.
  }
  try {
    await session.page.close();
  } catch {
    // Ignore.
  }
  try {
    await session.context.close();
  } catch {
    // Ignore.
  }
  try {
    await session.browser.close();
  } catch {
    // Ignore.
  }
  sessions.delete(session.id);
}

function armExpiry(session: InternalCaptureSession): void {
  if (session.timeoutHandle) {
    clearTimeout(session.timeoutHandle);
  }
  session.timeoutHandle = setTimeout(() => {
    session.status = 'cancelled';
    session.endedReason = 'timeout';
    if (!session.lastError) {
      session.lastError = 'Capture session timed out after inactivity. Start a new session to continue.';
    }
    void closeSession(session).catch(() => {
      sessions.delete(session.id);
    });
  }, CAPTURE_SESSION_TTL_MS);
}

export async function cancelActiveCaptureSessionsForConnection(params: {
  userId: string;
  connectionId: string;
  endedReason?: string;
}): Promise<void> {
  const endedReason = String(params.endedReason || 'connection_deleted').trim() || 'connection_deleted';
  const pending = [...sessions.values()].filter(
    (session) => session.userId === params.userId && session.connectionId === params.connectionId,
  );
  for (const session of pending) {
    session.status = 'cancelled';
    session.endedReason = endedReason;
    if (!session.lastError) {
      session.lastError = endedReason === 'connection_deleted'
        ? 'Capture session ended because the connection was deleted.'
        : 'Capture session ended.';
    }
    try {
      await closeSession(session);
    } catch {
      sessions.delete(session.id);
    }
  }
}

function getSession(sessionId: string, userId: string, connectionId: string): InternalCaptureSession {
  const session = sessions.get(sessionId);
  if (!session || session.userId !== userId || session.connectionId !== connectionId) {
    throw new Error('Capture session is no longer active');
  }
  return session;
}

export async function recoverPersistedCaptureSessions(): Promise<void> {
  const db = getPool();
  await db.query(
    `
    UPDATE capture_sessions
    SET status = 'cancelled',
        ended_reason = COALESCE(ended_reason, 'server_restart'),
        last_error = CASE
          WHEN last_error IS NULL OR last_error = '' THEN 'Capture session ended because the server restarted. Start a new capture session.'
          ELSE last_error
        END,
        updated_at = NOW()
    WHERE status IN ('starting', 'ready')
    `,
  );
}

export async function startCaptureSession(params: {
  userId: string;
  connectionId: string;
  startUrl: string;
}): Promise<CaptureSnapshot> {
  const policy = await getConnectionPolicyForUser(params.userId, params.connectionId);
  if (!policy) {
    throw new Error('Connection not found');
  }
  if (!isUrlAllowedByPolicy(params.startUrl, policy)) {
    throw new Error('Start URL is not allowed for this connection policy');
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-background-networking',
      '--disable-default-apps',
    ],
  });

  const context = await browser.newContext({
    viewport: {
      width: config.browserViewportWidth,
      height: config.browserViewportHeight,
    },
    locale: config.browserLocale,
    timezoneId: config.browserTimezone,
    ...(config.browserUserAgent ? { userAgent: config.browserUserAgent } : {}),
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();
  const session: InternalCaptureSession = {
    id: randomUUID(),
    userId: params.userId,
    connectionId: params.connectionId,
    startedAt: nowIso(),
    updatedAt: nowIso(),
    status: 'starting',
    currentUrl: 'about:blank',
    title: '',
    screenshotDataUrl: null,
    lastError: null,
    seenUrls: new Set<string>(),
    discoveredHosts: new Set<string>(),
    discoveredPathPrefixes: new Set<string>(),
    endedReason: null,
    browser,
    context,
    page,
    timeoutHandle: null,
  };

  sessions.set(session.id, session);
  armExpiry(session);
  await persistSnapshot(session);

  try {
    await page.goto(params.startUrl, { waitUntil: 'domcontentloaded', timeout: config.browserNavigationTimeoutMs });
    await waitForPageSettled(page);
    session.status = 'ready';
    return await refreshSnapshot(session);
  } catch (error: any) {
    session.status = 'failed';
    session.lastError = String(error?.message || error || 'Failed to start capture session');
    session.updatedAt = nowIso();
    session.endedReason = 'startup_failed';
    await persistSnapshot(session);
    return buildSnapshot(session);
  }
}

export async function getCaptureSnapshot(params: { userId: string; connectionId: string; sessionId: string }): Promise<CaptureSnapshot> {
  const session = sessions.get(params.sessionId);
  if (!session || session.userId !== params.userId || session.connectionId !== params.connectionId) {
    const persisted = await getPersistedSnapshot(params.sessionId, params.userId, params.connectionId);
    if (!persisted) {
      throw new Error('Capture session not found');
    }
    return persisted;
  }
  armExpiry(session);
  return await refreshSnapshot(session);
}

export async function performCaptureAction(params: {
  userId: string;
  connectionId: string;
  sessionId: string;
  action: CaptureActionInput;
}): Promise<CaptureSnapshot> {
  const session = getSession(params.sessionId, params.userId, params.connectionId);
  armExpiry(session);
  const policy = await getConnectionPolicyForUser(params.userId, params.connectionId);
  if (!policy) {
    throw new Error('Connection not found');
  }

  try {
    switch (params.action.actionType) {
      case 'navigate': {
        if (!isUrlAllowedByPolicy(params.action.url, policy)) {
          throw new Error('Capture navigation URL is not allowed for this connection policy');
        }
        await session.page.goto(params.action.url, { waitUntil: 'domcontentloaded', timeout: config.browserNavigationTimeoutMs });
        break;
      }
      case 'click': {
        await session.page.mouse.click(params.action.x, params.action.y);
        break;
      }
      case 'type': {
        await session.page.keyboard.type(params.action.text, { delay: 20 });
        break;
      }
      case 'keypress': {
        const keys = params.action.keys.map(normalizePlaywrightKey).filter(Boolean);
        if (keys.length > 0) {
          await session.page.keyboard.press(keys.join('+'));
        }
        break;
      }
      case 'scroll': {
        await session.page.mouse.wheel(params.action.deltaX || 0, params.action.deltaY || 600);
        break;
      }
      case 'wait': {
        await sleep(Math.min(Math.max(params.action.ms || 1000, 0), 10000));
        break;
      }
    }
    await waitForPageSettled(session.page);
    session.status = 'ready';
    session.lastError = null;
  } catch (error: any) {
    session.status = 'failed';
    session.lastError = String(error?.message || error || 'Capture action failed');
    session.endedReason = 'action_failed';
  }

  return await refreshSnapshot(session);
}

export async function finalizeCaptureSession(params: { userId: string; connectionId: string; sessionId: string }): Promise<{
  snapshot: CaptureSnapshot;
  storageStateJson: string;
}> {
  const session = getSession(params.sessionId, params.userId, params.connectionId);
  armExpiry(session);
  const storageState = await session.context.storageState();
  session.status = 'completed';
  session.endedReason = 'finalized';
  const snapshot = await refreshSnapshot(session);
  await closeSession(session);
  return {
    snapshot,
    storageStateJson: JSON.stringify(storageState),
  };
}

export async function cancelCaptureSession(params: { userId: string; connectionId: string; sessionId: string }): Promise<void> {
  const session = getSession(params.sessionId, params.userId, params.connectionId);
  session.status = 'cancelled';
  session.endedReason = 'cancelled_by_user';
  await closeSession(session);
}
