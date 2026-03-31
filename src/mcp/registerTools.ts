import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { cuaRuntime } from '../cua/runtime.js';
import { config } from '../config.js';
import { CUA_WIDGET_HTML, CUA_WIDGET_URI } from '../ui/cuaWidgetHtml.js';
import {
  CUA_DELEGATION_GUIDE_TEXT,
  CUA_DELEGATION_GUIDE_TITLE,
  CUA_DELEGATION_GUIDE_URI,
} from '../resources/cuaDelegationGuide.js';

export function registerCuaTools(server: McpServer): void {
  server.registerResource(
    'cua-delegation-guide',
    CUA_DELEGATION_GUIDE_URI,
    {
      title: CUA_DELEGATION_GUIDE_TITLE,
      description: 'Best practices for delegating CUA runs with strong prompts, clear guardrails, and predictable handoffs.',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: CUA_DELEGATION_GUIDE_TEXT,
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
        'Starts a persistent CUA run using the configured engine and returns a run id for polling and control. Environment defaults to web. Recommended sequence: 1) call cua_get_delegation_guide, 2) call cua_preflight, 3) call cua_run_task, 4) poll cua_get_run, 5) respond to handoffs with cua_approve_action or cua_interrupt. Keep task instructions concrete: objective, allowed domains, stop condition, strict output format.',
      inputSchema: {
        task: z.string().min(1),
        systemPrompt: z.string().optional(),
        authStateId: z.string().optional(),
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
      const parsed = z
        .object({
          task: z.string().min(1),
          systemPrompt: z.string().optional(),
          authStateId: z.string().optional(),
          environment: z.enum(['web', 'ubuntu', 'windows']).default('web'),
        })
        .parse(args);

      const run = await cuaRuntime.startRun(parsed);
      return {
        content: [{ type: 'text', text: `CUA run started: ${run.id}` }],
        structuredContent: { run },
        _meta: { run },
      };
    },
  );

  server.registerTool(
    'cua_get_delegation_guide',
    {
      title: 'CUA Get Delegation Guide',
      description: 'Returns the built-in delegation and prompting guide. Agent callers should read this before running CUA tasks.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      return {
        content: [{ type: 'text', text: CUA_DELEGATION_GUIDE_TEXT }],
        structuredContent: {
          resource: {
            uri: CUA_DELEGATION_GUIDE_URI,
            title: CUA_DELEGATION_GUIDE_TITLE,
            mimeType: 'text/markdown',
            text: CUA_DELEGATION_GUIDE_TEXT,
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
      const result = await cuaRuntime.preflightModelAccess();
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
      description: 'Get current state and event history for a CUA run id. Poll this to monitor progress and detect approval/interrupt handoff events.',
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
      const parsed = z.object({ runId: z.string().min(1) }).parse(args);
      const run = await cuaRuntime.getRun(parsed.runId);
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
    'cua_interrupt',
    {
      title: 'CUA Interrupt',
      description: 'Mark a run as interrupted and log the reason/source. Use when policy risk is detected, user intervention is required, or execution drifts.',
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
      const parsed = z
        .object({
          runId: z.string().min(1),
          reason: z.string().min(1),
          source: z.enum(['user', 'agent']).optional(),
        })
        .parse(args);
      const run = await cuaRuntime.interruptRun(parsed.runId, parsed.reason, parsed.source || 'user');
      if (!run) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Run not found: ${parsed.runId}` }],
        };
      }

      return {
        content: [{ type: 'text', text: `Run interrupted: ${run.id}` }],
        structuredContent: { run },
      };
    },
  );

  server.registerTool(
    'cua_approve_action',
    {
      title: 'CUA Approve Action',
      description: 'Stores user approval/decline decision for a run during auth or sensitive action checkpoints. Call after approval_handoff_required events from cua_get_run.',
      inputSchema: {
        runId: z.string().min(1),
        approved: z.boolean(),
        note: z.string().optional(),
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
          runId: z.string().min(1),
          approved: z.boolean(),
          note: z.string().optional(),
        })
        .parse(args);

      const run = await cuaRuntime.approveAction(parsed.runId, parsed.approved, parsed.note);
      if (!run) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Run not found: ${parsed.runId}` }],
        };
      }

      return {
        content: [{ type: 'text', text: `Approval decision recorded for run: ${run.id}` }],
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

        const recipe = await cuaRuntime.saveRecipe(parsed.name, parsed.promptTemplate, parsed.description);
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
            environment: z.enum(['web', 'ubuntu', 'windows']).optional(),
          })
          .parse(args);

        const run = await cuaRuntime.runRecipe(parsed.recipeId, parsed.variables as Record<string, string>, {
          systemPrompt: parsed.systemPrompt,
          authStateId: parsed.authStateId,
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
