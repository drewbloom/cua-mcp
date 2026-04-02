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
    ARROWDOWN: 'ArrowDown',
    ARROWLEFT: 'ArrowLeft',
    ARROWRIGHT: 'ArrowRight',
    ARROWUP: 'ArrowUp',
    BACKSPACE: 'Backspace',
    CMD: 'Meta',
    COMMAND: 'Meta',
    CONTROL: 'Control',
    CTRL: 'Control',
    DELETE: 'Delete',
    ENTER: 'Enter',
    ESC: 'Escape',
    ESCAPE: 'Escape',
    META: 'Meta',
    OPTION: 'Alt',
    RETURN: 'Enter',
    SHIFT: 'Shift',
    SPACE: ' ',
    TAB: 'Tab',
  };
  return map[value] || key;
}

function summarizeActions(actions: any[]): string {
  return actions.map((a) => String(a?.type || 'unknown')).join(' -> ');
}

function getReasoningEffortForModel(model: string): string {
  const normalized = model.toLowerCase();
  if (normalized.includes('computer-use-preview')) {
    return 'medium';
  }
  return config.cuaReasoningEffort;
}

async function capturePageImageDataUrl(page: Page): Promise<string> {
  const screenshot = await page.screenshot({ fullPage: true, type: 'png' });
  return `data:image/png;base64,${screenshot.toString('base64')}`;
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
      const keys = Array.isArray(action?.keys)
        ? action.keys.map((k: any) => normalizePlaywrightKey(String(k))).filter(Boolean)
        : [normalizePlaywrightKey(String(action?.key ?? ''))].filter(Boolean);
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
    let nextInput: unknown = [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: run.input.task },
          { type: 'input_image', image_url: await capturePageImageDataUrl(page), detail: 'original' },
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

        for (const action of actions) {
          await executeComputerAction(page, action);
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

        toolOutputs.push({
          type: 'computer_call_output',
          call_id: item.call_id,
          output: {
            type: 'computer_screenshot',
            image_url: await capturePageImageDataUrl(page),
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
