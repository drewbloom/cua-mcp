import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { cuaRuntime } from '../cua/runtime.js';
import { config } from '../config.js';
import { CUA_WIDGET_HTML, CUA_WIDGET_URI } from '../ui/cuaWidgetHtml.js';
import type { McpAuthContext } from '../auth/mcpAuth.js';
import {
  CUA_ORCHESTRATION_QUICKSTART_TEXT,
  CUA_ORCHESTRATION_QUICKSTART_TITLE,
  CUA_ORCHESTRATION_QUICKSTART_URI,
} from '../resources/cuaDelegationGuide.js';

function extractReferencedConnectionIds(input: unknown): string[] {
  if (!input || typeof input !== 'object') return [];
  const record = input as Record<string, unknown>;
  const ids = new Set<string>();

  const direct = String(record.connectionId || '').trim();
  if (direct) ids.add(direct);

  const list = record.connectionIds;
  if (Array.isArray(list)) {
    for (const entry of list) {
      const value = String(entry || '').trim();
      if (value) ids.add(value);
    }
  }

  return [...ids];
}

function enforceConnectionScope(authContext: McpAuthContext, input: unknown): { ok: true } | { ok: false; deniedIds: string[] } {
  if (!authContext.allowedConnectionIds.length) return { ok: true };
  const referencedIds = extractReferencedConnectionIds(input);
  if (!referencedIds.length) return { ok: true };

  const allowed = new Set(authContext.allowedConnectionIds);
  const deniedIds = referencedIds.filter((id) => !allowed.has(id));
  if (deniedIds.length) {
    return { ok: false, deniedIds };
  }

  return { ok: true };
}

export function registerCuaTools(server: McpServer, authContext: McpAuthContext): void {
  server.registerResource(
    'cua-orchestration-quickstart',
    CUA_ORCHESTRATION_QUICKSTART_URI,
    {
      title: CUA_ORCHESTRATION_QUICKSTART_TITLE,
      description: 'Quickstart for CUA orchestration, prompting patterns, await loop usage, and handoff controls.',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: CUA_ORCHESTRATION_QUICKSTART_TEXT,
          mimeType: 'text/markdown',
        },
      ],
    }),
  );

  registerAppResource(
    server,
    'cua-run-widget',
    CUA_WIDGET_URI,
    {},
    async () => ({
      contents: [
        {
          uri: CUA_WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: CUA_WIDGET_HTML,
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
            },
            'openai/widgetDescription': 'CUA run status and summary console.',
          },
        },
      ],
    }),
  );

  registerAppTool(
    server,
    'cua_run_task',
    {
      title: 'CUA Run Task',
      description:
        'Starts a persistent CUA run using the configured engine and returns a run id for orchestration. Environment defaults to web. Recommended sequence: 1) call cua_get_orchestration_guide, 2) call cua_preflight, 3) call cua_run_task, 4) loop on cua_await, 5) use cua_steer_run to redirect when drift occurs, 6) when clarification or interruption signals appear, either steer or interrupt, 7) when terminal, call cua_get_run once and stop. Prefer search-first discovery when no direct URL is provided, then prioritize task-specific authoritative sources over generic homepage browsing. Keep task instructions concrete: objective, allowed domains, stop condition, and output contract. If the run should use an approved authenticated connection, pass connectionId so the runtime can apply that user-owned auth context only on allowed URLs.',
      inputSchema: {
        task: z.string().min(1),
        systemPrompt: z.string().optional(),
        authStateId: z.string().optional(),
        connectionId: z.string().optional(),
        environment: z.enum(['web', 'ubuntu', 'windows']).default('web'),
      },
      _meta: {
        ui: {
          resourceUri: CUA_WIDGET_URI,
        },
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async (args: any) => {
      const scope = enforceConnectionScope(authContext, args);
      if (!scope.ok) {
        return {
          isError: true,
          content: [{ type: 'text', text: `API key is not authorized for connection ids: ${scope.deniedIds.join(', ')}` }],
        };
      }

      const parsed = z
        .object({
          task: z.string().min(1),
          systemPrompt: z.string().optional(),
          authStateId: z.string().optional(),
          connectionId: z.string().optional(),
          environment: z.enum(['web', 'ubuntu', 'windows']).default('web'),
        })
        .parse(args);

      const run = await cuaRuntime.startRun(parsed, authContext.userId);
      return {
        content: [{ type: 'text', text: `CUA run started: ${run.id}` }],
        structuredContent: { run },
        _meta: { run },
      };
    },
  );

  server.registerTool(
    'cua_get_orchestration_guide',
    {
      title: 'CUA Get Orchestration Guide',
      description: 'Returns the built-in orchestration quickstart for prompting, await-loop control, terminal handling, hybrid direct+search navigation, generic source-selection heuristics, and when to pass connectionId for approved headless auth-safe execution. Agent callers should read this before running CUA tasks.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      return {
        content: [{ type: 'text', text: CUA_ORCHESTRATION_QUICKSTART_TEXT }],
        structuredContent: {
          resource: {
            uri: CUA_ORCHESTRATION_QUICKSTART_URI,
            title: CUA_ORCHESTRATION_QUICKSTART_TITLE,
            mimeType: 'text/markdown',
            text: CUA_ORCHESTRATION_QUICKSTART_TEXT,
          },
        },
      };
    },
  );

  server.registerTool(
    'cua_get_delegation_guide',
    {
      title: 'CUA Get Delegation Guide (Deprecated Alias)',
      description: 'Deprecated alias for cua_get_orchestration_guide. Returns the same orchestration quickstart content.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      return {
        content: [{ type: 'text', text: CUA_ORCHESTRATION_QUICKSTART_TEXT }],
        structuredContent: {
          resource: {
            uri: CUA_ORCHESTRATION_QUICKSTART_URI,
            title: CUA_ORCHESTRATION_QUICKSTART_TITLE,
            mimeType: 'text/markdown',
            text: CUA_ORCHESTRATION_QUICKSTART_TEXT,
          },
        },
      };
    },
  );

  server.registerTool(
    'cua_preflight',
    {
      title: 'CUA Preflight',
      description: 'Validates model access and minimum API readiness before starting a CUA run. Call this immediately before cua_run_task.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      const result = await cuaRuntime.preflightModelAccess(authContext.userId);
      return {
        isError: !result.ok,
        content: [{ type: 'text', text: result.detail }],
        structuredContent: { preflight: result },
      };
    },
  );

  server.registerTool(
    'cua_get_run',
    {
      title: 'CUA Get Run',
      description: 'Get current state and event history for a CUA run id. Use this for explicit snapshots. For orchestration loops, prefer cua_await to avoid tight polling.',
      inputSchema: {
        runId: z.string().min(1),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args: any) => {
      const scope = enforceConnectionScope(authContext, args);
      if (!scope.ok) {
        return {
          isError: true,
          content: [{ type: 'text', text: `API key is not authorized for connection ids: ${scope.deniedIds.join(', ')}` }],
        };
      }

      const parsed = z.object({ runId: z.string().min(1) }).parse(args);
      const run = await cuaRuntime.getRun(parsed.runId, authContext.userId);
      if (!run) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Run not found: ${parsed.runId}` }],
        };
      }

      return {
        content: [{ type: 'text', text: `Run status: ${run.status}` }],
        structuredContent: { run },
      };
    },
  );

  server.registerTool(
    'cua_await',
    {
      title: 'CUA Await',
      description:
        'Blocks briefly while monitoring a run, then returns on signal or timeout. Returns early when clarification/interrupt/failure signals appear, or when the run reaches a terminal state. Use this as the default orchestration loop primitive instead of tight polling. When reason=terminal, stop awaiting and fetch cua_get_run once.',
      inputSchema: {
        runId: z.string().min(1),
        waitSeconds: z.number().int().min(1).max(300).optional(),
        sinceEventCount: z.number().int().min(0).optional(),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args: any) => {
      const scope = enforceConnectionScope(authContext, args);
      if (!scope.ok) {
        return {
          isError: true,
          content: [{ type: 'text', text: `API key is not authorized for connection ids: ${scope.deniedIds.join(', ')}` }],
          structuredContent: { await: { reason: 'unauthorized_connection_scope', deniedIds: scope.deniedIds } },
        };
      }

      const parsed = z
        .object({
          runId: z.string().min(1),
          waitSeconds: z.number().int().min(1).max(300).optional(),
          sinceEventCount: z.number().int().min(0).optional(),
        })
        .parse(args);

      const awaited = await cuaRuntime.awaitRun(parsed.runId, authContext.userId, {
        waitSeconds: parsed.waitSeconds ?? 30,
        sinceEventCount: parsed.sinceEventCount ?? 0,
      });

      if (awaited.reason === 'not_found') {
        return {
          isError: true,
          content: [{ type: 'text', text: `Run not found: ${parsed.runId}` }],
          structuredContent: { await: awaited },
        };
      }

      const statusText =
        awaited.reason === 'signal'
          ? `Signal received: ${awaited.signalEvent?.type || 'unknown'}`
          : awaited.reason === 'terminal'
            ? `Run reached terminal status: ${awaited.run?.status}`
            : `No signal during wait window (${Math.round(awaited.waitedSeconds)}s)`;

      return {
        content: [{ type: 'text', text: statusText }],
        structuredContent: { await: awaited },
      };
    },
  );

  server.registerTool(
    'cua_steer_run',
    {
      title: 'CUA Steer Run',
      description:
        'Injects high-priority steering instructions into an active run without hard interruption. Use this when the run drifts, needs refined strategy, or requires user clarification context. Mode append preserves current objective with new guidance; mode replace_goal reframes immediate objective. Steering is rejected for terminal runs.',
      inputSchema: {
        runId: z.string().min(1),
        steeringMessage: z.string().min(1),
        mode: z.enum(['append', 'replace_goal']).default('append'),
        source: z.enum(['user', 'agent']).optional(),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args: any) => {
      const scope = enforceConnectionScope(authContext, args);
      if (!scope.ok) {
        return {
          isError: true,
          content: [{ type: 'text', text: `API key is not authorized for connection ids: ${scope.deniedIds.join(', ')}` }],
        };
      }

      const parsed = z
        .object({
          runId: z.string().min(1),
          steeringMessage: z.string().min(1),
          mode: z.enum(['append', 'replace_goal']).default('append'),
          source: z.enum(['user', 'agent']).optional(),
        })
        .parse(args);

      const run = await cuaRuntime.steerRun(parsed.runId, parsed.steeringMessage, parsed.mode, parsed.source || 'agent', authContext.userId);
      if (!run) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Run not found: ${parsed.runId}` }],
        };
      }

      const lastEvent = run.events.at(-1);
      if (lastEvent?.type === 'steering_rejected_terminal') {
        return {
          content: [{ type: 'text', text: `Steering rejected: run is already terminal (${run.status}).` }],
          structuredContent: { run },
        };
      }

      return {
        content: [{ type: 'text', text: `Steering queued for run: ${run.id}` }],
        structuredContent: { run },
      };
    },
  );

  server.registerTool(
    'cua_interrupt',
    {
      title: 'CUA Interrupt',
      description: 'Request interruption for an active run and log reason/source. Use when policy risk is detected, user intervention is required, or execution drifts. Interrupt requests are rejected for terminal runs (completed/failed/interrupted).',
      inputSchema: {
        runId: z.string().min(1),
        reason: z.string().min(1),
        source: z.enum(['user', 'agent']).optional(),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args: any) => {
      const scope = enforceConnectionScope(authContext, args);
      if (!scope.ok) {
        return {
          isError: true,
          content: [{ type: 'text', text: `API key is not authorized for connection ids: ${scope.deniedIds.join(', ')}` }],
        };
      }

      const parsed = z
        .object({
          runId: z.string().min(1),
          reason: z.string().min(1),
          source: z.enum(['user', 'agent']).optional(),
        })
        .parse(args);
      const run = await cuaRuntime.interruptRun(parsed.runId, parsed.reason, parsed.source || 'user', authContext.userId);
      if (!run) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Run not found: ${parsed.runId}` }],
        };
      }

      const terminalStatuses = new Set(['completed', 'failed', 'interrupted']);
      if (terminalStatuses.has(run.status) && run.events.at(-1)?.type === 'interrupt_rejected_terminal') {
        return {
          content: [{ type: 'text', text: `Interrupt rejected: run is already terminal (${run.status}).` }],
          structuredContent: { run },
        };
      }

      return {
        content: [{ type: 'text', text: `Run interrupted: ${run.id}` }],
        structuredContent: { run },
      };
    },
  );

  if (config.exposeRecipeTools) {
    server.registerTool(
      'cua_save_recipe',
      {
        title: 'CUA Save Recipe',
        description: 'Save a reusable task template with {{variable}} placeholders for future triggered runs. Recipes should encode objective, domain bounds, stop condition, and strict output format.',
        inputSchema: {
          name: z.string().min(1),
          promptTemplate: z.string().min(1),
          description: z.string().optional(),
        },
        annotations: {
          readOnlyHint: false,
          openWorldHint: false,
          destructiveHint: false,
        },
      },
      async (args: any) => {
        const parsed = z
          .object({
            name: z.string().min(1),
            promptTemplate: z.string().min(1),
            description: z.string().optional(),
          })
          .parse(args);

        const recipe = await cuaRuntime.saveRecipe(authContext.userId, parsed.name, parsed.promptTemplate, parsed.description);
        return {
          content: [{ type: 'text', text: `Recipe saved: ${recipe.id}` }],
          structuredContent: { recipe },
        };
      },
    );

    server.registerTool(
      'cua_run_recipe',
      {
        title: 'CUA Run Recipe',
        description: 'Resolve a saved recipe with variables and start a new CUA run. Recommended sequence: cua_preflight -> cua_run_recipe -> poll cua_get_run -> handle handoffs.',
        inputSchema: {
          recipeId: z.string().min(1),
          variables: z.record(z.string(), z.string()),
          systemPrompt: z.string().optional(),
          authStateId: z.string().optional(),
          connectionId: z.string().optional(),
          environment: z.enum(['web', 'ubuntu', 'windows']).optional(),
        },
        annotations: {
          readOnlyHint: false,
          openWorldHint: true,
          destructiveHint: false,
        },
      },
      async (args: any) => {
        const parsed = z
          .object({
            recipeId: z.string().min(1),
            variables: z.record(z.string(), z.string()),
            systemPrompt: z.string().optional(),
            authStateId: z.string().optional(),
            connectionId: z.string().optional(),
            environment: z.enum(['web', 'ubuntu', 'windows']).optional(),
          })
          .parse(args);

        const run = await cuaRuntime.runRecipe(authContext.userId, parsed.recipeId, parsed.variables as Record<string, string>, {
          systemPrompt: parsed.systemPrompt,
          authStateId: parsed.authStateId,
          connectionId: parsed.connectionId,
          environment: parsed.environment,
        });

        if (!run) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Recipe not found: ${parsed.recipeId}` }],
          };
        }

        return {
          content: [{ type: 'text', text: `CUA recipe run started: ${run.id}` }],
          structuredContent: { run },
          _meta: { run },
        };
      },
    );
  }
}
