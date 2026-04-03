# AGENTS.md

Guidance for coding agents working in this repository.

## Mission

Build a portable Computer Use Agent MCP server that can run in headless mode for orchestrators and interactive mode for MCP Apps-capable clients.

This repo now includes a public onboarding/control-plane surface for end users in addition to the MCP endpoint. It should still follow production-minded patterns for security, composability, and clear tool contracts.

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

Primary runtime mode today:

- OpenAI Responses + Playwright is the default and expected CUA engine.
- LangGraph remains optional and secondary.
- Multi-user auth, per-user API keys, per-user OpenAI keys, connection policies, secret refs, auth states, and capture sessions are first-class parts of the system.

Do not introduce CommonJS `require()`.

## Architecture conventions

- Keep runtime execution logic in `src/cua/`.
- Keep MCP registration and transport logic in `src/mcp/`.
- Keep UI resource templates in `src/ui/`.
- Keep transport-neutral business logic outside `src/mcp/`.
- Keep onboarding/session/account routes in `src/api/`.
- Keep sensitive decrypt/secret-resolution logic in `src/security/` or narrowly scoped auth modules, not in UI-facing or orchestration-facing layers.

Current top-level surfaces:

- `GET /` serves the public landing page.
- `GET /app` serves the onboarding/control-plane UI.
- `GET /health` serves service health.
- `POST|GET|DELETE /mcp` is the authenticated MCP surface.
- `/api/*` serves authenticated onboarding, key, connection, secret, auth-state, and capture-session routes.

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
6. Treat `connectionId` as the preferred authenticated-execution primitive for headless runs.
7. Enforce user ownership and connection scoping on every run, get, await, steer, interrupt, and recipe path.

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
- Keep credential handling out of orchestration surfaces in headless mode.
- MCP access must use user-issued API keys stored in Postgres, not a shared global env key.
- Headless runs may use approved secret refs and saved auth states only through backend resolution, never by exposing plaintext to orchestration callers.
- Connection policies are the enforcement boundary for approved hosts and path prefixes.
- Interactive auth capture is an isolated browser flow for saving auth state; it is not a prompt-level credential handoff.
- Session cookies must remain `HttpOnly` and same-site constrained.
- Audit logs must stay redacted.

## Runtime and deployment guidance

Target path for first production-like deploy:

- Railway container for persistent CUA runtime.
- Railway Postgres for persistent run/recipe/handoff state.

Optional edge split:

- Cloudflare Worker only as lightweight facade, not primary CUA executor.

Feature-flag rollout rules:

- `CUA_ENABLE_ACCOUNT_API` and `CUA_ENABLE_SECRET_API` are enabled by default in the current product shape.
- Do not disable them casually in environments intended for real onboarding or connection management.
- If you introduce new secret-bearing routes, gate them behind the existing auth, policy, and audit layers rather than adding bypass routes.

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
5. User ownership boundaries are preserved for MCP and `/api/*` routes.
6. Secret or auth-state plaintext is not exposed in tool responses, API responses, logs, or audit records.
7. README and AGENTS docs updated when behavior changes.

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

## Current system notes

- Postgres persistence covers runs, events, recipes, users, sessions, API keys, LLM keys, connections, secrets, auth states, audit logs, and capture sessions.
- The onboarding app is part of the product surface, not just a dev-only scaffold.
- The widget remains useful but minimal compared with the onboarding control plane.
- There is still no formal migration framework; schema creation is startup-driven.
- README may intentionally be non-technical. Treat this file as the authoritative contributor guidance unless told otherwise.
