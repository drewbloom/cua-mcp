export const ONBOARDING_APP_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CUA Control Plane</title>
    <style>
      :root {
        --paper: #f3efe6;
        --mist: rgba(255, 255, 255, 0.76);
        --panel: rgba(255, 252, 247, 0.86);
        --ink: #10202f;
        --muted: #617388;
        --line: rgba(16, 32, 47, 0.12);
        --line-strong: rgba(16, 32, 47, 0.22);
        --accent: #0d6d67;
        --accent-strong: #0b5854;
        --accent-wash: rgba(13, 109, 103, 0.1);
        --warning: #9c6a22;
        --danger: #9b3551;
        --output: #0d1823;
        --output-ink: #d7e9fb;
        --shadow: 0 24px 60px rgba(16, 32, 47, 0.12);
        --radius-lg: 28px;
        --radius-md: 18px;
        --radius-sm: 12px;
        --hero-max: 1380px;
      }

      * { box-sizing: border-box; }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at 10% 0%, rgba(237, 211, 162, 0.45), transparent 28%),
          radial-gradient(circle at 88% 18%, rgba(109, 171, 167, 0.23), transparent 24%),
          linear-gradient(180deg, #efe6d7 0%, #f7f3eb 28%, #f2efe8 52%, #eef3f5 100%);
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.18)),
          linear-gradient(90deg, rgba(16,32,47,0.035) 1px, transparent 1px),
          linear-gradient(rgba(16,32,47,0.035) 1px, transparent 1px);
        background-size: auto, 48px 48px, 48px 48px;
        mask-image: radial-gradient(circle at center, black 45%, transparent 92%);
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .hero {
        position: relative;
        overflow: clip;
        min-height: 100svh;
        display: flex;
        align-items: stretch;
      }

      .hero::after {
        content: "";
        position: absolute;
        inset: auto 0 0;
        height: 140px;
        background: linear-gradient(180deg, transparent, rgba(242, 239, 232, 0.96));
        pointer-events: none;
      }

      .hero-inner {
        width: min(var(--hero-max), calc(100% - 32px));
        margin: 0 auto;
        display: grid;
        grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.25fr);
        gap: 28px;
        align-items: end;
        padding: 24px 0 28px;
      }

      .brand-rail {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: calc(100svh - 52px);
        padding: 24px 0 18px;
      }

      .brand-lockup {
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: rgba(16, 32, 47, 0.7);
      }

      .brand-badge {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        color: #fff;
        font-weight: 800;
        letter-spacing: 0.06em;
        background: linear-gradient(145deg, #0d6d67, #124f74);
        box-shadow: 0 16px 28px rgba(13, 109, 103, 0.25);
      }

      .hero-copy {
        max-width: 430px;
        display: grid;
        gap: 18px;
      }

      .eyebrow {
        margin: 0;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 12px;
        font-weight: 700;
      }

      .hero-copy h1 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        font-size: clamp(3rem, 6vw, 5.4rem);
        line-height: 0.94;
        letter-spacing: -0.05em;
        max-width: 9ch;
      }

      .hero-copy p {
        margin: 0;
        max-width: 32ch;
        font-size: clamp(1rem, 1.2vw, 1.14rem);
        line-height: 1.55;
        color: rgba(16, 32, 47, 0.78);
      }

      .hero-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .hero-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 13px 18px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.02em;
        border: 1px solid transparent;
        transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease;
      }

      .hero-button.primary {
        color: #fff;
        background: linear-gradient(135deg, var(--accent), #0c5879);
        box-shadow: 0 14px 28px rgba(12, 88, 121, 0.2);
      }

      .hero-button.secondary {
        color: var(--ink);
        background: rgba(255,255,255,0.62);
        border-color: rgba(16, 32, 47, 0.1);
      }

      .hero-button:hover {
        transform: translateY(-1px);
      }

      .hero-panel {
        align-self: stretch;
        position: relative;
        border: 1px solid rgba(255,255,255,0.58);
        border-radius: 34px;
        background:
          linear-gradient(155deg, rgba(255,255,255,0.82), rgba(255,252,247,0.6)),
          linear-gradient(145deg, rgba(13,109,103,0.08), rgba(12,88,121,0.08));
        box-shadow: var(--shadow);
        backdrop-filter: blur(18px);
        overflow: hidden;
        min-height: calc(100svh - 52px);
      }

      .hero-panel::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 80% 18%, rgba(12,88,121,0.15), transparent 24%),
          radial-gradient(circle at 22% 12%, rgba(13,109,103,0.12), transparent 20%);
        pointer-events: none;
      }

      .hero-panel-inner {
        position: relative;
        display: grid;
        grid-template-rows: auto auto 1fr;
        gap: 18px;
        padding: 24px 24px 22px;
        min-height: 100%;
      }

      .status-strip {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(16,32,47,0.08);
      }

      .status-kicker {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--muted);
        margin-bottom: 6px;
      }

      .status-strip strong {
        font-size: 20px;
      }

      .trust-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .trust-cell {
        min-height: 132px;
        padding: 16px;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(16, 32, 47, 0.08);
      }

      .trust-cell span {
        display: inline-block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--muted);
      }

      .trust-cell h2 {
        margin: 10px 0 6px;
        font-size: 17px;
        line-height: 1.2;
      }

      .trust-cell p {
        margin: 0;
        color: rgba(16, 32, 47, 0.7);
        font-size: 13px;
        line-height: 1.5;
      }

      .rail-panel {
        border-top: 1px solid rgba(16,32,47,0.08);
        padding-top: 18px;
      }

      .trust-list {
        display: grid;
        gap: 10px;
      }

      .trust-item {
        display: grid;
        gap: 4px;
      }

      .trust-item strong {
        font-size: 13px;
      }

      .trust-item span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .workspace {
        width: min(var(--hero-max), calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 64px;
        display: grid;
        grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
        gap: 30px;
      }

      .workspace-nav {
        position: sticky;
        top: 22px;
        align-self: start;
        padding: 18px 0 12px;
      }

      .nav-label {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 12px;
      }

      .step-list {
        display: grid;
        gap: 8px;
      }

      .step-link {
        display: grid;
        grid-template-columns: 36px 1fr;
        gap: 10px;
        align-items: start;
        padding: 10px 12px;
        border-radius: 18px;
        border: 1px solid transparent;
        transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease;
      }

      .step-link:hover,
      .step-link.active {
        background: rgba(255,255,255,0.66);
        border-color: rgba(16,32,47,0.08);
        transform: translateX(2px);
      }

      .step-index {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(16,32,47,0.07);
        font-size: 12px;
        font-weight: 700;
      }

      .step-link.active .step-index {
        background: linear-gradient(135deg, var(--accent), #0c5879);
        color: #fff;
      }

      .step-copy strong {
        display: block;
        font-size: 13px;
        margin-bottom: 3px;
      }

      .step-copy span {
        display: block;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .workspace-main {
        display: grid;
        gap: 24px;
      }

      .section-panel {
        position: relative;
        padding: 24px;
        border-radius: var(--radius-lg);
        border: 1px solid rgba(255,255,255,0.6);
        background: linear-gradient(180deg, rgba(255,255,255,0.68), rgba(255,252,247,0.8));
        box-shadow: 0 18px 42px rgba(16, 32, 47, 0.08);
        backdrop-filter: blur(12px);
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 440ms ease, transform 440ms ease;
      }

      .section-panel.in-view {
        opacity: 1;
        transform: translateY(0);
      }

      .section-head {
        display: grid;
        gap: 8px;
        margin-bottom: 18px;
      }

      .section-number {
        font-size: 12px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .section-head h2 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        font-size: clamp(1.7rem, 2vw, 2.2rem);
        letter-spacing: -0.035em;
      }

      .section-head p {
        margin: 0;
        max-width: 60ch;
        color: rgba(16,32,47,0.72);
        line-height: 1.55;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px 16px;
      }

      .field-grid.single {
        grid-template-columns: 1fr;
      }

      .field-span-2 {
        grid-column: 1 / -1;
      }

      .field {
        display: grid;
        gap: 6px;
      }

      .field-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--muted);
        font-weight: 700;
      }

      input,
      textarea,
      select {
        width: 100%;
        border: 1px solid rgba(16,32,47,0.12);
        border-radius: 16px;
        background: rgba(255,255,255,0.82);
        color: var(--ink);
        font: inherit;
        padding: 13px 14px;
        transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      input:focus,
      textarea:focus,
      select:focus {
        outline: none;
        border-color: rgba(13,109,103,0.48);
        box-shadow: 0 0 0 4px rgba(13,109,103,0.11);
        background: rgba(255,255,255,0.95);
      }

      textarea {
        min-height: 112px;
        resize: vertical;
      }

      .button-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 18px;
      }

      button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 12px 16px;
        min-height: 44px;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.01em;
        cursor: pointer;
        color: #fff;
        background: linear-gradient(135deg, var(--accent), #0c5879);
        transition: transform 180ms ease, opacity 180ms ease, box-shadow 180ms ease;
        box-shadow: 0 12px 22px rgba(12, 88, 121, 0.16);
      }

      button:hover {
        transform: translateY(-1px);
      }

      button.secondary {
        background: rgba(16,32,47,0.8);
        box-shadow: none;
      }

      button.danger {
        background: linear-gradient(135deg, var(--danger), #842645);
        box-shadow: 0 12px 22px rgba(155,53,81,0.18);
      }

      button.ghost {
        background: rgba(255,255,255,0.78);
        color: var(--ink);
        border: 1px solid rgba(16,32,47,0.12);
        box-shadow: none;
      }

      .output-shell {
        margin-top: 18px;
        display: grid;
        gap: 10px;
      }

      .output-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .output-head span {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--muted);
      }

      pre {
        margin: 0;
        padding: 16px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.08);
        background:
          radial-gradient(circle at 90% 8%, rgba(89, 168, 202, 0.18), transparent 26%),
          linear-gradient(180deg, #101925, #0a121b);
        color: var(--output-ink);
        min-height: 190px;
        max-height: 360px;
        overflow: auto;
        font-size: 12px;
        line-height: 1.55;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
      }

      .summary-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .summary-block {
        padding: 14px 16px;
        border-radius: 18px;
        background: rgba(255,255,255,0.54);
        border: 1px solid rgba(16,32,47,0.08);
      }

      .summary-block strong {
        display: block;
        margin-top: 6px;
        font-size: 17px;
      }

      .summary-block span {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--muted);
      }

      .one-time-key {
        display: none;
        margin-top: 18px;
        padding: 18px;
        border-radius: 22px;
        background: linear-gradient(180deg, rgba(14, 29, 43, 0.95), rgba(11, 21, 31, 0.98));
        color: #f1f6ff;
        box-shadow: 0 22px 38px rgba(11,21,31,0.18);
      }

      .one-time-key strong {
        display: block;
        margin-bottom: 8px;
        font-size: 15px;
      }

      .one-time-key p {
        margin: 0 0 12px;
        font-size: 13px;
        line-height: 1.5;
        color: rgba(241,246,255,0.8);
      }

      .capture-preview {
        display: grid;
        gap: 12px;
        margin-top: 18px;
      }

      .capture-frame {
        position: relative;
        overflow: hidden;
        border-radius: 22px;
        border: 1px solid rgba(16, 32, 47, 0.1);
        background: rgba(16, 24, 35, 0.92);
        min-height: 280px;
      }

      .capture-frame.empty {
        display: grid;
        place-items: center;
        padding: 24px;
        color: rgba(215, 233, 251, 0.72);
        font-size: 13px;
        line-height: 1.5;
      }

      .capture-frame img {
        display: block;
        width: 100%;
        height: auto;
        cursor: crosshair;
      }

      .capture-marker {
        position: absolute;
        width: 16px;
        height: 16px;
        border-radius: 999px;
        border: 2px solid #fff;
        background: rgba(13, 109, 103, 0.9);
        box-shadow: 0 0 0 4px rgba(13, 109, 103, 0.22);
        transform: translate(-50%, -50%);
        pointer-events: none;
        display: none;
      }

      .capture-selection {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.5;
      }

      .capture-summary {
        display: grid;
        gap: 12px;
        margin-top: 18px;
        padding: 16px 18px;
        border-radius: 22px;
        border: 1px solid rgba(16,32,47,0.08);
        background: rgba(255,255,255,0.6);
      }

      .capture-summary.empty {
        color: var(--muted);
      }

      .capture-summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .capture-summary-card {
        padding: 14px;
        border-radius: 18px;
        background: rgba(255,255,255,0.72);
        border: 1px solid rgba(16,32,47,0.08);
      }

      .capture-summary-card span {
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--muted);
      }

      .capture-summary-card strong {
        display: block;
        margin-top: 8px;
        font-size: 15px;
        line-height: 1.35;
      }

      .capture-summary-list {
        display: grid;
        gap: 8px;
        margin: 0;
        padding-left: 18px;
        color: rgba(16, 32, 47, 0.76);
        font-size: 13px;
        line-height: 1.5;
      }

      .capture-history-list {
        display: grid;
        gap: 10px;
      }

      .capture-history-item {
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid rgba(16,32,47,0.08);
        background: rgba(255,255,255,0.68);
      }

      .capture-history-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }

      .capture-history-id {
        font-size: 12px;
        font-weight: 700;
        color: var(--ink);
        word-break: break-all;
      }

      .capture-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        border: 1px solid rgba(16,32,47,0.08);
      }

      .capture-badge.ready,
      .capture-badge.completed {
        color: #0b5b49;
        background: rgba(224, 247, 237, 0.88);
      }

      .capture-badge.cancelled {
        color: #8a5a1e;
        background: rgba(255, 243, 223, 0.92);
      }

      .capture-badge.failed {
        color: #862b45;
        background: rgba(255, 239, 244, 0.94);
      }

      .capture-meta {
        display: grid;
        gap: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .capture-history-empty {
        padding: 16px;
        border-radius: 18px;
        background: rgba(255,255,255,0.54);
        color: var(--muted);
        font-size: 13px;
      }

      .one-time-key input {
        background: rgba(255,255,255,0.08);
        color: #fff;
        border-color: rgba(255,255,255,0.12);
      }

      .micro-copy {
        margin-top: 12px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.5;
      }

      .banner {
        position: fixed;
        right: 20px;
        bottom: 20px;
        max-width: min(520px, calc(100% - 32px));
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid rgba(16,32,47,0.08);
        background: rgba(255,255,255,0.88);
        box-shadow: 0 24px 50px rgba(16, 32, 47, 0.12);
        font-size: 13px;
        line-height: 1.45;
        backdrop-filter: blur(14px);
        z-index: 20;
      }

      .banner.ok {
        color: #0b5b49;
        border-color: rgba(11, 91, 73, 0.18);
        background: rgba(236, 250, 244, 0.95);
      }

      .banner.err {
        color: #862b45;
        border-color: rgba(134, 43, 69, 0.18);
        background: rgba(255, 242, 246, 0.95);
      }

      .mobile-jump {
        display: none;
      }

      @media (max-width: 1080px) {
        .hero-inner,
        .workspace {
          grid-template-columns: 1fr;
        }

        .brand-rail,
        .hero-panel {
          min-height: auto;
        }

        .workspace-nav {
          position: static;
          padding-top: 0;
        }
      }

      @media (max-width: 840px) {
        .trust-grid,
        .summary-strip,
        .field-grid,
        .capture-summary-grid {
          grid-template-columns: 1fr;
        }

        .hero-inner {
          width: min(100%, calc(100% - 24px));
          padding-top: 16px;
        }

        .workspace {
          width: min(100%, calc(100% - 24px));
          padding-top: 22px;
        }

        .brand-rail {
          gap: 20px;
        }

        .hero-copy h1 {
          max-width: 10ch;
        }

        .mobile-jump {
          display: inline-flex;
        }
      }
    </style>
  </head>
  <body>
    <header class="hero">
      <div class="hero-inner">
        <aside class="brand-rail">
          <div class="brand-lockup">
            <div class="brand-badge">CUA</div>
            <div>Control Plane</div>
          </div>

          <div class="hero-copy">
            <p class="eyebrow">Secure onboarding for autonomous browser work</p>
            <h1>Connect users, issue keys, and scope trust.</h1>
            <p>
              This console turns browser automation into a deliberate access layer: one-time login, scoped
              machine keys, connection policies, and secret references that stay encrypted end to end.
            </p>
            <div class="hero-actions">
              <a class="hero-button primary" href="#session-step">Start with email login</a>
              <a class="hero-button secondary mobile-jump" href="#keys-step">Jump to keys</a>
            </div>
          </div>

          <div class="rail-panel trust-list">
            <div class="trust-item">
              <strong>Least-privilege by default</strong>
              <span>Connections and secret refs are constrained to the hosts and paths a user actually approves.</span>
            </div>
            <div class="trust-item">
              <strong>Secrets never become prompt text</strong>
              <span>Operators and orchestrators work with refs, policy, and audit outcomes rather than raw values.</span>
            </div>
            <div class="trust-item">
              <strong>Built for developers, readable for everyone</strong>
              <span>Every step is explicit enough for implementation teams and simple enough for customer onboarding.</span>
            </div>
          </div>
        </aside>

        <section class="hero-panel" aria-label="Trust overview">
          <div class="hero-panel-inner">
            <div class="status-strip">
              <div>
                <div class="status-kicker">Current workspace</div>
                <strong>Developer-first onboarding</strong>
              </div>
              <div class="hero-actions">
                <a class="hero-button secondary" href="#connections-step">Map a connection</a>
              </div>
            </div>

            <div class="trust-grid">
              <article class="trust-cell">
                <span>Identity</span>
                <h2>OTP login and session refresh</h2>
                <p>Users authenticate with a code flow first, then everything else inherits that verified context.</p>
              </article>
              <article class="trust-cell">
                <span>Machine access</span>
                <h2>Issue API keys with narrow scope</h2>
                <p>Provision keys once, then bind them to the exact connections the user wants available to MCP clients.</p>
              </article>
              <article class="trust-cell">
                <span>Execution trust</span>
                <h2>Secrets stay encrypted and referenced</h2>
                <p>Approved hosts, path prefixes, and fill plans define where credentials can be used and nowhere else.</p>
              </article>
            </div>

            <div class="summary-strip">
              <div class="summary-block">
                <span>1</span>
                <strong>Verify the user</strong>
              </div>
              <div class="summary-block">
                <span>2</span>
                <strong>Provision machine trust</strong>
              </div>
              <div class="summary-block">
                <span>3</span>
                <strong>Map utility access</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </header>

    <main class="workspace">
      <aside class="workspace-nav">
        <div class="nav-label">Workflow</div>
        <nav class="step-list" aria-label="Onboarding steps">
          <a class="step-link" href="#session-step" data-step-link="session-step">
            <div class="step-index">01</div>
            <div class="step-copy">
              <strong>Session</strong>
              <span>Verify email, establish the browser session, and inspect the active auth context.</span>
            </div>
          </a>
          <a class="step-link" href="#llm-step" data-step-link="llm-step">
            <div class="step-index">02</div>
            <div class="step-copy">
              <strong>Model keys</strong>
              <span>Store each user's OpenAI key privately and mark exactly one active key for CUA execution.</span>
            </div>
          </a>
          <a class="step-link" href="#keys-step" data-step-link="keys-step">
            <div class="step-index">03</div>
            <div class="step-copy">
              <strong>API keys</strong>
              <span>Issue one-time machine keys and bind them to exactly the connections they should reach.</span>
            </div>
          </a>
          <a class="step-link" href="#connections-step" data-step-link="connections-step">
            <div class="step-index">04</div>
            <div class="step-copy">
              <strong>Connections</strong>
              <span>Declare the base host, approved subdomains, and path prefixes that define the safe boundary.</span>
            </div>
          </a>
          <a class="step-link" href="#secrets-step" data-step-link="secrets-step">
            <div class="step-index">05</div>
            <div class="step-copy">
              <strong>Secret refs</strong>
              <span>Store encrypted refs, preview fill plans, and prove the execution layer only reaches allowed URLs.</span>
            </div>
          </a>
        </nav>
      </aside>

      <div class="workspace-main">
        <section class="section-panel" id="session-step" data-reveal>
          <div class="section-head">
            <div class="section-number">Step 01 · Identity</div>
            <h2>Log the user in without making the flow feel like infrastructure.</h2>
            <p>
              Start with the human trust layer. Request a login code, verify it, and keep the session fresh before you issue keys or map any utility access.
            </p>
          </div>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Email address</span>
              <input id="email" placeholder="you@example.com" />
            </label>
            <label class="field">
              <span class="field-label">Display name</span>
              <input id="displayName" placeholder="Optional but helpful for audit trails" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">Verification code</span>
              <input id="otpCode" placeholder="Enter the one-time code you received" />
            </label>
          </div>

          <div class="button-row">
            <button id="requestCode">Send login code</button>
            <button class="secondary" id="verifyCode">Verify code</button>
            <button class="ghost" id="refreshSession">Refresh session</button>
            <button class="danger" id="logout">End session</button>
          </div>

          <div class="output-shell">
            <div class="output-head"><span>Session log</span></div>
            <pre id="sessionOut">Session output</pre>
          </div>
        </section>

        <section class="section-panel" id="llm-step" data-reveal>
          <div class="section-head">
            <div class="section-number">Step 02 · Model credentials</div>
            <h2>Bind browser execution to the user’s own OpenAI key instead of any shared server credential.</h2>
            <p>
              Each user can store multiple OpenAI keys, activate one at a time, and rotate without touching anyone else’s runs. The raw key is accepted once, encrypted immediately, and never rendered back.
            </p>
          </div>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Provider</span>
              <select id="llmProvider">
                <option value="openai">openai</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label">Key label</span>
              <input id="llmKeyName" placeholder="Primary OpenAI key, staging budget key, personal sandbox" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">OpenAI API key</span>
              <input id="llmApiKey" placeholder="sk-..." type="password" autocomplete="off" />
            </label>
            <label class="field">
              <span class="field-label">Activate key id</span>
              <input id="activateLlmKeyId" placeholder="Paste an existing model key id to make it active" />
            </label>
            <label class="field">
              <span class="field-label">Revoke key id</span>
              <input id="revokeLlmKeyId" placeholder="Revoke a stored model key by id" />
            </label>
          </div>

          <div class="button-row">
            <button id="createLlmKey">Store OpenAI key</button>
            <button class="secondary" id="listLlmKeys">List model keys</button>
            <button class="ghost" id="activateLlmKey">Activate key</button>
            <button class="danger" id="revokeLlmKey">Revoke key</button>
          </div>

          <div class="output-shell">
            <div class="output-head"><span>Model key inventory</span></div>
            <pre id="llmOut">Model key output</pre>
          </div>
        </section>

        <section class="section-panel" id="keys-step" data-reveal>
          <div class="section-head">
            <div class="section-number">Step 03 · Machine trust</div>
            <h2>Issue API keys once, then let machines carry only the access they should.</h2>
            <p>
              Keys are shown once and then redacted everywhere else. Keep them narrow, map them to approved connections, and revoke them the moment you no longer need them.
            </p>
          </div>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Key label</span>
              <input id="keyName" placeholder="Primary workstation, internal agent, staging automation" />
            </label>
            <label class="field">
              <span class="field-label">Allowed connection IDs</span>
              <input id="keyConnIds" placeholder="Comma-separated connection ids to scope this key" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">Revoke key by id</span>
              <input id="revokeKeyId" placeholder="Paste an existing key id to revoke it" />
            </label>
          </div>

          <div class="button-row">
            <button id="createKey">Create API key</button>
            <button class="secondary" id="listKeys">List active keys</button>
            <button class="danger" id="revokeKey">Revoke key</button>
          </div>

          <div id="oneTimeKeyPanel" class="one-time-key">
            <strong>One-time API key</strong>
            <p>Copy this now. It will not be rendered again and it is intentionally hidden from the generic response log below.</p>
            <label class="field">
              <span class="field-label" style="color: rgba(241,246,255,0.72)">Secret value</span>
              <input id="oneTimeKeyValue" readonly />
            </label>
            <div class="button-row">
              <button class="secondary" id="copyOneTimeKey">Copy key</button>
              <button class="danger" id="clearOneTimeKey">Clear from screen</button>
            </div>
          </div>

          <div class="output-shell">
            <div class="output-head"><span>Key inventory</span></div>
            <pre id="keysOut">Keys output</pre>
          </div>
        </section>

        <section class="section-panel" id="connections-step" data-reveal>
          <div class="section-head">
            <div class="section-number">Step 04 · Utility mapping</div>
            <h2>Define where automation is trusted to go before it ever touches a credential.</h2>
            <p>
              A connection is a policy boundary: primary host, approved subdomains, permissive path prefixes, and the auth method you expect the CUA runtime to prefer first.
            </p>
          </div>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Connection name</span>
              <input id="connName" placeholder="Name the utility the way a user would recognize it" />
            </label>
            <label class="field">
              <span class="field-label">Base host</span>
              <input id="connBaseHost" placeholder="portal.example.com" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">Allowed hosts</span>
              <input id="connHosts" placeholder="Add approved subdomains or partner hosts separated by commas" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">Allowed path prefixes</span>
              <input id="connPaths" placeholder="/, /auth, /dashboard, /release-notes" />
            </label>
            <label class="field">
              <span class="field-label">Preferred auth method</span>
              <select id="connAuthMethod">
                <option value="oauth">oauth</option>
                <option value="auth_state">auth_state</option>
                <option value="credentials">credentials</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label">Patch status</span>
              <select id="patchConnStatus">
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="disabled">disabled</option>
              </select>
            </label>
            <label class="field field-span-2">
              <span class="field-label">Patch connection id</span>
              <input id="patchConnId" placeholder="Use this to pause or disable an existing connection" />
            </label>
          </div>

          <div class="button-row">
            <button id="createConn">Create connection</button>
            <button class="secondary" id="listConn">List connections</button>
            <button class="ghost" id="patchConn">Patch connection</button>
          </div>

          <p class="micro-copy">
            Approved hosts and path prefixes are the contract the execution layer must satisfy before any secret reference can be resolved.
          </p>

          <div class="output-shell">
            <div class="output-head"><span>Connection policy log</span></div>
            <pre id="connOut">Connections output</pre>
          </div>
        </section>

        <section class="section-panel" id="secrets-step" data-reveal>
          <div class="section-head">
            <div class="section-number">Step 05 · Secret references</div>
            <h2>Store only what the runtime needs, then prove it can be applied safely.</h2>
            <p>
              Secret values and saved auth states are encrypted at rest and never displayed back after creation. Build a fill plan against an exact URL to confirm the runtime sees only the references it should use.
            </p>
          </div>

          <div class="field-grid">
            <label class="field field-span-2">
              <span class="field-label">Connection id</span>
              <input id="secretConnId" placeholder="Select the connection that owns this secret ref" />
            </label>
            <label class="field">
              <span class="field-label">Secret type</span>
              <select id="secretType">
                <option value="username">username</option>
                <option value="password">password</option>
                <option value="otp">otp</option>
                <option value="api_token">api_token</option>
                <option value="cookie_bundle">cookie_bundle</option>
              </select>
            </label>
            <label class="field field-span-2">
              <span class="field-label">Secret value</span>
              <textarea id="secretValue" placeholder="Paste the value once. It will be encrypted and cleared from this form after submission."></textarea>
            </label>
            <label class="field">
              <span class="field-label">Delete secret id</span>
              <input id="deleteSecretId" placeholder="Delete a specific stored ref by id" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">Target URL for fill plan</span>
              <input id="planUrl" placeholder="https://portal.example.com/login" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">Required secret types</span>
              <input id="planTypes" placeholder="username,password or token,cookie_bundle" />
            </label>
            <label class="field">
              <span class="field-label">Auth state type</span>
              <select id="authStateType">
                <option value="playwright_storage_state_json">playwright_storage_state_json</option>
                <option value="cookie_bundle_json">cookie_bundle_json</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label">Auth state expiry</span>
              <input id="authStateExpiresAt" placeholder="2026-01-31T18:30:00Z" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">Auth state import file</span>
              <input id="authStateFile" type="file" accept="application/json,.json" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">Auth state payload</span>
              <textarea id="authStatePayload" placeholder='Paste Playwright storageState JSON or a cookie bundle JSON object.'></textarea>
            </label>
            <label class="field">
              <span class="field-label">Delete auth state id</span>
              <input id="deleteAuthStateId" placeholder="Delete a stored auth state by id" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">Capture session id</span>
              <input id="captureSessionId" placeholder="Start a capture session to populate this automatically" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">Capture start URL</span>
              <input id="captureStartUrl" placeholder="https://portal.example.com/login" />
            </label>
            <label class="field">
              <span class="field-label">Navigate URL</span>
              <input id="captureNavigateUrl" placeholder="https://portal.example.com/account" />
            </label>
            <label class="field">
              <span class="field-label">Type text</span>
              <input id="captureTypeText" placeholder="Text to type into the controlled browser" />
            </label>
            <label class="field">
              <span class="field-label">Keypress combo</span>
              <input id="captureKeypress" placeholder="Tab or Control+L" />
            </label>
            <label class="field">
              <span class="field-label">Click position</span>
              <input id="captureClick" placeholder="x,y" />
            </label>
            <label class="field">
              <span class="field-label">Scroll delta Y</span>
              <input id="captureScrollY" placeholder="600" />
            </label>
            <label class="field">
              <span class="field-label">Wait milliseconds</span>
              <input id="captureWaitMs" placeholder="1000" />
            </label>
          </div>

          <div class="button-row">
            <button id="addSecret">Add secret ref</button>
            <button class="secondary" id="listSecrets">List secret refs</button>
            <button class="danger" id="deleteSecret">Delete secret ref</button>
            <button class="secondary" id="addAuthState">Add auth state</button>
            <button class="secondary" id="importAuthState">Import auth state file</button>
            <button class="secondary" id="listAuthStates">List auth states</button>
            <button class="danger" id="deleteAuthState">Delete auth state</button>
            <button class="ghost" id="secretPlan">Preview fill plan</button>
            <button class="secondary" id="startCapture">Start capture</button>
            <button class="secondary" id="listCaptureSessions">List captures</button>
            <button class="ghost" id="refreshCapture">Refresh capture</button>
            <button class="ghost" id="captureNavigate">Navigate capture</button>
            <button class="ghost" id="captureType">Type into capture</button>
            <button class="ghost" id="captureKey">Keypress capture</button>
            <button class="ghost" id="captureClickButton">Click capture</button>
            <button class="ghost" id="captureScrollButton">Scroll capture</button>
            <button class="ghost" id="captureWaitButton">Wait capture</button>
            <button class="secondary" id="finalizeCapture">Finalize capture</button>
            <button class="danger" id="cancelCapture">Cancel capture</button>
          </div>

          <div class="capture-preview">
            <div id="captureFrame" class="capture-frame empty">
              <img id="captureImage" alt="Live capture session preview" style="display:none" />
              <div id="captureMarker" class="capture-marker" aria-hidden="true"></div>
              <div id="captureEmptyText">Start an auth capture session to control an isolated browser and save auth state directly from the flow.</div>
            </div>
            <div class="capture-selection">
              <span>Click inside the screenshot to populate the click position for the next action.</span>
              <strong id="captureSelectionText">No coordinate selected</strong>
            </div>
          </div>

          <div class="output-shell">
            <div class="output-head"><span>Secret, auth-state, and fill-plan log</span></div>
            <pre id="secretOut">Secrets output</pre>
          </div>

          <div class="output-shell">
            <div class="output-head"><span>Capture session log</span></div>
            <pre id="captureOut">Capture output</pre>
          </div>

          <div class="output-shell">
            <div class="output-head"><span>Capture finalize summary</span></div>
            <div id="captureSummary" class="capture-summary empty">Finalize a capture to see which auth artifacts were saved and which hosts or paths were discovered.</div>
          </div>

          <div class="output-shell">
            <div class="output-head"><span>Capture session history</span></div>
            <div id="captureHistoryOut" class="capture-history-empty">No capture history loaded yet.</div>
          </div>
        </section>
      </div>
    </main>

    <div id="banner" class="banner">Ready.</div>

    <script>
      const $ = (id) => document.getElementById(id);
      const out = {
        session: $('sessionOut'),
        llm: $('llmOut'),
        keys: $('keysOut'),
        conn: $('connOut'),
        secret: $('secretOut'),
        capture: $('captureOut'),
        captureHistory: $('captureHistoryOut'),
      };
      const banner = $('banner');
      const captureImage = $('captureImage');
      const captureMarker = $('captureMarker');
      const captureSelectionText = $('captureSelectionText');
      const captureSummary = $('captureSummary');
      const sections = Array.from(document.querySelectorAll('[data-reveal]'));
      const navLinks = Array.from(document.querySelectorAll('[data-step-link]'));

      function setBanner(kind, message) {
        banner.className = 'banner ' + (kind || '');
        banner.textContent = message;
      }

      function looksLikeFeatureDisabled(status, body) {
        if (status !== 404) return false;
        const msg = String(body?.error || body?.raw || '').toLowerCase();
        return msg.includes('not found') || msg.includes('disabled') || msg.includes('feature');
      }

      function redact(value) {
        if (Array.isArray(value)) return value.map(redact);
        if (!value || typeof value !== 'object') return value;

        const outObj = {};
        for (const [k, v] of Object.entries(value)) {
          const key = String(k).toLowerCase();
          if (key.includes('secret') || key.includes('password') || key.includes('code') || key.includes('token') || key.includes('cookie')) {
            outObj[k] = '[redacted]';
          } else {
            outObj[k] = redact(v);
          }
        }
        return outObj;
      }

      function requireText(id, label) {
        const el = $(id);
        const value = String(el?.value || '').trim();
        if (!value) {
          setBanner('err', label + ' is required.');
          el?.focus();
          return null;
        }
        return value;
      }

      function requireEmail(id) {
        const value = requireText(id, 'Email');
        if (!value) return null;
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!ok) {
          setBanner('err', 'Enter a valid email address.');
          $(id)?.focus();
          return null;
        }
        return value;
      }

      async function api(path, method = 'GET', body) {
        const res = await fetch(path, {
          method,
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        const text = await res.text();
        let parsed;
        try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
        if (!res.ok) {
          if (looksLikeFeatureDisabled(res.status, parsed)) {
            setBanner('err', 'This route is disabled on the server. Enable the matching backend feature flag before using this step.');
          } else {
            setBanner('err', 'Request failed (' + res.status + ').');
          }
          return { ok: false, status: res.status, body: parsed };
        }
        setBanner('ok', 'Request succeeded (' + res.status + ').');
        return { ok: true, status: res.status, body: parsed };
      }

      function splitCsv(raw) {
        return String(raw || '').split(',').map(v => v.trim()).filter(Boolean);
      }

      function detectAuthStateType(parsed) {
        if (!parsed || typeof parsed !== 'object') return null;
        const hasOrigins = Array.isArray(parsed.origins);
        const hasCookiesArray = Array.isArray(parsed.cookies);
        if (hasOrigins || hasCookiesArray) {
          return 'playwright_storage_state_json';
        }
        if (Array.isArray(parsed)) {
          return 'cookie_bundle_json';
        }
        if (Array.isArray(parsed.cookies)) {
          return 'cookie_bundle_json';
        }
        return null;
      }

      async function readSelectedAuthStateFile() {
        const input = $('authStateFile');
        const file = input?.files?.[0];
        if (!file) {
          setBanner('err', 'Select a JSON auth state file first.');
          input?.focus();
          return null;
        }
        const text = await file.text();
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          setBanner('err', 'Selected file is not valid JSON.');
          return null;
        }
        return {
          filename: file.name,
          text,
          parsed,
          detectedType: detectAuthStateType(parsed),
        };
      }

      function print(target, data) {
        target.textContent = JSON.stringify(redact(data), null, 2);
      }

      function escapeHtml(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function formatTimestamp(value) {
        if (!value) return 'Unknown time';
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString();
      }

      function renderCaptureHistory(data) {
        const body = data?.body || {};
        const captures = Array.isArray(body.captures) ? body.captures : [];
        if (!captures.length) {
          out.captureHistory.className = 'capture-history-empty';
          out.captureHistory.innerHTML = 'No capture sessions yet for this connection.';
          return;
        }

        out.captureHistory.className = 'capture-history-list';
        out.captureHistory.innerHTML = captures.map((capture) => {
          const status = escapeHtml(capture.status || 'unknown').toLowerCase();
          const currentUrl = escapeHtml(capture.currentUrl || 'about:blank');
          const title = escapeHtml(capture.title || 'Untitled page');
          const endedReason = capture.endedReason ? '<div><strong>Ended:</strong> ' + escapeHtml(capture.endedReason) + '</div>' : '';
          const lastError = capture.lastError ? '<div><strong>Last error:</strong> ' + escapeHtml(capture.lastError) + '</div>' : '';
          return '<article class="capture-history-item">' +
            '<div class="capture-history-head">' +
              '<div class="capture-history-id">' + escapeHtml(capture.sessionId || '') + '</div>' +
              '<span class="capture-badge ' + status + '">' + status + '</span>' +
            '</div>' +
            '<div class="capture-meta">' +
              '<div><strong>Updated:</strong> ' + escapeHtml(formatTimestamp(capture.updatedAt)) + '</div>' +
              '<div><strong>Page:</strong> ' + title + '</div>' +
              '<div><strong>URL:</strong> ' + currentUrl + '</div>' +
              endedReason +
              lastError +
            '</div>' +
          '</article>';
        }).join('');
      }

      function renderCaptureSummary(data) {
        const body = data?.body || {};
        const authState = body.authState || null;
        const connection = body.connection || null;
        const capture = body.capture || null;

        if (!authState && !connection && !capture) {
          captureSummary.className = 'capture-summary empty';
          captureSummary.textContent = 'Finalize a capture to see which auth artifacts were saved and which hosts or paths were discovered.';
          return;
        }

        const hosts = Array.isArray(connection?.allowedHosts) ? connection.allowedHosts : [];
        const paths = Array.isArray(connection?.allowedPathPrefixes) ? connection.allowedPathPrefixes : [];
        captureSummary.className = 'capture-summary';
        captureSummary.innerHTML =
          '<div class="capture-summary-grid">' +
            '<div class="capture-summary-card"><span>Connection</span><strong>' + escapeHtml(connection?.name || connection?.id || 'Updated') + '</strong></div>' +
            '<div class="capture-summary-card"><span>Auth state</span><strong>' + escapeHtml(authState?.stateType || 'Stored') + '</strong></div>' +
            '<div class="capture-summary-card"><span>Capture status</span><strong>' + escapeHtml(capture?.status || 'Completed') + '</strong></div>' +
          '</div>' +
          '<ol class="capture-summary-list">' +
            '<li>Saved auth artifact: <strong>' + escapeHtml(authState?.id || 'created') + '</strong></li>' +
            '<li>Allowed hosts now include: <strong>' + escapeHtml(hosts.slice(0, 5).join(', ') || 'none recorded') + '</strong></li>' +
            '<li>Allowed path prefixes now include: <strong>' + escapeHtml(paths.slice(0, 5).join(', ') || 'none recorded') + '</strong></li>' +
          '</ol>';
      }

      function renderCapture(data) {
        const snapshot = data?.body?.capture || data?.capture || null;
        if (!snapshot) {
          print(out.capture, data);
          return;
        }
        const frame = $('captureFrame');
        const emptyText = $('captureEmptyText');
        if (snapshot.screenshotDataUrl) {
          captureImage.src = snapshot.screenshotDataUrl;
          captureImage.style.display = 'block';
          frame.classList.remove('empty');
          if (emptyText) emptyText.style.display = 'none';
        } else {
          captureImage.removeAttribute('src');
          captureImage.style.display = 'none';
          frame.classList.add('empty');
          if (emptyText) emptyText.style.display = 'block';
          captureMarker.style.display = 'none';
          captureSelectionText.textContent = 'No coordinate selected';
        }
        $('captureSessionId').value = snapshot.sessionId || '';
        $('captureStartUrl').value = snapshot.currentUrl || $('captureStartUrl').value;
        print(out.capture, data);
      }

      async function refreshCaptureHistory() {
        const connId = String($('secretConnId')?.value || '').trim();
        if (!connId) return null;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions?limit=10');
        renderCaptureHistory(data);
        return data;
      }

      async function refreshConnectionArtifacts() {
        const connId = String($('secretConnId')?.value || '').trim();
        if (!connId) return;
        const [authStates, connections] = await Promise.all([
          api('/api/connections/' + encodeURIComponent(connId) + '/auth-states'),
          api('/api/connections'),
        ]);
        print(out.secret, authStates);
        print(out.conn, connections);
      }

      captureImage.addEventListener('click', (event) => {
        const rect = captureImage.getBoundingClientRect();
        if (!rect.width || !rect.height || !captureImage.naturalWidth || !captureImage.naturalHeight) {
          setBanner('err', 'Capture image is not ready for coordinate selection yet.');
          return;
        }

        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        const x = Math.max(0, Math.min(captureImage.naturalWidth, Math.round((offsetX / rect.width) * captureImage.naturalWidth)));
        const y = Math.max(0, Math.min(captureImage.naturalHeight, Math.round((offsetY / rect.height) * captureImage.naturalHeight)));

        $('captureClick').value = x + ',' + y;
        captureMarker.style.left = offsetX + 'px';
        captureMarker.style.top = offsetY + 'px';
        captureMarker.style.display = 'block';
        captureSelectionText.textContent = 'Selected ' + x + ',' + y;
        setBanner('ok', 'Capture click position selected from screenshot.');
      });

      function updateActiveSection(activeId) {
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('data-step-link') === activeId);
        });
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            updateActiveSection(entry.target.id);
          }
        });
      }, {
        threshold: 0.24,
        rootMargin: '-10% 0px -32% 0px',
      });

      sections.forEach((section) => observer.observe(section));
      updateActiveSection('session-step');

      $('requestCode').onclick = async () => {
        const email = requireEmail('email');
        if (!email) return;
        const data = await api('/api/auth/request-code', 'POST', {
          email,
          displayName: $('displayName').value,
        });
        print(out.session, data);
      };

      $('verifyCode').onclick = async () => {
        const email = requireEmail('email');
        if (!email) return;
        const code = requireText('otpCode', 'Code');
        if (!code) return;
        const data = await api('/api/auth/verify-code', 'POST', {
          email,
          code,
        });
        print(out.session, data);
      };

      $('refreshSession').onclick = async () => print(out.session, await api('/api/session/me'));
      $('logout').onclick = async () => print(out.session, await api('/api/session/logout', 'POST'));

      $('createLlmKey').onclick = async () => {
        const name = requireText('llmKeyName', 'Key label');
        if (!name) return;
        const apiKeyValue = requireText('llmApiKey', 'OpenAI API key');
        if (!apiKeyValue) return;
        const data = await api('/api/llm-keys', 'POST', {
          provider: $('llmProvider').value,
          name,
          apiKey: apiKeyValue,
          activate: true,
        });
        $('llmApiKey').value = '';
        print(out.llm, data);
      };

      $('listLlmKeys').onclick = async () => print(out.llm, await api('/api/llm-keys'));
      $('activateLlmKey').onclick = async () => {
        const id = requireText('activateLlmKeyId', 'Activate key ID');
        if (!id) return;
        print(out.llm, await api('/api/llm-keys/' + encodeURIComponent(id), 'PATCH', { isActive: true }));
      };

      $('revokeLlmKey').onclick = async () => {
        const id = requireText('revokeLlmKeyId', 'Revoke key ID');
        if (!id) return;
        print(out.llm, await api('/api/llm-keys/' + encodeURIComponent(id), 'DELETE'));
      };

      $('createKey').onclick = async () => {
        const name = requireText('keyName', 'Key label');
        if (!name) return;
        const data = await api('/api/keys', 'POST', {
          name,
          allowedConnectionIds: splitCsv($('keyConnIds').value),
        });

        if (data.ok && data.body?.secret) {
          $('oneTimeKeyPanel').style.display = 'block';
          $('oneTimeKeyValue').value = String(data.body.secret);
          const safe = { ...data, body: { ...data.body } };
          delete safe.body.secret;
          print(out.keys, safe);
          setBanner('ok', 'API key created. Copy and store the one-time key now.');
          return;
        }

        print(out.keys, data);
      };

      $('copyOneTimeKey').onclick = async () => {
        const value = String($('oneTimeKeyValue').value || '');
        if (!value) {
          setBanner('err', 'No one-time key to copy.');
          return;
        }
        try {
          await navigator.clipboard.writeText(value);
          setBanner('ok', 'API key copied to clipboard.');
        } catch {
          setBanner('err', 'Clipboard copy failed. Copy manually.');
        }
      };

      $('clearOneTimeKey').onclick = () => {
        $('oneTimeKeyValue').value = '';
        $('oneTimeKeyPanel').style.display = 'none';
        setBanner('ok', 'One-time key cleared from screen.');
      };

      $('listKeys').onclick = async () => print(out.keys, await api('/api/keys'));
      $('revokeKey').onclick = async () => {
        const id = requireText('revokeKeyId', 'Revoke key ID');
        if (!id) return;
        print(out.keys, await api('/api/keys/' + encodeURIComponent(id), 'DELETE'));
      };

      $('createConn').onclick = async () => {
        const name = requireText('connName', 'Connection name');
        if (!name) return;
        const baseHost = requireText('connBaseHost', 'Base host');
        if (!baseHost) return;
        const data = await api('/api/connections', 'POST', {
          name,
          baseHost,
          allowedHosts: splitCsv($('connHosts').value),
          allowedPathPrefixes: splitCsv($('connPaths').value),
          authMethod: $('connAuthMethod').value,
        });
        print(out.conn, data);
      };

      $('listConn').onclick = async () => print(out.conn, await api('/api/connections'));
      $('patchConn').onclick = async () => {
        const id = requireText('patchConnId', 'Patch connection ID');
        if (!id) return;
        const data = await api('/api/connections/' + encodeURIComponent(id), 'PATCH', {
          status: $('patchConnStatus').value,
        });
        print(out.conn, data);
      };

      $('addSecret').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const secretValue = requireText('secretValue', 'Secret value');
        if (!secretValue) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/secrets', 'POST', {
          secretType: $('secretType').value,
          secretValue,
        });
        $('secretValue').value = '';
        print(out.secret, data);
      };

      $('listSecrets').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        print(out.secret, await api('/api/connections/' + encodeURIComponent(connId) + '/secrets'));
      };

      $('deleteSecret').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const secretId = requireText('deleteSecretId', 'Delete secret ID');
        if (!secretId) return;
        print(out.secret, await api('/api/connections/' + encodeURIComponent(connId) + '/secrets/' + encodeURIComponent(secretId), 'DELETE'));
      };

      $('addAuthState').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const statePayload = requireText('authStatePayload', 'Auth state payload');
        if (!statePayload) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/auth-states', 'POST', {
          stateType: $('authStateType').value,
          statePayload,
          expiresAt: $('authStateExpiresAt').value.trim() || undefined,
        });
        $('authStatePayload').value = '';
        print(out.secret, data);
      };

      $('importAuthState').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const imported = await readSelectedAuthStateFile();
        if (!imported) return;

        if (!imported.detectedType) {
          setBanner('err', 'Could not determine auth state type from this file. Provide a Playwright storageState export or cookie bundle JSON.');
          return;
        }

        $('authStateType').value = imported.detectedType;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/auth-states', 'POST', {
          stateType: imported.detectedType,
          statePayload: imported.text,
          expiresAt: $('authStateExpiresAt').value.trim() || undefined,
        });
        if (data.ok) {
          $('authStateFile').value = '';
          $('authStatePayload').value = '';
          setBanner('ok', 'Imported auth state from ' + imported.filename + '.');
        }
        print(out.secret, {
          importedFrom: imported.filename,
          detectedType: imported.detectedType,
          result: data,
        });
      };

      $('listAuthStates').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        print(out.secret, await api('/api/connections/' + encodeURIComponent(connId) + '/auth-states'));
      };

      $('deleteAuthState').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const authStateId = requireText('deleteAuthStateId', 'Delete auth state ID');
        if (!authStateId) return;
        print(out.secret, await api('/api/connections/' + encodeURIComponent(connId) + '/auth-states/' + encodeURIComponent(authStateId), 'DELETE'));
      };

      $('startCapture').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const startUrl = String($('captureStartUrl').value || '').trim();
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions', 'POST', {
          startUrl: startUrl || undefined,
        });
        renderCapture(data);
        await refreshCaptureHistory();
      };

      $('listCaptureSessions').onclick = async () => {
        await refreshCaptureHistory();
      };

      $('refreshCapture').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const sessionId = requireText('captureSessionId', 'Capture session ID');
        if (!sessionId) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId));
        renderCapture(data);
      };

      async function captureAction(payload) {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const sessionId = requireText('captureSessionId', 'Capture session ID');
        if (!sessionId) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId) + '/actions', 'POST', payload);
        renderCapture(data);
      }

      $('captureNavigate').onclick = async () => {
        const navigateUrl = requireText('captureNavigateUrl', 'Navigate URL');
        if (!navigateUrl) return;
        await captureAction({ actionType: 'navigate', url: navigateUrl });
      };

      $('captureType').onclick = async () => {
        const text = requireText('captureTypeText', 'Type text');
        if (!text) return;
        await captureAction({ actionType: 'type', text });
      };

      $('captureKey').onclick = async () => {
        const combo = requireText('captureKeypress', 'Keypress combo');
        if (!combo) return;
        await captureAction({ actionType: 'keypress', keys: combo.split('+').map((value) => value.trim()).filter(Boolean) });
      };

      $('captureClickButton').onclick = async () => {
        const raw = requireText('captureClick', 'Click position');
        if (!raw) return;
        const [xRaw, yRaw] = raw.split(',').map((value) => value.trim());
        const x = Number(xRaw);
        const y = Number(yRaw);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          setBanner('err', 'Click position must be in the form x,y.');
          return;
        }
        await captureAction({ actionType: 'click', x, y });
      };

      $('captureScrollButton').onclick = async () => {
        const deltaY = Number($('captureScrollY').value || 600);
        await captureAction({ actionType: 'scroll', deltaY: Number.isFinite(deltaY) ? deltaY : 600 });
      };

      $('captureWaitButton').onclick = async () => {
        const ms = Number($('captureWaitMs').value || 1000);
        await captureAction({ actionType: 'wait', ms: Number.isFinite(ms) ? ms : 1000 });
      };

      $('finalizeCapture').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const sessionId = requireText('captureSessionId', 'Capture session ID');
        if (!sessionId) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId) + '/finalize', 'POST', {
          expiresAt: $('authStateExpiresAt').value.trim() || undefined,
        });
        renderCapture(data);
        print(out.secret, data);
        if (data.ok) {
          renderCaptureSummary(data);
          await refreshConnectionArtifacts();
          await refreshCaptureHistory();
          setBanner('ok', 'Capture finalized and connection artifacts refreshed.');
        }
      };

      $('cancelCapture').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const sessionId = requireText('captureSessionId', 'Capture session ID');
        if (!sessionId) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId), 'DELETE');
        print(out.capture, data);
        if (data.ok) {
          await refreshCaptureHistory();
          setBanner('ok', 'Capture cancelled and history refreshed.');
        }
      };

      $('secretPlan').onclick = async () => {
        const connectionId = requireText('secretConnId', 'Connection ID');
        if (!connectionId) return;
        const targetUrl = requireText('planUrl', 'Plan target URL');
        if (!targetUrl) return;
        const data = await api('/api/cua/secret-fill-plan', 'POST', {
          connectionId,
          targetUrl,
          requiredSecretTypes: splitCsv($('planTypes').value),
        });
        print(out.secret, data);
      };
    </script>
  </body>
</html>
`;
