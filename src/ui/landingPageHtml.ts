import { CUA_MCP_ASCII } from './brandAscii.js';

export const LANDING_PAGE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CUA MCP</title>
    <meta name="theme-color" content="#ff8c42" />
    <meta name="apple-mobile-web-app-title" content="CUA MCP" />
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/favicon-16x16.png" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/brand/apple-touch-icon.png" />
    <link rel="manifest" href="/assets/brand/site.webmanifest" />
    <style>
      :root {
        --bg: #07111a;
        --bg-2: #0b1724;
        --panel: rgba(11, 23, 36, 0.84);
        --panel-strong: rgba(14, 28, 43, 0.95);
        --ink: #eff6ff;
        --muted: #8da0b6;
        --accent: #ff8c42;
        --accent-2: #ffd166;
        --cyan: #73d2de;
        --line: rgba(173, 205, 236, 0.14);
        --shadow: 0 28px 80px rgba(0, 0, 0, 0.36);
      }

      * { box-sizing: border-box; }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        color: var(--ink);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(255, 140, 66, 0.18), transparent 28%),
          radial-gradient(circle at 85% 12%, rgba(115, 210, 222, 0.16), transparent 24%),
          linear-gradient(180deg, #050b11 0%, var(--bg) 38%, var(--bg-2) 100%);
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(rgba(255,255,255,0.015), rgba(255,255,255,0.015)),
          linear-gradient(90deg, rgba(141, 160, 182, 0.05) 1px, transparent 1px),
          linear-gradient(rgba(141, 160, 182, 0.04) 1px, transparent 1px);
        background-size: auto, 42px 42px, 42px 42px;
        mask-image: radial-gradient(circle at center, black 46%, transparent 92%);
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .page {
        width: min(1280px, calc(100% - 28px));
        margin: 0 auto;
        padding: 20px 0 72px;
        display: grid;
        gap: 22px;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        padding: 10px 2px;
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
      }

      .badge {
        width: 46px;
        height: 46px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        color: #07111a;
        font-weight: 900;
        box-shadow: 0 18px 30px rgba(255, 140, 66, 0.22);
      }

      .hero,
      .section,
      .cta {
        position: relative;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 30px;
        background: linear-gradient(180deg, rgba(14, 28, 43, 0.88), rgba(8, 17, 27, 0.92));
        box-shadow: var(--shadow);
      }

      .hero {
        padding: 38px clamp(20px, 4vw, 42px);
      }

      .hero::before,
      .section::before,
      .cta::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(circle at 14% 0%, rgba(255, 140, 66, 0.2), transparent 26%),
          radial-gradient(circle at 88% 8%, rgba(115, 210, 222, 0.16), transparent 24%);
      }

      .hero-inner,
      .section-inner,
      .cta-inner {
        position: relative;
        display: grid;
        gap: 24px;
      }

      .hero-inner {
        justify-items: center;
      }

      .eyebrow {
        margin: 0;
        color: var(--cyan);
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 12px;
        font-weight: 700;
      }

      h1,
      h2 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        letter-spacing: -0.05em;
      }

      h1 {
        max-width: 16ch;
        font-size: clamp(3.3rem, 8vw, 6rem);
        line-height: 0.92;
        text-align: center;
      }

      h2 {
        font-size: clamp(1.8rem, 3vw, 2.5rem);
        line-height: 1;
      }

      .lede,
      .micro,
      .card p,
      .quote,
      .list-item span {
        margin: 0;
        color: var(--muted);
        line-height: 1.65;
      }

      .lede {
        max-width: 74ch;
        font-size: 1.06rem;
        text-align: center;
      }

      .ascii {
        width: min(100%, 1040px);
        margin: 6px auto 0;
        padding: 20px 24px;
        border-radius: 22px;
        border: 1px solid rgba(255, 209, 102, 0.16);
        background: rgba(7, 17, 26, 0.72);
        color: #ffdca3;
        overflow: auto;
        white-space: pre;
        font-family: "Cascadia Mono", "Consolas", "Courier New", monospace;
        font-size: clamp(11px, 1.05vw, 13px);
        line-height: 1.18;
      }

      .marquee {
        display: grid;
        gap: 12px;
        justify-items: center;
      }

      .ticker {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--line);
        color: var(--ink);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .pill strong {
        color: var(--accent-2);
        font-weight: 800;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.03em;
        transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
      }

      .button:hover {
        transform: translateY(-1px);
      }

      .button.primary {
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        color: #07111a;
      }

      .button.secondary {
        background: rgba(255,255,255,0.05);
        border-color: var(--line);
      }

      .section,
      .cta {
        padding: 28px clamp(20px, 4vw, 34px);
      }

      .cards,
      .list {
        display: grid;
        gap: 14px;
      }

      .card,
      .list-item,
      .quote {
        border-radius: 22px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.03);
        padding: 18px;
      }

      .card strong,
      .list-item strong {
        display: block;
        margin-bottom: 8px;
        font-size: 1rem;
      }

      .quote {
        color: #d9e4f1;
        font-size: 1.02rem;
      }

      .micro,
      .quote {
        max-width: 74ch;
        justify-self: center;
        text-align: center;
      }

      .cta {
        margin-top: 4px;
      }

      .cta-inner {
        gap: 14px;
      }

      @media (max-width: 720px) {
        .page {
          width: min(100%, calc(100% - 20px));
          padding-top: 14px;
        }

        .topbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .ascii {
          font-size: 11px;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="topbar">
        <div class="brand"><div class="badge">CUA</div><span>Computer Use Agent, Missing Common Precautions</span></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <span>Working product. Dubious serenity.</span>
          <a class="button primary" href="/sign-in" style="min-height:38px;padding:0 14px;">Sign in</a>
        </div>
      </div>

      <section class="hero">
        <div class="hero-inner">
          <p class="eyebrow">Secure enough to demo. Fast enough to regret.</p>
          <h1>All vibes. Some guardrails. Surprisingly functional.</h1>
          <p class="lede">CUA MCP is the control plane for computer-use automation when the default harness is too polite to touch secure websites. It is user-scoped, key-driven, connection-aware, and held together by the sort of determination normally reserved for bad launches and surprisingly effective internal tools.</p>
          <div class="marquee">
            <pre class="ascii">${CUA_MCP_ASCII}</pre>
            <div class="ticker">
              <div class="pill"><strong>OTP</strong> one-time code theatrics</div>
              <div class="pill"><strong>Keys</strong> shown once, regretted forever</div>
              <div class="pill"><strong>Policies</strong> clear enough to sound intentional</div>
              <div class="pill"><strong>Secrets</strong> encrypted before anyone gets ideas</div>
            </div>
          </div>
          <div class="actions">
            <a class="button primary" href="/app">Create an account</a>
            <a class="button secondary" href="/sign-in">Sign in</a>
            <a class="button secondary" href="/health">Ask if it is alive</a>
          </div>
          <p class="micro">Conversion to multi-user, UI, and the security spiral were finished by GPT-5.4 after repeated exposure to the phrase “make it more secure.” The current result is best described as enterprise-grade buffoonery with audit logs and a firm belief that another pass will finally fix everything.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-inner">
          <p class="eyebrow">Why this exists</p>
          <h2>Because headless CUAs are bad at the things users actually want.</h2>
          <p class="lede">Working on secure websites requires a little more than blind optimism. This UI gives each user their own login session, model key, machine keys, trusted connection boundaries, encrypted secret refs, and enough runtime controls to make the duct tape feel deliberate.</p>
          <div class="cards">
            <article class="card"><strong>Email-auth sign in</strong><p>Get the human into the system first, then let everything else inherit that context instead of sharing one cursed credential forever.</p></article>
            <article class="card"><strong>Per-user OpenAI keys</strong><p>Every user can store and rotate their own model key, which is both more correct and far easier to explain when the bill arrives.</p></article>
            <article class="card"><strong>Scoped MCP machine keys</strong><p>Issue one-time secrets, constrain them to specific connections, and revoke them before someone gets brave on a Friday afternoon.</p></article>
            <article class="card"><strong>Secret and auth-state handling</strong><p>Secrets stay encrypted, auth artifacts stay mapped to approved hosts, and fill plans do not get to improvise jazz on production logins.</p></article>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-inner">
          <p class="eyebrow">Operating Principles</p>
          <div class="list">
            <div class="list-item"><strong>We traded polish for momentum.</strong><span>The system works, the posture is better than it started, and the remaining confidence is still doing a lot of branding work.</span></div>
            <div class="list-item"><strong>We do have boundaries.</strong><span>Allowed hosts, path prefixes, encrypted refs, and runtime privacy settings are the part where the joke stops being completely true and starts being real policy.</span></div>
            <div class="list-item"><strong>We would still like you to believe in the mission.</strong><span>Preferably before anyone asks what exactly is inside the private GitHub Action or why the roadmap looks like a live-fire exercise.</span></div>
          </div>
          <div class="quote">“Necessity is not the mother of invention. Ethical abrogation of responsibility and delegating risk to tech tools is.”</div>
        </div>
      </section>

      <section class="cta">
        <div class="cta-inner">
          <p class="eyebrow">Next move</p>
          <h2>Open the app, click a tab, and try not to ask for fries and a drink.</h2>
          <div class="actions">
            <a class="button primary" href="/app">Register at /app</a>
            <a class="button secondary" href="/sign-in">Use /sign-in</a>
            <a class="button secondary" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&pp=ygUXbmV2ZXIgZ29ubmEgZ2l2ZSB5b3UgdXA%3D">Review SOC II posture</a>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>
`;