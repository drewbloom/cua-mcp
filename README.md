# cua-mcp

Standalone MCP server for Computer Use Agent workflows with a dual-engine runtime:

- OpenAI Responses native computer loop (recommended default for GPT-5.4)
- LangGraph CUA backend (optional fallback)

## Why this repo exists

This project isolates CUA experimentation from core production systems while keeping the integration portable.

- Safe iteration outside InnovationOS runtime.
- MCP-native tool surface for cross-client compatibility.
- Starter UI resource for copilot-style run visibility.
- Designed to support both headless agent calls and interactive host rendering.

## Current status

First draft scaffold complete.

Included tools:

- `cua_get_orchestration_guide`: Returns built-in CUA orchestration quickstart and delegation patterns.
- `cua_preflight`: Checks API/model readiness before starting a run.
- `cua_run_task`: Starts a persistent CUA run and returns a run id (`environment` defaults to `web`).
- `cua_await`: Blocks up to a configured wait window and returns early on signal/terminal state.
- `cua_steer_run`: Injects high-priority midstream steering without hard interruption.
- `cua_get_run`: Returns run state and captured events.
- `cua_interrupt`: Marks a run interrupted and logs reason.

Optional tools (hidden by default, enable with `CUA_EXPOSE_RECIPE_TOOLS=true`):

- `cua_save_recipe`: Saves reusable task templates with variable placeholders.
- `cua_run_recipe`: Resolves a saved template and starts a run.

Included app resource:

- `ui://widget/cua-run-v1.html`: MCP Apps bridge-pattern run console with refresh and interrupt controls.

Included standard MCP resource:

- `resources:cua-orchestration-quickstart`: Markdown quickstart with orchestration loop, delegation templates, and handoff policy.

## Architecture

- Runtime: Node.js + TypeScript (ESM).
- Transport: MCP Streamable HTTP.
- CUA execution: configurable engine.
	- `openai-responses`: OpenAI Responses `computer` tool + local Playwright harness.
	- `langgraph`: `@langchain/langgraph-cua` graph runner.
- UI protocol: MCP Apps via `@modelcontextprotocol/ext-apps`.
- State: configurable persistence backend.
	- `CUA_PERSISTENCE=memory` (default local quickstart)
	- `CUA_PERSISTENCE=postgres` (recommended for Railway)

## Backend API (v1 scaffold)

In addition to MCP tools, the service now exposes a backend HTTP API for user onboarding and policy setup.

Auth/session endpoints:

- `POST /api/auth/request-code` - request OTP login code (dev delivery currently logged server-side)
- `POST /api/auth/verify-code` - verify OTP and create session cookie
- `GET /api/session/me` - current authenticated user
- `POST /api/session/logout` - revoke current session

API key endpoints:

- `GET /api/keys` - list user API keys (without secret values)
- `POST /api/keys` - create a scoped API key (secret returned once)
- `DELETE /api/keys/:id` - revoke API key

Connection endpoints:

- `GET /api/connections` - list user connections and allowlist policy
- `POST /api/connections` - create connection policy
- `PATCH /api/connections/:id` - update connection policy

Secret endpoints:

- `GET /api/connections/:id/secrets` - list secret references/metadata for a connection
- `POST /api/connections/:id/secrets` - store encrypted secret value and return a secret reference
- `DELETE /api/connections/:id/secrets/:secretId` - delete secret

CUA secret execution planning endpoint:

- `POST /api/cua/secret-fill-plan` - validates URL allowlist and returns secret references by requested type (never returns plaintext)

These routes are intended as the first backend slice for frontend onboarding and secret-policy workflows.

## Setup

1. Install dependencies.

```bash
npm install
```

2. Configure environment.

```bash
copy .env.example .env
```

3. Fill required keys in `.env`.

- `OPENAI_API_KEY`
- `SCRAPYBARA_API_KEY`
- `MCP_ACCESS_API_KEY` (required for MCP access; when unset, `/mcp` is fail-closed)
- `CUA_ENGINE` (`openai-responses` recommended)
- `CUA_MODEL` (`gpt-5.4` recommended for OpenAI native path)
- `CUA_PERSISTENCE` (`memory` or `postgres`)
- `DATABASE_URL` (required when `CUA_PERSISTENCE=postgres`)
- `CUA_SECRET_MASTER_KEY` (required for encrypted secret storage; 64-char hex)
- `CUA_EXPOSE_RECIPE_TOOLS` (`false` by default)
- `CUA_ENABLE_ACCOUNT_API` (`false` by default; enables `/api/auth`, `/api/session`, `/api/keys`, `/api/connections`)
- `CUA_ENABLE_SECRET_API` (`false` by default; enables secret routes and `/api/cua/secret-fill-plan`)

4. Install Chromium once for Playwright harness.

```bash
npx playwright install chromium
```

5. Start dev server.

```bash
npm run dev
```

6. Server health check.

```bash
curl http://localhost:8788/
```

7. MCP endpoint.

- Default path: `http://localhost:8788/mcp`

## Notes on `cua_run_task`

Yes, this is the entrypoint that bundles the selected CUA engine into one run lifecycle.

When `CUA_ENGINE=openai-responses`, the runtime executes OpenAI's built-in `computer` tool loop and uses Playwright locally to execute action batches (click/type/scroll/key/drag/screenshot).

`environment` behavior:

- Default is `web`.
- For `openai-responses`, non-web inputs are automatically coerced to `web` and logged as an `environment_overridden` event.
- Use `CUA_ENGINE=langgraph` for explicit ubuntu/windows execution paths.

When `CUA_ENGINE=langgraph`, the runtime delegates to LangGraph CUA.

This repo adds run orchestration around that graph:

- start and background execution
- event capture
- interruption hooks
- clarification and steering signals
- recipe-based replay

## Model and engine behavior

- OpenAI native engine uses `CUA_MODEL` directly (default: `gpt-5.4`).
- LangGraph engine may still be constrained by upstream package behavior depending on release.
- Run metadata includes both `engine` and `model` for observability.

## Next build steps

1. Replace inline widget with a bundled `@modelcontextprotocol/ext-apps` App build (single-file output).
2. Add screenshot hosting for long sessions.
3. Add policy guardrails: allowed domains, forbidden actions, approval thresholds.
4. Add integration tests against a local MCP host.

## Persistence options for container deployments

Recommended order for tight + simple:

1. Railway Postgres (recommended)
2. Neon Postgres (serverless Postgres, simple external managed option)
3. Redis for volatile run state + object storage for large artifacts

Why Postgres first here:

- Native persistence for Railway containers.
- Better operational fit than SQLite + volume hacks + Litestream for this use case.
- Straightforward future multi-user partitioning and audit history.

### Railway quick setup for Postgres persistence

1. Add a Railway Postgres service to the project.
2. Expose `DATABASE_URL` to the app service.
3. Set `CUA_PERSISTENCE=postgres`.
4. Deploy or restart the app.

On startup, `cua-mcp` auto-creates:
- `cua_runs`
- `cua_run_events`
- `cua_recipes`

### Postgres smoke test

After setting `CUA_PERSISTENCE=postgres` and `DATABASE_URL`, run:

```bash
npm run db:smoke
```

Expected output includes:

- `ok: true`
- generated `runId` and `recipeId`
- row counts for `cua_runs`, `cua_run_events`, and `cua_recipes`

This verifies create/read persistence for runs, events, and recipes from local dev to your configured Postgres instance.

## Hello world readiness and local test path

Current readiness:

- You can run the MCP server locally now.
- You can validate health and MCP discovery locally.
- You can call `cua_run_task` locally once `OPENAI_API_KEY` and `SCRAPYBARA_API_KEY` are set.

Suggested local flow before Railway:

1. `npm install`
2. `copy .env.example .env` then add keys
3. `npm run dev`
4. connect an MCP inspector/client to `http://localhost:8788/mcp`
5. call `cua_get_orchestration_guide`
6. call `cua_preflight`
7. call `cua_run_task` with a low-risk prompt and then loop on `cua_await`

### Suggested local hello world sequence (headless inspector)

1. Start server:
	- `npm run dev`
2. Open MCP Inspector and connect to:
	- `http://localhost:8788/mcp`
3. Call `cua_preflight` first and confirm `ok: true`.
4. Call `cua_run_task` with:
	- `task`: `Open a browser, navigate to https://docs.scrapybara.com, find the quickstart documentation, and summarize the first 5 setup steps in plain text.`
	- `environment`: `web`
5. Copy returned `run.id`.
6. Call `cua_await` with:
	- `runId`: the same id
	- `waitSeconds`: `30`
	- `sinceEventCount`: `0` on first call, then the returned `nextSinceEventCount`
7. Watch `await.reason` and `events` for:
	- `run_started`
	- `response_turn` or `cua_update`
	- `computer_call_requested`
	- `computer_actions_executed`
	- `clarification_required` (if triggered)
	- `interrupt_handoff_required` (if triggered)
	- `run_completed` or `run_failed`
8. If the run drifts, call `cua_steer_run`:
	- `runId`: the same id
	- `steeringMessage`: concise redirect instructions
	- `mode`: `append` (or `replace_goal` for full pivot)
9. If clarification is required, call `cua_steer_run` with focused guidance or call `cua_interrupt` to stop.
10. If you need to stop the run, call `cua_interrupt`:
	- `runId`: the same id
	- `reason`: `manual test stop`
	- `source`: `user`
11. Once `cua_await` returns `reason=terminal`, call `cua_get_run` once and stop orchestration.

Railway should be phase 2 after local smoke tests pass.

## Documentation links

- MCP Apps docs: https://apps.extensions.modelcontextprotocol.io/api/
- MCP Apps quickstart: https://apps.extensions.modelcontextprotocol.io/api/documents/quickstart.html
- MCP core spec: https://modelcontextprotocol.io/specification
- LangGraph CUA reference: https://reference.langchain.com/javascript/langchain-langgraph-cua
- LangGraph docs: https://langchain-ai.github.io/langgraph/

## Security and privacy

- Never log raw secrets.
- Keep tokens out of tool responses.
- Use steering and interruption controls for headless orchestration safety.
- Prefer per-user auth states and scoped credentials.

### MCP endpoint authentication (recommended now)

`cua-mcp` supports API key protection at the MCP transport layer:

- Fail-closed by default when no key is configured.
- Set exactly one key in `MCP_ACCESS_API_KEY` for short-term protection.
- Clients authenticate using either:
	- `Authorization: Bearer <api-key>`
	- `x-api-key: <api-key>`

Generate a temporary 32-character key:

```bash
npm run keygen
```

For a single-user phase, one Railway-managed service key is sufficient.

### Long-term auth direction

For multi-user deployments, move from env keys to Postgres-backed key management:

1. `users` table
2. `api_keys` table with hashed keys + prefix IDs
3. key scopes / revocation / rotation metadata
4. `last_used_at` audit stamping and per-key rate limits
