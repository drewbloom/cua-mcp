# CUA Future Direction Evaluation (2026-04-04)

## Purpose
This document evaluates strategic direction for this repository, focused on:
1. Whether to invest in full user takeover UX for interactive MCP Apps.
2. Whether to evolve connection capture into reusable human-authored flows.
3. Whether CUA can securely use a user's existing browser session with consent.
4. How public ecosystem signals (OpenAI, Anthropic, OpenClaw, Browser Use) should influence roadmap priority.

## Executive recommendation
Build a hybrid architecture:
- Keep policy-scoped remote browser sessions as the default automation surface.
- Add first-class user takeover in that surface for reliability and trust.
- Add flow capture from human-guided sessions to create reusable recipes.
- Add an optional user-device/browser connector later for "use my current logged-in state" scenarios, but only with strict consent and isolation controls.

Do not commit to a fully autonomous, no-confirmation browser strategy for sensitive workflows.

## Why this repo remains strategically important
Your thesis is still valid: many business systems and utilities have no practical API for the workflow users actually need. API-first cannot cover the long tail. A controlled CUA path is the right product category for those gaps.

## External ecosystem signals (as of 2026-04-04)

### OpenAI signals
Source highlights from OpenAI CUA and Operator materials:
- CUA is explicitly built around screenshot perception + action loop (mouse/keyboard) and iterative execution.
- Operator emphasizes user takeover for sensitive actions (login, payments, captcha).
- OpenAI guidance for the Computer tool stresses isolated environments, allowlists, and point-of-risk confirmations.
- Public positioning indicates continued expansion of computer-use capability and broader integration path.

Implication:
- Your desired model (agent acts, user takes over at sensitive moments, then agent resumes) aligns with current leading practice.

### Anthropic signals
Source highlights from Claude computer-use docs:
- Computer use is beta and requires explicit harness implementation.
- Strong emphasis on sandboxing, risk controls, and prompt-injection caution.
- Documentation acknowledges latency and reliability limitations.
- Human oversight is explicitly recommended for meaningful consequences.

Implication:
- Industry consensus is converging on "human-in-the-loop + constrained environment" rather than full unattended autonomy for sensitive workflows.

### OpenClaw and Browser Use signals
Observed product direction emphasizes:
- Practical browser automation with tool loops and persistence.
- Strong focus on operational tooling, ecosystem integration, and production guardrails.
- Marketing and docs often include stealth/captcha support claims, but these do not eliminate legal/policy and reliability constraints.

Implication:
- Competitive pressure favors delivering robust operator UX and reliability instrumentation, not just raw action primitives.

## Option analysis: where to run the browser

## Option A: Remote browser sessions (current core direction)
Description:
- Browser runs in managed backend environment.
- User and agent interact through a mediated session (current capture architecture foundation).

Pros:
- Strongest central policy enforcement and auditing.
- Predictable runtime and easier instrumentation.
- Easier to isolate by tenant/session and rotate infrastructure.

Cons:
- Weaker compatibility with anti-bot systems on some sites.
- Added latency compared to local browser.
- User does not automatically inherit personal browser state unless imported.

Best fit:
- Enterprise control, repeatable workflows, compliance-heavy deployments.

## Option B: User browser connector (existing local session with consent)
Description:
- Agent commands execute against the user's real browser context (or a dedicated browser profile on the user's device) via extension/native connector.

Pros:
- Leverages existing cookies/auth/cache where user already logged in.
- Better compatibility with "works only in real user browser" experiences.
- Reduces backend credential handling pressure.

Cons:
- Larger endpoint security surface.
- Harder cross-platform support and lifecycle reliability.
- Requires highly robust consent, permission, and kill-switch UX.

Best fit:
- High-friction authentication scenarios and user-assisted tasks where session locality matters.

## Option C: Full desktop agent control on user machine
Description:
- Agent can act at OS level beyond browser.

Pros:
- Maximum flexibility and parity with human capabilities.

Cons:
- Highest risk profile by far.
- Hard to secure, govern, and support at enterprise quality.
- Significant policy/legal and trust complexity.

Best fit:
- Specialized power-user mode only, not default product path.

## Recommendation on execution surface
Default to Option A now, design APIs to optionally support Option B later, and avoid Option C as a core roadmap commitment.

## Is using a user's existing browser session possible?
Yes, technically possible. The secure way is not "share all browser internals to backend". The safer pattern is a local connector model:

1. User installs a signed extension/native helper.
2. User grants scoped consent per site/workflow.
3. Backend sends signed, policy-scoped action requests.
4. Local connector executes actions and returns redacted telemetry/snapshots.
5. User can instantly pause/revoke; ownership indicator is always visible.

### Security requirements if pursuing user-browser mode
- Explicit consent UX with per-domain scopes.
- Least-privilege action policy (no unrestricted script execution by default).
- End-to-end signed command channel with replay protection.
- Local secrets remain local where possible.
- Hard session boundaries and emergency stop.
- Enterprise-grade audit logs without secret leakage.

Without these controls, this mode is not acceptable for serious deployments.

## How full user takeover UX should work
Target interaction model:
1. CUA operates session normally.
2. On sensitive/blocked step, system requests takeover.
3. UI enters user-control mode:
   - pulsing border around session viewport
   - clear "User in control" state
   - CUA actions paused/queued
4. User completes sensitive action.
5. User clicks "Return control to CUA".
6. CUA resumes with refreshed state and explicit handoff event.

This model should be supported both in dashboard and in MCP App interactive view once transport exists.

## Converting connection capture to flow recipes: why it matters
Why do it:
- Converts one-time human rescue work into reusable automation assets.
- Creates faster onboarding for repeated secure workflows.
- Reduces repeated manual intervention burden over time.

What to enforce:
- Step normalization and determinism checks.
- Secret placeholders and variable references only.
- Review/edit gate before save.
- Replay under connection policy and consent constraints.

## Worth building? decision matrix

### Strategic value
High.

### Engineering risk
Medium.

### Security/compliance burden
Medium to high, depending on whether user-browser connector is included.

### Reliability ceiling
Medium to high for scoped domains with HITL; low for universal autonomous claims.

### Recommendation
Proceed, but in phases with measurable gates and explicit non-goals.

## Suggested 90-day roadmap

### Track 1 (Weeks 1-3): control ownership foundation
- Add runtime control state machine and APIs.
- Add immutable ownership transition events.
- Implement dashboard takeover UX states.

### Track 2 (Weeks 2-5): MCP interactive viewport MVP
- Build frame/input transport for MCP app widget.
- Add pulsing takeover border and return-control CTA.
- Add latency/error instrumentation.

### Track 3 (Weeks 4-8): flow capture MVP
- Persist action timelines.
- Compile to flow DSL.
- Add review/edit/save to pattern library.
- Add replay executor with policy checks.

### Track 4 (Weeks 8-12): hardening and pilots
- Site-specific reliability tuning on target utilities.
- Security review of logs, consent, retention.
- Pilot metrics and go/no-go for broader rollout.

## Success metrics to track
- Handoff success rate (`agent -> user -> agent`).
- Time-to-completion delta with vs without takeover.
- Flow replay success over 7-day and 30-day windows.
- Number of tasks requiring repeated manual rescue after flow capture.
- Security incidents and redaction misses.

## Explicit non-goals for initial rollout
- Universal captcha bypass claims.
- Full unattended autonomy on sensitive financial/legal actions.
- Cross-OS desktop control as default mode.

## Final guidance
For this repository, the most leverage comes from becoming the best secure API-gap bridge:
- constrained remote automation,
- clean human takeover,
- and durable human-to-recipe flow capture.

Add user-browser session control later as an optional advanced mode, only if the consent and security model is strong enough to stand up in real enterprise use.

## Source notes used for this evaluation
- OpenAI: Operator and CUA pages, plus Computer tool developer guide.
- Anthropic: Computer-use API/tool docs and long-running harness engineering guidance.
- OpenClaw and Browser Use public docs/readme positioning for current product direction signals.
