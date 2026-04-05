# CUA Interactive Readiness and Flow-Capture Plan (2026-04-04)

## Why this document exists
This memo answers three product questions:
1. What is the current architecture in this repo, and what does that imply for interactive takeover UX?
2. What must be built to convert connection capture into reusable human-authored flows?
3. Is this worth implementing versus API-first or other alternatives, given captcha/anti-bot realities?

## Quick repository facts
- `npm run check` already exists in `package.json` and maps to `tsc --noEmit`.
- The current MCP App widget is a run console, not a live browser viewport.

## Current architecture: what is already in place

### MCP app and run orchestration surface
- `src/mcp/registerTools.ts`
  - Registers an MCP app resource and binds `cua_run_task` to widget metadata.
  - Exposes orchestration tools and connection scope enforcement.
- `src/ui/cuaWidgetHtml.ts`
  - Current widget UI is status/output oriented: refresh and interrupt controls, event summaries, structured run payload display.
  - No live frame rendering channel and no browser input event forwarding.

### Runtime and interruption primitives
- `src/cua/runtime.ts`
  - Supports run lifecycle, steering queue, and explicit interrupt events.
  - Emits `interrupt_handoff_required` signals.
  - Does not yet model long-lived control ownership states (`agent_control`, `user_control`, etc.).

### Connection capture and auth-state flow
- `src/security/authCapture.ts`
  - Runs Playwright in headless mode.
  - Supports screenshot-based remote actions (`navigate`, `click`, `type`, `keypress`, `scroll`, `wait`).
  - Enforces connection policy allowlists and persists capture snapshots.
  - Finalize exports and returns storage state JSON.
- `src/api/httpApi.ts`
  - Exposes capture start/get/action/finalize/cancel endpoints.
  - Finalize encrypts and stores auth state as a reusable auth artifact reference.

### Pattern/recipe persistence primitives
- Orchestration pattern storage and retrieval are already present and can be extended for flow recipes.

## What is missing for full user takeover UX in MCP Apps

### Gap 1: rendering transport
Today there is no interactive remote browser canvas in the MCP widget. Existing capture behavior is screenshot refresh plus explicit action calls.

### Gap 2: input transport
There is no low-latency pointer/keyboard event bridge from the MCP widget into an active browser session.

### Gap 3: control ownership state machine
Current interrupt signals are event-based, but there is no authoritative ownership lock model to coordinate:
- CUA action execution
- user input takeover
- return-to-CUA resumption
- conflict handling

### Gap 4: takeover UX contract
Missing UX primitives:
- explicit takeover indicator
- pulsing border while user owns control
- "return control to CUA" call-to-action
- blocked/queued action treatment while user is in control

### Gap 5: security and compliance controls for takeover
Missing explicit policy layer for:
- consent capture semantics
- domain/action constraints during takeover
- event and audit logs (redacted)
- timeout/idle/session-expiry behavior

## What is missing to convert connection capture into reusable human-recorded flows

### Gap 1: durable action timeline
Capture currently persists snapshots and final auth state, but not a canonical replay timeline suitable for recipe generation.

### Gap 2: flow compiler
Need a normalization stage to compile raw interaction events into stable, replay-safe steps.

### Gap 3: secret extraction and variable binding
Need deterministic secret placeholders and connection-bound variable references so generated flows do not contain plaintext credentials or one-time values.

### Gap 4: human review and edit before save
Need a step review UI to remove brittle steps, insert waits/assertions, and annotate retries.

### Gap 5: replay runner
Need a robust executor capable of running generated flows against policy-scoped sessions and emitting observable failure checkpoints.

## Security architecture required to make takeover + flow capture safe

### Mandatory controls
1. Explicit pre-consent with scoped permissions
- User explicitly consents to session assistance and understands takeover behavior.
- Consent is scoped by connection, domain, and action classes.

2. Ownership lock with auditable transitions
- Single source of truth for control owner at any time.
- Transition events are immutable and timestamped.

3. Secret-safe logging
- Never persist typed secrets or OTP values in plaintext logs.
- Distinguish operational telemetry from sensitive payloads.

4. Policy enforcement at action boundary
- Every action validates URL/domain/path constraints.
- Rejection reason is explicit and surfaced to UI.

5. Session containment
- Session TTL and inactivity expiry.
- Controlled teardown and artifact retention policy.

### Additional controls recommended
- "watch mode" for high-risk domains and irreversible actions.
- runtime checks for suspected prompt injection content.
- sensitive-action confirmations at point of risk.

## Is this worthwhile to implement?

## Product value
Strong value where APIs are absent and users still need high-friction web workflows done on their behalf.

### Key upside
- Solves long-tail utility sites and legacy systems with no APIs.
- Reduces friction in repetitive authenticated UI workflows.
- Improves practical success where pure headless automation stalls and a quick human takeover can unblock progress.

### Key downside
- Higher engineering and safety burden than API-first integrations.
- Reliability ceiling on hostile anti-automation sites remains.
- Ongoing maintenance for UI drift and selector fragility.

## Recommendation
Yes, implement, but as a controlled assist system, not as a "universal autonomous browser" promise.

Treat this as an "API-gap bridge" with strict policy controls and human takeover. Keep API integrations as the preferred path whenever available.

## Captcha and anti-bot realism

### What improves
- Human takeover can clear many MFA/captcha/consent blockers during live runs.

### What does not magically improve
- Some providers still detect and constrain automation contexts even with intermittent human input.
- A subset of flows will remain flaky due to anti-bot measures and dynamic front-end behavior.

### Practical interpretation
Takeover is a high-impact reliability booster, not a guaranteed bypass mechanism.

## Phased implementation plan

### Phase 1 (low risk, foundational)
Implement control ownership model and APIs/events:
- `request_user_takeover`
- `ack_user_takeover`
- `return_control_to_cua`
- `get_control_state`

Add immutable transition logs and policy checks.

### Phase 2 (interactive UX MVP)
Add live viewport + input channel in MCP app widget with:
- user ownership indicator
- pulsing border while interrupted
- explicit return-control button

Constrain to allowlisted domains first.

### Phase 3 (flow capture MVP)
Persist action timeline, compile to flow DSL, add review/edit screen, save to pattern library, replay with secret refs.

### Phase 4 (hardening)
Add resilient retries, selector fallback strategies, stricter redaction, and deterministic recovery semantics.

## Estimated effort
- Interactive takeover MVP: ~1 to 2 weeks
- Flow-capture MVP: ~1 to 2 weeks
- Production hardening: additional ~2 to 4 weeks

## Go/no-go gates before full investment
1. Validate end-to-end on at least 3 target secure sites and 2 target MCP clients.
2. Measure successful transfer ratio for `CUA -> user -> CUA`.
3. Verify that security stakeholders accept consent, logging, and retention controls.
4. Confirm latency is good enough for user-perceived interactivity.

## Decision summary
- Build this capability, but with guardrails and staged rollout.
- Position it as secure assisted automation for API gaps, not as total replacement for API integrations.
- Prioritize ownership state machine first; without it, both UX and security posture remain weak.
