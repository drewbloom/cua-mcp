# AGENTS.md

Guidance for coding agents working in this repository.

## Mission

Build a portable Computer Use Agent MCP server that can run in headless mode for orchestrators and interactive mode for MCP Apps-capable clients.

This repo is experimental but should follow production-minded patterns for security, composability, and clear tool contracts.

## Stack and frameworks

- Language: TypeScript (strict mode), ESM only.
- Runtime: Node.js.
- MCP SDK: `@modelcontextprotocol/sdk`.
- MCP Apps SDK: `@modelcontextprotocol/ext-apps`.
- CUA engines:
	- OpenAI Responses native computer loop (`openai` + `playwright`).
	- Optional LangGraph CUA fallback (`@langchain/langgraph-cua`).
- Validation: Zod schemas for tool input parsing.
- Persistence target: Postgres (Railway).

Do not introduce CommonJS `require()`.

## Architecture conventions

- Keep runtime execution logic in `src/cua/`.
- Keep MCP registration and transport logic in `src/mcp/`.
- Keep UI resource templates in `src/ui/`.
- Keep transport-neutral business logic outside `src/mcp/`.

## Tool contract conventions

Current public tools:

- `cua_get_orchestration_guide`
- `cua_preflight`
- `cua_run_task`
- `cua_await`
- `cua_steer_run`
- `cua_get_run`
- `cua_interrupt`

Optional tools (hidden unless `CUA_EXPOSE_RECIPE_TOOLS=true`):

- `cua_save_recipe`
- `cua_run_recipe`


Recommended run sequence for agent callers:

1. Call `cua_get_orchestration_guide` first.
2. Call `cua_preflight`.
3. Call `cua_run_task` or `cua_run_recipe`.
4. Loop on `cua_await` with an event cursor (`sinceEventCount`).
5. Use `cua_steer_run` for midstream redirect or clarified intent.
6. Resolve clarification signals with `cua_steer_run` or `cua_interrupt`.
7. On terminal, call `cua_get_run` once for the final snapshot and stop.

Environment behavior:

1. `cua_run_task` defaults `environment` to `web`.
2. `openai-responses` engine coerces non-web inputs to `web` and logs `environment_overridden`.
3. Use `CUA_ENGINE=langgraph` for explicit `ubuntu`/`windows` runs.

Rules:

1. Preserve tool names unless explicitly requested.
2. Keep tool output deterministic and structured.
3. Return explicit error messages for missing ids or invalid state.
4. Avoid embedding secrets in tool outputs or metadata.
5. Keep headless orchestration steering-first; do not introduce credential approval handoffs.

## MCP Apps guidance

- Register UI resources with `registerAppResource`.
- Register interactive tools with `registerAppTool` when they should render UI.
- Keep CSP metadata explicit and minimal.
- Use official MCP Apps lifecycle patterns (`ui/initialize`, initialized notification, host-mediated `tools/call`) rather than ad-hoc message handling.
- Prefer bundled App builds using `@modelcontextprotocol/ext-apps` for production widgets.

## Security guardrails

- Never print access tokens or API keys.
- Redact sensitive fields before writing run events.
- Validate all tool input via Zod.
- Add domain allowlists before enabling unrestricted web automation.
- Keep credential handling out of orchestration surfaces in headless mode.

## Runtime and deployment guidance

Target path for first production-like deploy:

- Railway container for persistent CUA runtime.
- Railway Postgres for persistent run/recipe/handoff state.

Optional edge split:

- Cloudflare Worker only as lightweight facade, not primary CUA executor.

Feature-flag rollout rules:

- Keep `CUA_ENABLE_ACCOUNT_API=false` and `CUA_ENABLE_SECRET_API=false` by default.
- Enable `CUA_ENABLE_ACCOUNT_API=true` first for onboarding/session/API-key flows.
- Enable `CUA_ENABLE_SECRET_API=true` only after encryption key and URL policy checks are validated.

## Development workflow

1. Install dependencies: `npm install`
2. Run type checks: `npm run check`
3. Run dev server: `npm run dev`
4. Build: `npm run build`

## Definition of done for each change

1. Build or check passes locally.
2. MCP endpoint still serves on configured path.
3. Tool schemas still parse correctly.
4. Tool names and response shapes are backward compatible.
5. README and AGENTS docs updated when behavior changes.

## Documentation references

- MCP Apps: https://apps.extensions.modelcontextprotocol.io/api/
- MCP specification: https://modelcontextprotocol.io/specification
- OpenAI computer-use guide: https://developers.openai.com/api/docs/guides/tools-computer-use
- LangGraph CUA API: https://reference.langchain.com/javascript/langchain-langgraph-cua
- LangGraph concepts: https://langchain-ai.github.io/langgraph/concepts/

## Style preferences

- Keep files small and composable.
- Prefer explicit types for public interfaces.
- Add brief comments only when logic is non-obvious.
- Avoid large framework abstractions in early iterations.

## Known first-draft limitations

- Postgres persistence implemented for runs/events/recipes, but no migration framework yet.
- UI widget is minimal and not yet using full SDK app lifecycle hooks.
- No multi-user auth partitioning yet.

Treat these as planned improvements, not regressions.
