import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { cuaRuntime } from '../cua/runtime.js';
import { CUA_WIDGET_HTML, CUA_WIDGET_URI } from '../ui/cuaWidgetHtml.js';

export function registerCuaTools(server: McpServer): void {
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
      description: 'Starts a persistent CUA run backed by LangGraph CUA and returns the run id for polling and control.',
      inputSchema: {
        task: z.string().min(1),
        systemPrompt: z.string().optional(),
        authStateId: z.string().optional(),
        environment: z.enum(['web', 'ubuntu', 'windows']).optional(),
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
          environment: z.enum(['web', 'ubuntu', 'windows']).optional(),
        })
        .parse(args);

      const run = cuaRuntime.startRun(parsed);
      return {
        content: [{ type: 'text', text: `CUA run started: ${run.id}` }],
        structuredContent: { run },
        _meta: { run },
      };
    },
  );

  server.registerTool(
    'cua_get_run',
    {
      title: 'CUA Get Run',
      description: 'Get current state and event history for a CUA run id.',
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
      const run = cuaRuntime.getRun(parsed.runId);
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
      description: 'Mark a run as interrupted and log the user interrupt reason.',
      inputSchema: {
        runId: z.string().min(1),
        reason: z.string().min(1),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args: any) => {
      const parsed = z.object({ runId: z.string().min(1), reason: z.string().min(1) }).parse(args);
      const run = cuaRuntime.interruptRun(parsed.runId, parsed.reason);
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
      description: 'Stores user approval/decline decision for a run during auth or sensitive action checkpoints.',
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

      const run = cuaRuntime.approveAction(parsed.runId, parsed.approved, parsed.note);
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

  server.registerTool(
    'cua_save_recipe',
    {
      title: 'CUA Save Recipe',
      description: 'Save a reusable task template with {{variable}} placeholders for future triggered runs.',
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

      const recipe = cuaRuntime.saveRecipe(parsed.name, parsed.promptTemplate, parsed.description);
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
      description: 'Resolve a saved recipe with variables and start a new CUA run.',
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

      const run = cuaRuntime.runRecipe(parsed.recipeId, parsed.variables as Record<string, string>, {
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
