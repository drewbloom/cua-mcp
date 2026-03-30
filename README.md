# cua-mcp

Standalone MCP server for Computer Use Agent workflows using LangGraph CUA, with a starter MCP App UI surface.

## Why this repo exists

This project isolates CUA experimentation from core production systems while keeping the integration portable.

- Safe iteration outside InnovationOS runtime.
- MCP-native tool surface for cross-client compatibility.
- Starter UI resource for copilot-style run visibility.
- Designed to support both headless agent calls and interactive host rendering.

## Current status

First draft scaffold complete.

Included tools:

- `cua_run_task`: Starts a persistent CUA run and returns a run id.
- `cua_get_run`: Returns run state and captured events.
- `cua_interrupt`: Marks a run interrupted and logs reason.
- `cua_approve_action`: Records user approval decisions for run checkpoints.
- `cua_save_recipe`: Saves reusable task templates with variable placeholders.
- `cua_run_recipe`: Resolves a saved template and starts a run.

Included app resource:

- `ui://widget/cua-run-v1.html`: Minimal run status viewer.

## Architecture

- Runtime: Node.js + TypeScript (ESM).
- Transport: MCP Streamable HTTP.
- CUA execution: `@langchain/langgraph-cua` with async run lifecycle.
- UI protocol: MCP Apps via `@modelcontextprotocol/ext-apps`.
- State: in-memory run store and recipe store (first draft).

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

4. Start dev server.

```bash
npm run dev
```

5. Server health check.

```bash
curl http://localhost:8788/
```

6. MCP endpoint.

- Default path: `http://localhost:8788/mcp`

## Notes on `cua_run_task`

Yes, this is the entrypoint that bundles LangGraph CUA behavior into one run lifecycle.

The underlying CUA graph handles the observe-plan-act loop for browser-level interaction, including click/type/navigation operations through its configured computer-use backend.

This repo adds run orchestration around that graph:

- start and background execution
- event capture
- interruption hooks
- approval signals
- recipe-based replay

## Next build steps

1. Persist run and recipe state in SQLite or Redis.
2. Add explicit auth/MFA interrupt protocol in run updates.
3. Add screenshot hosting for long sessions.
4. Upgrade widget to official MCP Apps lifecycle SDK patterns.
5. Add policy guardrails: allowed domains, forbidden actions, approval thresholds.
6. Add integration tests against a local MCP host.

## Documentation links

- MCP Apps docs: https://apps.extensions.modelcontextprotocol.io/api/
- MCP Apps quickstart: https://apps.extensions.modelcontextprotocol.io/api/documents/quickstart.html
- MCP core spec: https://modelcontextprotocol.io/specification
- LangGraph CUA reference: https://reference.langchain.com/javascript/langchain-langgraph-cua
- LangGraph docs: https://langchain-ai.github.io/langgraph/

## Security and privacy

- Never log raw secrets.
- Keep tokens out of tool responses.
- Gate high-risk actions with explicit user approval.
- Prefer per-user auth states and scoped credentials.
