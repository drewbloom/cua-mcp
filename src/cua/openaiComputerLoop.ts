import OpenAI from 'openai';
import { chromium, type Page } from 'playwright';
import { config } from '../config.js';
import type { CuaRunRecord } from './types.js';

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
  pushEvent: PushEvent,
  waitForApprovalDecision: (runId: string) => Promise<'approved' | 'declined' | 'interrupted'>,
  isInterrupted: (runId: string) => boolean,
): Promise<{ finalMessage?: string }> {
  if (!config.openAiApiKey) {
    throw new Error('OPENAI_API_KEY is required for openai-responses engine.');
  }

  const client = new OpenAI({ apiKey: config.openAiApiKey });
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
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

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
          run.status = 'awaiting_approval';
          pushEvent(run, 'approval_handoff_required', {
            runId: run.id,
            action: 'call_cua_approve_action',
            checks,
          });

          const decision = await waitForApprovalDecision(run.id);
          if (decision !== 'approved') {
            return {};
          }
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
          // headless contexts. Skip this safely and let the model continue.
          if (isFindShortcut(action)) {
            pushEvent(run, 'keypress_skipped', {
              turn,
              reason: 'find_shortcut_not_reliably_observable_headless',
              keys: extractNormalizedKeys(action),
            });
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

      nextInput = toolOutputs;
    }

    throw new Error(`Responses native loop exhausted ${config.cuaMaxTurns} turns without a final assistant message.`);
  } finally {
    await context.close();
    await browser.close();
  }
}
