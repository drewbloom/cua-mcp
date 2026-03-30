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
- CUA engine: `@langchain/langgraph-cua` + LangGraph.
- Validation: Zod schemas for tool input parsing.

Do not introduce CommonJS `require()`.

## Architecture conventions

- Keep runtime execution logic in `src/cua/`.
- Keep MCP registration and transport logic in `src/mcp/`.
- Keep UI resource templates in `src/ui/`.
- Keep transport-neutral business logic outside `src/mcp/`.

## Tool contract conventions

Current public tools:

- `cua_run_task`
- `cua_get_run`
- `cua_interrupt`
- `cua_approve_action`
- `cua_save_recipe`
- `cua_run_recipe`

Rules:

1. Preserve tool names unless explicitly requested.
2. Keep tool output deterministic and structured.
3. Return explicit error messages for missing ids or invalid state.
4. Avoid embedding secrets in tool outputs or metadata.
5. Keep write-like tools approval-aware by default.

## MCP Apps guidance

- Register UI resources with `registerAppResource`.
- Register interactive tools with `registerAppTool` when they should render UI.
- Keep CSP metadata explicit and minimal.
- Prefer official app lifecycle patterns for host bridge behavior.

## Security guardrails

- Never print access tokens or API keys.
- Redact sensitive fields before writing run events.
- Validate all tool input via Zod.
- Add domain allowlists before enabling unrestricted web automation.
- Add HITL checkpoints for sensitive actions.

## Runtime and deployment guidance

Target path for first production-like deploy:

- Railway container for persistent CUA runtime.

Optional edge split:

- Cloudflare Worker only as lightweight facade, not primary CUA executor.

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
- LangGraph CUA API: https://reference.langchain.com/javascript/langchain-langgraph-cua
- LangGraph concepts: https://langchain-ai.github.io/langgraph/concepts/

## Style preferences

- Keep files small and composable.
- Prefer explicit types for public interfaces.
- Add brief comments only when logic is non-obvious.
- Avoid large framework abstractions in early iterations.

## Known first-draft limitations

- In-memory run/recipe persistence only.
- UI widget is minimal and not yet using full SDK app lifecycle hooks.
- No multi-user auth partitioning yet.

Treat these as planned improvements, not regressions.
