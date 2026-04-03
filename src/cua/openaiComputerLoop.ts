import OpenAI from 'openai';
import { chromium, type BrowserContext, type Page } from 'playwright';
import { config } from '../config.js';
import type { CuaRunRecord } from './types.js';
import { resolveExecutionArtifacts } from '../security/secretBoundary.js';

export type PushEvent = (run: CuaRunRecord, type: string, payload: Record<string, unknown>) => void;

function extractAssistantText(response: any): string {
  const output = Array.isArray(response?.output) ? response.output : [];
  const texts: string[] = [];
  for (const item of output) {
    if (item?.type !== 'message') continue;
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === 'output_text' && typeof part?.text === 'string' && part.text.trim()) {
        texts.push(part.text.trim());
      }
    }
  }
  return texts.join('\n\n');
}

function normalizePlaywrightKey(key: string): string {
  const value = key.trim().toUpperCase();
  const map: Record<string, string> = {
    ALT: 'Alt',
    ALTGRAPH: 'Alt',
    APPS: 'ContextMenu',
    BROWSERBACK: 'BrowserBack',
    BROWSERFORWARD: 'BrowserForward',
    BROWSERHOME: 'BrowserHome',
    BROWSERREFRESH: 'BrowserRefresh',
    BROWSERSEARCH: 'BrowserSearch',
    BROWSERSTOP: 'BrowserStop',
    DEL: 'Delete',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    PGDOWN: 'PageDown',
    PGUP: 'PageUp',
    ARROWDOWN: 'ArrowDown',
    ARROWLEFT: 'ArrowLeft',
    ARROWRIGHT: 'ArrowRight',
    ARROWUP: 'ArrowUp',
    BACKSPACE: 'Backspace',
    CMD: 'Meta',
    COMMAND: 'Meta',
    COMMANDORCONTROL: 'ControlOrMeta',
    CONTROL: 'Control',
    CONTROLORMETA: 'ControlOrMeta',
    CTRL: 'Control',
    DELETE: 'Delete',
    ENTER: 'Enter',
    F5: 'F5',
    GOHOME: 'BrowserHome',
    GOBACK: 'BrowserBack',
    GOFORWARD: 'BrowserForward',
    ESC: 'Escape',
    ESCAPE: 'Escape',
    INS: 'Insert',
    META: 'Meta',
    OS: 'Meta',
    OPTION: 'Alt',
    RIGHT: 'ArrowRight',
    RETURN: 'Enter',
    SHIFT: 'Shift',
    SPACEBAR: ' ',
    SPACE: ' ',
    TAB: 'Tab',
    UP: 'ArrowUp',
  };
  return map[value] || key;
}

function extractNormalizedKeys(action: any): string[] {
  if (String(action?.type || '') !== 'keypress') {
    return [];
  }

  const rawValues = Array.isArray(action?.keys)
    ? action.keys.map((k: any) => String(k))
    : [String(action?.key ?? '')];

  const expanded = rawValues
    .flatMap((value: string) => value.split('+'))
    .map((value: string) => normalizePlaywrightKey(value))
    .map((value: string) => value.trim())
    .filter(Boolean);

  return expanded;
}

function summarizeActions(actions: any[]): string {
  return actions.map((a) => String(a?.type || 'unknown')).join(' -> ');
}

function isUrlLike(value: string): boolean {
  const text = value.trim().toLowerCase();
  return text.startsWith('http://') || text.startsWith('https://') || text.startsWith('view-source:http://') || text.startsWith('view-source:https://');
}

function isAddressBarShortcut(action: any): boolean {
  const keys = extractNormalizedKeys(action);
  return keys.includes('L') && (keys.includes('Control') || keys.includes('Meta') || keys.includes('ControlOrMeta'));
}

function isReloadShortcut(action: any): boolean {
  const keys = extractNormalizedKeys(action);
  return (
    keys.includes('F5') ||
    keys.includes('BrowserRefresh') ||
    (keys.includes('R') && (keys.includes('Control') || keys.includes('Meta') || keys.includes('ControlOrMeta')))
  );
}

function isEnterPress(action: any): boolean {
  const keys = extractNormalizedKeys(action);
  return keys.length === 1 && keys[0] === 'Enter';
}

function isGoBackShortcut(action: any): boolean {
  const keys = extractNormalizedKeys(action);
  return (
    keys.includes('BrowserBack') ||
    keys.includes('GoBack') ||
    (keys.includes('ArrowLeft') && (keys.includes('Alt') || keys.includes('Control') || keys.includes('Meta') || keys.includes('ControlOrMeta')))
  );
}

function isGoForwardShortcut(action: any): boolean {
  const keys = extractNormalizedKeys(action);
  return (
    keys.includes('BrowserForward') ||
    keys.includes('GoForward') ||
    (keys.includes('ArrowRight') && (keys.includes('Alt') || keys.includes('Control') || keys.includes('Meta') || keys.includes('ControlOrMeta')))
  );
}

function isFindShortcut(action: any): boolean {
  const keys = extractNormalizedKeys(action);
  return keys.includes('F') && (keys.includes('Control') || keys.includes('Meta') || keys.includes('ControlOrMeta'));
}

async function performInPageFindFallback(page: Page, query: string): Promise<{ query: string; matchCount: number; snippets: string[]; scrolledToFirstMatch: boolean }> {
  const result = await page.evaluate((rawQuery) => {
    const query = String(rawQuery || '').trim();
    if (!query) {
      return {
        query,
        matchCount: 0,
        snippets: [] as string[],
        scrolledToFirstMatch: false,
      };
    }

    const lowerQuery = query.toLowerCase();
    const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
    const snippets: string[] = [];
    let matchCount = 0;
    let firstMatchElement: Element | null = null;

    let node: Node | null = walker.nextNode();
    while (node) {
      const text = String(node.textContent || '').trim();
      if (text && text.toLowerCase().includes(lowerQuery)) {
        matchCount += 1;
        if (snippets.length < 5) {
          snippets.push(text.slice(0, 220));
        }
        if (!firstMatchElement) {
          const parent = (node as any).parentElement as Element | null;
          if (parent) {
            firstMatchElement = parent;
          }
        }
      }
      node = walker.nextNode();
    }

    let scrolledToFirstMatch = false;
    if (firstMatchElement) {
      firstMatchElement.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center', inline: 'nearest' });
      scrolledToFirstMatch = true;
    }

    return {
      query,
      matchCount,
      snippets,
      scrolledToFirstMatch,
    };
  }, query);

  return {
    query: String(result.query || ''),
    matchCount: Number(result.matchCount || 0),
    snippets: Array.isArray(result.snippets) ? result.snippets.map((s: any) => String(s)) : [],
    scrolledToFirstMatch: Boolean(result.scrolledToFirstMatch),
  };
}

function isBrowserHomeShortcut(action: any): boolean {
  const keys = extractNormalizedKeys(action);
  return keys.includes('BrowserHome') || keys.includes('GoHome');
}

function getReasoningEffortForModel(model: string): string {
  const normalized = model.toLowerCase();
  if (normalized.includes('computer-use-preview')) {
    return 'medium';
  }
  return config.cuaReasoningEffort;
}

async function capturePageImageDataUrl(
  page: Page,
  options?: {
    onDiagnostic?: (type: string, payload: Record<string, unknown>) => void;
    turn?: number;
  },
): Promise<string> {
  const emit = options?.onDiagnostic;
  const turn = options?.turn;
  const screenshotAttempts: Array<{
    label: string;
    mime: 'image/png' | 'image/jpeg';
    opts: Parameters<Page['screenshot']>[0];
  }> = [
    { label: 'png_viewport', mime: 'image/png', opts: { type: 'png', fullPage: false } },
    { label: 'jpeg_viewport', mime: 'image/jpeg', opts: { type: 'jpeg', quality: 85, fullPage: false } },
  ];

  const errors: string[] = [];
  for (const attempt of screenshotAttempts) {
    try {
      const image = await page.screenshot(attempt.opts as any);
      return `data:${attempt.mime};base64,${image.toString('base64')}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${attempt.label}: ${message}`);
      emit?.('screenshot_capture_attempt_failed', {
        turn,
        attempt: attempt.label,
        error: message,
      });
    }
  }

  const currentUrl = page.url();
  if (currentUrl.startsWith('view-source:http://') || currentUrl.startsWith('view-source:https://')) {
    const targetUrl = currentUrl.replace(/^view-source:/, '');
    try {
      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.browserNavigationTimeoutMs,
      });
      await waitForPageSettled(page);
      const image = await page.screenshot({ type: 'png', fullPage: false });
      emit?.('screenshot_capture_fallback_navigated', {
        turn,
        from: currentUrl,
        to: targetUrl,
        reason: 'view_source_not_screenshotable',
      });
      return `data:image/png;base64,${image.toString('base64')}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`view_source_fallback: ${message}`);
      emit?.('screenshot_capture_fallback_failed', {
        turn,
        strategy: 'view_source_navigation',
        error: message,
      });
    }
  }

  emit?.('screenshot_capture_fallback_exhausted', {
    turn,
    reason: 'capture_failed_without_safe_fallback',
    errors,
  });
  throw new Error(`Screenshot capture failed after all fallback strategies: ${errors.join(' | ')}`);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

async function waitForPageSettled(page: Page): Promise<void> {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: config.browserNavigationTimeoutMs });
  } catch {
    // Continue with diagnostics even if state wait times out.
  }

  try {
    await page.waitForLoadState('networkidle', { timeout: Math.min(config.browserNavigationTimeoutMs, 8000) });
  } catch {
    // Network idle is frequently unavailable on modern sites.
  }
}

async function collectPageDiagnostics(page: Page): Promise<Record<string, unknown>> {
  const url = page.url();
  let title = '';
  try {
    title = await page.title();
  } catch {
    // Ignore title errors.
  }

  const dom = await page
    .evaluate(() => {
      const bodyText = (document.body?.innerText || '').trim();
      const htmlText = (document.documentElement?.innerText || '').trim();
      const challengeHints = [
        'captcha',
        'cf-challenge',
        'attention required',
        'verify you are human',
        'cloudflare',
        'akamai',
      ];
      const combined = `${document.title} ${bodyText.slice(0, 2000)}`.toLowerCase();
      const matchedHints = challengeHints.filter((hint) => combined.includes(hint));

      return {
        readyState: document.readyState,
        bodyTextLength: bodyText.length,
        htmlTextLength: htmlText.length,
        visibleNodeCount: document.querySelectorAll('body *').length,
        matchedHints,
      };
    })
    .catch(() => ({
      readyState: 'unknown',
      bodyTextLength: 0,
      htmlTextLength: 0,
      visibleNodeCount: 0,
      matchedHints: [],
    }));

  const blankLike =
    String(url || '').startsWith('http') &&
    Number(dom.bodyTextLength || 0) < 20 &&
    Number(dom.visibleNodeCount || 0) < 10;

  return {
    url,
    title,
    ...dom,
    blankLike,
  };
}

function isLikelyLoginPage(url: string, title: string, diagnostics: Record<string, unknown>): boolean {
  const haystack = `${url} ${title} ${JSON.stringify(diagnostics.matchedHints || [])}`.toLowerCase();
  return /(login|log-in|signin|sign-in|sso|authenticate|auth|account)/.test(haystack);
}

function parseJsonSafely(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function applyAuthStateToPage(
  context: BrowserContext,
  page: Page,
  targetUrl: string,
  authState: { stateType: string; plaintext: string },
): Promise<{ applied: boolean; details: Record<string, unknown> }> {
  const stateType = String(authState.stateType || '').toLowerCase();
  const parsed = parseJsonSafely(authState.plaintext);

  if (stateType.includes('playwright') || stateType.includes('storage')) {
    const cookies = Array.isArray((parsed as any)?.cookies) ? (parsed as any).cookies : [];
    if (cookies.length > 0) {
      await context.addCookies(cookies as any);
    }

    const origins = Array.isArray((parsed as any)?.origins) ? (parsed as any).origins : [];
    const targetOrigin = new URL(targetUrl).origin;
    const matchingOrigin = origins.find((entry: any) => String(entry?.origin || '') === targetOrigin);
    if (matchingOrigin && Array.isArray(matchingOrigin.localStorage) && matchingOrigin.localStorage.length > 0) {
      const storageEntries = matchingOrigin.localStorage.map((entry: any) => ({
        name: String(entry?.name || ''),
        value: String(entry?.value || ''),
      })).filter((entry: any) => entry.name);
      if (storageEntries.length > 0) {
        await page.evaluate((entries) => {
          for (const entry of entries as Array<{ name: string; value: string }>) {
            window.localStorage.setItem(entry.name, entry.value);
          }
        }, storageEntries);
      }
    }

    return {
      applied: cookies.length > 0 || Boolean(matchingOrigin),
      details: {
        stateType,
        cookieCount: cookies.length,
        localStorageApplied: Boolean(matchingOrigin),
      },
    };
  }

  if (stateType.includes('cookie')) {
    const cookies = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as any)?.cookies)
        ? (parsed as any).cookies
        : [];
    if (cookies.length > 0) {
      await context.addCookies(cookies as any);
      return {
        applied: true,
        details: {
          stateType,
          cookieCount: cookies.length,
        },
      };
    }
  }

  return {
    applied: false,
    details: {
      stateType,
      reason: 'unsupported_auth_state_format',
    },
  };
}

async function autofillApprovedSecrets(
  page: Page,
  secrets: Array<{ secretType: string; plaintext: string }>,
): Promise<{ filledTypes: string[]; loginLike: boolean }> {
  const valueByType = new Map(secrets.map((secret) => [secret.secretType, secret.plaintext]));

  const result = await page.evaluate((values) => {
    const entries = Object.fromEntries(values as Array<[string, string]>);
    const isVisible = (element: Element | null): element is HTMLElement => {
      if (!element || !(element instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null;
    };

    const inputs = Array.from(document.querySelectorAll('input, textarea')).filter(isVisible);
    const classify = (el: HTMLInputElement | HTMLTextAreaElement) => {
      const haystack = [
        el.getAttribute('type') || '',
        el.getAttribute('name') || '',
        el.getAttribute('id') || '',
        el.getAttribute('placeholder') || '',
        el.getAttribute('autocomplete') || '',
        el.getAttribute('aria-label') || '',
      ].join(' ').toLowerCase();

      if (/(password|current-password|new-password)/.test(haystack)) return 'password';
      if (/(one-time|otp|verification|2fa|two-factor|auth code|passcode)/.test(haystack)) return 'otp';
      if (/(api key|apikey|token|bearer|access token)/.test(haystack)) return 'api_token';
      if (/(user|email|login|identifier|account)/.test(haystack)) return 'username';
      return null;
    };

    const fillField = (target: HTMLInputElement | HTMLTextAreaElement | undefined, value: string | undefined) => {
      if (!target || !value) return false;
      target.focus();
      target.value = value;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };

    const groups: Record<string, Array<HTMLInputElement | HTMLTextAreaElement>> = {
      username: [],
      password: [],
      otp: [],
      api_token: [],
    };

    for (const input of inputs as Array<HTMLInputElement | HTMLTextAreaElement>) {
      const kind = classify(input);
      if (kind) groups[kind].push(input);
    }

    const filledTypes: string[] = [];
    if (fillField(groups.username[0], entries.username)) filledTypes.push('username');
    if (fillField(groups.password[0], entries.password)) filledTypes.push('password');
    if (fillField(groups.otp[0], entries.otp)) filledTypes.push('otp');
    if (fillField(groups.api_token[0], entries.api_token)) filledTypes.push('api_token');

    return {
      filledTypes,
      loginLike: groups.password.length > 0 || groups.username.length > 0 || groups.otp.length > 0,
    };
  }, Array.from(valueByType.entries()));

  return {
    filledTypes: Array.isArray(result.filledTypes) ? result.filledTypes.map((entry: any) => String(entry)) : [],
    loginLike: Boolean(result.loginLike),
  };
}

async function executeComputerAction(page: Page, action: any): Promise<void> {
  const type = String(action?.type || '');
  const x = Number(action?.x ?? 0);
  const y = Number(action?.y ?? 0);
  const buttonValue = action?.button;
  const button =
    buttonValue === 'right' || buttonValue === 2 || buttonValue === 3
      ? 'right'
      : buttonValue === 'middle' || buttonValue === 'wheel'
        ? 'middle'
        : 'left';

  switch (type) {
    case 'click': {
      await page.mouse.click(x, y, { button });
      break;
    }
    case 'double_click': {
      await page.mouse.dblclick(x, y, { button });
      break;
    }
    case 'move': {
      await page.mouse.move(x, y);
      break;
    }
    case 'drag': {
      const path = Array.isArray(action?.path) ? action.path : [];
      if (path.length > 0) {
        const points = path
          .map((p: any) => ({ x: Number(p?.x ?? 0), y: Number(p?.y ?? 0) }))
          .filter((p: any) => Number.isFinite(p.x) && Number.isFinite(p.y));
        if (points.length > 0) {
          await page.mouse.move(points[0].x, points[0].y);
          await page.mouse.down({ button });
          for (const point of points.slice(1)) {
            await page.mouse.move(point.x, point.y);
          }
          await page.mouse.up({ button });
          break;
        }
      }
      await page.mouse.move(x, y);
      await page.mouse.down({ button });
      await page.mouse.up({ button });
      break;
    }
    case 'scroll': {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        await page.mouse.move(x, y);
      }
      await page.mouse.wheel(Number(action?.delta_x ?? action?.deltaX ?? 0), Number(action?.delta_y ?? action?.deltaY ?? action?.scroll_y ?? 0));
      break;
    }
    case 'type': {
      await page.keyboard.type(String(action?.text ?? ''));
      break;
    }
    case 'keypress': {
      const keys = extractNormalizedKeys(action);
      if (keys.length === 0) {
        throw new Error('keypress action did not include a key value.');
      }
      await page.keyboard.press(keys.join('+'));
      break;
    }
    case 'wait': {
      const ms = Number(action?.ms ?? action?.duration_ms ?? 1000);
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
      break;
    }
    case 'screenshot': {
      break;
    }
    default:
      throw new Error(`Unsupported computer action: ${type}`);
  }
}

export async function runOpenAiComputerLoop(
  run: CuaRunRecord,
  openAiApiKey: string,
  pushEvent: PushEvent,
  isInterrupted: (runId: string) => boolean,
  consumeSteering: (runId: string) => Array<{ message: string; mode: 'append' | 'replace_goal'; source: 'user' | 'agent'; timestamp: string }>,
): Promise<{ finalMessage?: string; blockedReason?: string }> {
  const client = new OpenAI({ apiKey: openAiApiKey });
  const browser = await chromium.launch({
    headless: config.browserHeadless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
    ],
  });
  const context = await browser.newContext({
    viewport: { width: config.browserViewportWidth, height: config.browserViewportHeight },
    locale: config.browserLocale,
    timezoneId: config.browserTimezone,
    ...(config.browserUserAgent ? { userAgent: config.browserUserAgent } : {}),
    extraHTTPHeaders: {
      'Accept-Language': `${config.browserLocale},en;q=0.9`,
    },
  });
  const page = await context.newPage();
  const authApplicationState = {
    authStateIds: new Set<string>(),
    secretFillKeys: new Set<string>(),
    connectionContextLogged: false,
  };
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const maybeApplyConnectionArtifacts = async (turn: number): Promise<{ blocked: boolean; message?: string; notes?: string[] }> => {
    const connectionId = String(run.input.connectionId || '').trim();
    if (!connectionId) {
      return { blocked: false };
    }

    const currentUrl = page.url();
    if (!/^https?:\/\//i.test(currentUrl)) {
      return { blocked: false };
    }

    let artifacts;
    try {
      artifacts = await resolveExecutionArtifacts(run.userId, connectionId, currentUrl, ['cookie_bundle', 'api_token', 'username', 'password', 'otp']);
    } catch (error) {
      pushEvent(run, 'connection_artifact_resolution_denied', {
        turn,
        connectionId,
        url: currentUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return { blocked: false };
    }

    if (!authApplicationState.connectionContextLogged) {
      pushEvent(run, 'connection_context_resolved', {
        turn,
        connectionId: artifacts.connectionId,
        connectionName: artifacts.connectionName,
        connectionBaseHost: artifacts.connectionBaseHost,
        url: currentUrl,
        authStateAvailable: Boolean(artifacts.authState),
        availableSecretTypes: artifacts.secrets.map((secret) => secret.secretType),
        missingSecretTypes: artifacts.missing,
      });
      authApplicationState.connectionContextLogged = true;
    }

    const notes: string[] = [];
    if (artifacts.authState && !authApplicationState.authStateIds.has(artifacts.authState.id)) {
      const applied = await applyAuthStateToPage(context, page, currentUrl, artifacts.authState);
      pushEvent(run, 'connection_auth_state_applied', {
        turn,
        connectionId: artifacts.connectionId,
        connectionName: artifacts.connectionName,
        connectionBaseHost: artifacts.connectionBaseHost,
        url: currentUrl,
        authStateId: artifacts.authState.id,
        applied: applied.applied,
        ...applied.details,
      });
      if (applied.applied) {
        authApplicationState.authStateIds.add(artifacts.authState.id);
        await page.reload({ waitUntil: 'domcontentloaded', timeout: config.browserNavigationTimeoutMs }).catch(() => undefined);
        await waitForPageSettled(page);
        notes.push('Harness note: An approved saved auth state was applied for this connection on the current allowed URL.');
      }
    }

    const diagnostics = await collectPageDiagnostics(page);
    const loginLike = isLikelyLoginPage(String(diagnostics.url || currentUrl), String(diagnostics.title || ''), diagnostics);
    const fillKey = `${currentUrl}`;
    const hasAnyManualSecret = artifacts.secrets.some((secret) => ['username', 'password', 'otp', 'api_token'].includes(secret.secretType));

    if (loginLike && !authApplicationState.secretFillKeys.has(fillKey) && hasAnyManualSecret) {
      const fillResult = await autofillApprovedSecrets(page, artifacts.secrets);
      pushEvent(run, 'connection_secret_fill_applied', {
        turn,
        connectionId: artifacts.connectionId,
        connectionName: artifacts.connectionName,
        connectionBaseHost: artifacts.connectionBaseHost,
        url: currentUrl,
        filledTypes: fillResult.filledTypes,
        loginLike: fillResult.loginLike,
      });
      if (fillResult.filledTypes.length > 0) {
        authApplicationState.secretFillKeys.add(fillKey);
        notes.push(`Harness note: Approved secret references were autofilled for fields: ${fillResult.filledTypes.join(', ')} on the current allowed login page.`);
      }
    }

    if (loginLike && !artifacts.authState && !hasAnyManualSecret) {
      pushEvent(run, 'clarification_required', {
        runId: run.id,
        connectionId: artifacts.connectionId,
        connectionName: artifacts.connectionName,
        connectionBaseHost: artifacts.connectionBaseHost,
        action: 'connection_setup_or_steering_required',
        reason: 'approved_connection_has_no_usable_auth_artifacts',
        url: currentUrl,
        missingSecretTypes: artifacts.missing,
        message: 'This run reached an allowed authentication page, but no usable saved auth state or secret refs are available for the approved connection. Guide the user to configure or refresh the connection before retrying headless execution.',
      });
      return {
        blocked: true,
        message: 'Run paused because the approved connection has no usable auth state or secret refs for this allowed login page.',
        notes,
      };
    }

    return { blocked: false, notes };
  };

  pushEvent(run, 'browser_session_config', {
    headless: config.browserHeadless,
    viewport: {
      width: config.browserViewportWidth,
      height: config.browserViewportHeight,
    },
    locale: config.browserLocale,
    timezone: config.browserTimezone,
    customUserAgent: Boolean(config.browserUserAgent),
  });

  try {
    await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
    pushEvent(run, 'page_diagnostics', {
      stage: 'initial',
      ...(await collectPageDiagnostics(page)),
    });

    const systemPrompt = run.input.systemPrompt ||
      'You are controlling a browser with the built-in computer tool. Use safe, reversible actions first. Ask for handoff before risky or sensitive actions.';

    let previousResponseId: string | undefined;
    const emitScreenshotDiagnostic = (type: string, payload: Record<string, unknown>) => pushEvent(run, type, payload);
    let nextInput: unknown = [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: run.input.task },
          {
            type: 'input_image',
            image_url: await capturePageImageDataUrl(page, {
              onDiagnostic: emitScreenshotDiagnostic,
            }),
            detail: 'original',
          },
        ],
      },
    ];

    for (let turn = 1; turn <= config.cuaMaxTurns; turn += 1) {
      if (isInterrupted(run.id)) {
        return {};
      }

      const steeringItems = consumeSteering(run.id);
      if (steeringItems.length > 0) {
        const steeringText = steeringItems
          .map((item, idx) => {
            const prefix = item.mode === 'replace_goal' ? '[REPLACE GOAL]' : '[APPEND STEERING]';
            return `${idx + 1}. ${prefix} (${item.source}) ${item.message}`;
          })
          .join('\n');

        const steeringPayload = {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Operator steering update (high priority):\n' +
                steeringText +
                '\n\nApply this steering immediately while preserving safety and policy constraints.',
            },
          ],
        };

        if (Array.isArray(nextInput)) {
          nextInput = [steeringPayload, ...nextInput];
        } else {
          nextInput = [steeringPayload, nextInput as any];
        }

        pushEvent(run, 'steering_applied', {
          turn,
          count: steeringItems.length,
          modes: steeringItems.map((item) => item.mode),
          sources: steeringItems.map((item) => item.source),
        });
      }

      const response = await client.responses.create({
        model: config.cuaModel,
        instructions: systemPrompt,
        input: nextInput as any,
        previous_response_id: previousResponseId,
        parallel_tool_calls: false,
        reasoning: { effort: getReasoningEffortForModel(config.cuaModel) as any },
        text: { verbosity: config.cuaTextVerbosity as any },
        tools: [{ type: 'computer' }],
      } as any);

      previousResponseId = response.id;
      pushEvent(run, 'response_turn', {
        turn,
        responseId: response.id,
        status: response.status || null,
        usage: response.usage || null,
      });

      const output = Array.isArray((response as any).output) ? (response as any).output : [];
      const hasToolCalls = output.some((item: any) => item?.type === 'computer_call' || item?.type === 'function_call');

      if (!hasToolCalls) {
        const finalMessage = extractAssistantText(response);
        return { finalMessage };
      }

      const toolOutputs: any[] = [];
      const turnNotes: string[] = [];

      for (const item of output) {
        if (item?.type === 'function_call') {
          toolOutputs.push({
            type: 'function_call_output',
            call_id: item.call_id,
            output: [{ type: 'input_text', text: 'Function tool calls are not enabled in this harness.' }],
          });
          continue;
        }

        if (item?.type !== 'computer_call') {
          continue;
        }

        const checks = Array.isArray(item?.pending_safety_checks) ? item.pending_safety_checks : [];
        if (checks.length > 0) {
          pushEvent(run, 'clarification_required', {
            runId: run.id,
            action: 'call_cua_steer_run_or_cua_interrupt',
            checks,
            reason: 'pending_safety_checks_detected',
            message:
              'Safety checks were returned by the model. In headless mode, provide steering to continue safely or interrupt the run. Credential approvals are not supported.',
          });
          return {
            blockedReason: 'pending_safety_checks',
            finalMessage:
              'Run paused for clarification because safety checks were returned. Use cua_steer_run to refine instructions or cua_interrupt to stop.',
          };
        }

        const actions = Array.isArray(item?.actions) ? item.actions : [];
        pushEvent(run, 'computer_call_requested', {
          turn,
          actionCount: actions.length,
          summary: summarizeActions(actions),
          actions,
        });

        for (let index = 0; index < actions.length; index += 1) {
          const action = actions[index];

          // In Playwright page context there is no browser omnibox. Convert
          // common "Ctrl/Cmd+L, type URL, Enter" patterns into page.goto().
          if (
            isAddressBarShortcut(action) &&
            actions[index + 1]?.type === 'type' &&
            typeof actions[index + 1]?.text === 'string' &&
            isUrlLike(String(actions[index + 1].text)) &&
            isEnterPress(actions[index + 2])
          ) {
            const targetUrl = String(actions[index + 1].text).trim();
            try {
              await page.goto(targetUrl, {
                waitUntil: 'domcontentloaded',
                timeout: config.browserNavigationTimeoutMs,
              });
              pushEvent(run, 'navigation_fallback_goto', {
                turn,
                targetUrl,
                reason: 'translated_omnibox_sequence',
              });
            } catch (error) {
              pushEvent(run, 'navigation_fallback_goto_failed', {
                turn,
                targetUrl,
                error: error instanceof Error ? error.message : String(error),
              });
            }
            index += 2;
            await sleep(config.browserPostActionWaitMs);
            if (isInterrupted(run.id)) {
              return {};
            }
            continue;
          }

          // Browsers in this harness may not honor Ctrl/Cmd+R; reload directly.
          if (isReloadShortcut(action)) {
            try {
              await page.reload({
                waitUntil: 'domcontentloaded',
                timeout: config.browserNavigationTimeoutMs,
              });
              pushEvent(run, 'navigation_fallback_reload', {
                turn,
                reason: 'translated_reload_shortcut',
              });
            } catch (error) {
              pushEvent(run, 'navigation_fallback_reload_failed', {
                turn,
                error: error instanceof Error ? error.message : String(error),
              });
            }
            await sleep(config.browserPostActionWaitMs);
            if (isInterrupted(run.id)) {
              return {};
            }
            continue;
          }

          if (isGoBackShortcut(action)) {
            try {
              const navigated = await page.goBack({
                waitUntil: 'domcontentloaded',
                timeout: config.browserNavigationTimeoutMs,
              });
              pushEvent(run, 'navigation_fallback_back', {
                turn,
                reason: 'translated_history_shortcut',
                navigated: Boolean(navigated),
              });
            } catch (error) {
              pushEvent(run, 'navigation_fallback_back_failed', {
                turn,
                error: error instanceof Error ? error.message : String(error),
              });
            }
            await sleep(config.browserPostActionWaitMs);
            if (isInterrupted(run.id)) {
              return {};
            }
            continue;
          }

          if (isGoForwardShortcut(action)) {
            try {
              const navigated = await page.goForward({
                waitUntil: 'domcontentloaded',
                timeout: config.browserNavigationTimeoutMs,
              });
              pushEvent(run, 'navigation_fallback_forward', {
                turn,
                reason: 'translated_history_shortcut',
                navigated: Boolean(navigated),
              });
            } catch (error) {
              pushEvent(run, 'navigation_fallback_forward_failed', {
                turn,
                error: error instanceof Error ? error.message : String(error),
              });
            }
            await sleep(config.browserPostActionWaitMs);
            if (isInterrupted(run.id)) {
              return {};
            }
            continue;
          }

          // Browser-home shortcuts vary by environment. Use direct navigation to
          // the target domain home in current tab for deterministic behavior.
          if (isBrowserHomeShortcut(action)) {
            try {
              const currentUrl = page.url();
              const parsed = new URL(currentUrl);
              const targetUrl = `${parsed.protocol}//${parsed.host}/`;
              await page.goto(targetUrl, {
                waitUntil: 'domcontentloaded',
                timeout: config.browserNavigationTimeoutMs,
              });
              pushEvent(run, 'navigation_fallback_home', {
                turn,
                reason: 'translated_browser_home_shortcut',
                targetUrl,
              });
            } catch (error) {
              pushEvent(run, 'navigation_fallback_home_failed', {
                turn,
                error: error instanceof Error ? error.message : String(error),
              });
            }
            await sleep(config.browserPostActionWaitMs);
            if (isInterrupted(run.id)) {
              return {};
            }
            continue;
          }

          // Ctrl/Cmd+F usually opens in-page find UI that is invisible in some
          // headless contexts. Use deterministic DOM text search fallback.
          if (isFindShortcut(action)) {
            const queryCandidate = actions[index + 1];
            const queryText = queryCandidate?.type === 'type' ? String(queryCandidate?.text || '').trim() : '';

            if (queryText) {
              const findResult = await performInPageFindFallback(page, queryText);
              pushEvent(run, 'find_fallback_results', {
                turn,
                query: findResult.query,
                matchCount: findResult.matchCount,
                scrolledToFirstMatch: findResult.scrolledToFirstMatch,
                snippets: findResult.snippets,
              });
              turnNotes.push(
                `Harness note: Headless Ctrl/Cmd+F was replaced with DOM text search for "${findResult.query}". ` +
                  `Matches: ${findResult.matchCount}. ${findResult.snippets.length > 0 ? `Top snippets: ${findResult.snippets.join(' | ')}` : 'No snippets found.'}`,
              );

              // Consume "type query" and optional Enter after Ctrl/Cmd+F.
              index += 1;
              if (isEnterPress(actions[index + 1])) {
                index += 1;
              }
              continue;
            }

            pushEvent(run, 'keypress_skipped', {
              turn,
              reason: 'find_shortcut_not_reliably_observable_headless',
              keys: extractNormalizedKeys(action),
            });
            turnNotes.push('Harness note: Headless Ctrl/Cmd+F was skipped because no search query was provided in the next action.');
            continue;
          }

          try {
            await executeComputerAction(page, action);
          } catch (error) {
            pushEvent(run, 'computer_action_execution_error', {
              turn,
              actionIndex: index,
              actionType: String(action?.type || 'unknown'),
              action,
              error: error instanceof Error ? error.message : String(error),
            });
            // Continue remaining actions so one unsupported shortcut does not
            // hard-fail the entire run.
            continue;
          }
          await sleep(config.browserPostActionWaitMs);
          if (isInterrupted(run.id)) {
            return {};
          }
        }

        await waitForPageSettled(page);

        const artifactOutcome = await maybeApplyConnectionArtifacts(turn);
        if (artifactOutcome.notes && artifactOutcome.notes.length > 0) {
          turnNotes.push(...artifactOutcome.notes);
        }
        if (artifactOutcome.blocked) {
          return {
            blockedReason: 'missing_connection_auth_artifacts',
            finalMessage: artifactOutcome.message,
          };
        }

        const diagnostics = await collectPageDiagnostics(page);
        pushEvent(run, 'page_diagnostics', {
          stage: 'post_actions',
          turn,
          ...diagnostics,
        });
        if (diagnostics.blankLike) {
          pushEvent(run, 'possible_render_or_bot_block', {
            turn,
            url: diagnostics.url,
            title: diagnostics.title,
            matchedHints: diagnostics.matchedHints,
            bodyTextLength: diagnostics.bodyTextLength,
            visibleNodeCount: diagnostics.visibleNodeCount,
          });
        }

        pushEvent(run, 'computer_actions_executed', {
          turn,
          actionCount: actions.length,
          summary: summarizeActions(actions),
        });

        const frameImage = await capturePageImageDataUrl(page, {
          onDiagnostic: emitScreenshotDiagnostic,
          turn,
        });

        toolOutputs.push({
          type: 'computer_call_output',
          call_id: item.call_id,
          output: {
            type: 'computer_screenshot',
            image_url: frameImage,
          },
        });
      }

      if (turnNotes.length > 0) {
        toolOutputs.push({
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: turnNotes.join('\n\n'),
            },
          ],
        });
      }

      nextInput = toolOutputs;
    }

    throw new Error(`Responses native loop exhausted ${config.cuaMaxTurns} turns without a final assistant message.`);
  } finally {
    await context.close();
    await browser.close();
  }
}
