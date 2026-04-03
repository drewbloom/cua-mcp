export const LANDING_PAGE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CUA MCP</title>
    <style>
      :root {
        --bg: #f5f1e8;
        --ink: #0f2233;
        --muted: #647487;
        --accent: #0d6d67;
        --accent-2: #114f74;
        --line: rgba(15, 34, 51, 0.12);
        --panel: rgba(255,255,255,0.74);
        --shadow: 0 30px 80px rgba(15,34,51,0.14);
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at 12% 0%, rgba(230, 200, 145, 0.4), transparent 26%),
          radial-gradient(circle at 88% 12%, rgba(17, 79, 116, 0.16), transparent 22%),
          linear-gradient(180deg, #eee4d4 0%, #f6f3ed 42%, #edf1f4 100%);
      }

      .hero {
        min-height: 100svh;
        display: grid;
        grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.05fr);
        gap: 24px;
        width: min(1380px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0 28px;
        align-items: stretch;
      }

      .left {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: calc(100svh - 52px);
        padding: 22px 0;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 12px;
        color: rgba(15,34,51,0.72);
      }

      .badge {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        color: white;
        font-weight: 800;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        box-shadow: 0 16px 28px rgba(13,109,103,0.24);
      }

      h1 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        font-size: clamp(3rem, 6vw, 5.6rem);
        line-height: 0.94;
        letter-spacing: -0.05em;
        max-width: 8.5ch;
      }

      .copy {
        max-width: 30rem;
        display: grid;
        gap: 18px;
      }

      .copy p {
        margin: 0;
        font-size: 1.05rem;
        line-height: 1.6;
        color: rgba(15,34,51,0.78);
      }

      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 18px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
        border: 1px solid transparent;
        transition: transform 180ms ease, opacity 180ms ease;
      }

      .button.primary {
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        color: white;
      }

      .button.secondary {
        background: rgba(255,255,255,0.58);
        color: var(--ink);
        border-color: var(--line);
      }

      .button:hover { transform: translateY(-1px); }

      .panel {
        position: relative;
        min-height: calc(100svh - 52px);
        border-radius: 34px;
        background:
          linear-gradient(155deg, rgba(255,255,255,0.86), rgba(255,252,247,0.65)),
          linear-gradient(140deg, rgba(13,109,103,0.08), rgba(17,79,116,0.08));
        border: 1px solid rgba(255,255,255,0.62);
        box-shadow: var(--shadow);
        overflow: hidden;
      }

      .panel-inner {
        position: relative;
        display: grid;
        grid-template-rows: auto auto 1fr;
        gap: 18px;
        padding: 24px;
        min-height: 100%;
      }

      .panel h2 {
        margin: 0 0 8px;
        font-size: 1.15rem;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .cell {
        padding: 18px;
        border-radius: 22px;
        background: rgba(255,255,255,0.54);
        border: 1px solid rgba(15,34,51,0.08);
      }

      .cell strong {
        display: block;
        margin-bottom: 8px;
        font-size: 1rem;
      }

      .cell p, .micro {
        margin: 0;
        font-size: 0.94rem;
        line-height: 1.55;
        color: rgba(15,34,51,0.72);
      }

      .list {
        display: grid;
        gap: 12px;
        align-self: end;
      }

      .list-item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 14px;
        padding: 16px 18px;
        border-top: 1px solid rgba(15,34,51,0.08);
      }

      .list-item:first-child { border-top: 0; }

      .num {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: rgba(13,109,103,0.1);
        color: var(--accent);
        font-size: 12px;
        font-weight: 800;
      }

      .list-item strong {
        display: block;
        margin-bottom: 4px;
      }

      @media (max-width: 980px) {
        .hero { grid-template-columns: 1fr; }
        .left, .panel { min-height: auto; }
        .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="hero">
      <section class="left">
        <div class="brand"><div class="badge">CUA</div><span>Computer Use Control Plane</span></div>
        <div class="copy">
          <p style="text-transform:uppercase; letter-spacing:.18em; font-size:12px; color:var(--muted); margin:0;">MCP for secure browser automation</p>
          <h1>Run computer-use workflows with user-scoped access.</h1>
          <p>Onboard with email auth, issue your own MCP API keys, connect approved web utilities, and let CUA operate only within the boundaries you define.</p>
          <div class="actions">
            <a class="button primary" href="/app">Get started</a>
            <a class="button secondary" href="/health">Health check</a>
          </div>
        </div>
        <p class="micro">Designed for developer operators and security-conscious end users. Secrets stay encrypted, connections stay scoped, and machine keys stay revocable.</p>
      </section>
      <section class="panel">
        <div class="panel-inner">
          <div>
            <h2>What you can do here</h2>
            <p class="micro">The public app lets new users onboard and existing users manage the exact CUA access they want to grant.</p>
          </div>
          <div class="grid">
            <article class="cell"><strong>Email-auth sign in</strong><p>Request a one-time code, verify your session, and manage your account without shared credentials.</p></article>
            <article class="cell"><strong>Per-user model keys</strong><p>Store your own OpenAI key, switch active keys when needed, and keep model usage isolated to your account.</p></article>
            <article class="cell"><strong>Scoped MCP API keys</strong><p>Issue machine keys once, restrict them to approved connections, and revoke them the moment they are no longer needed.</p></article>
            <article class="cell"><strong>Connection-aware secrets</strong><p>Map allowed hosts and path prefixes before any secret reference can be resolved for a run.</p></article>
          </div>
          <div class="list">
            <div class="list-item"><div class="num">1</div><div><strong>Create your session</strong><span class="micro">Sign in, add your model key, and verify the app can operate on your behalf.</span></div></div>
            <div class="list-item"><div class="num">2</div><div><strong>Map trusted utilities</strong><span class="micro">Add the domains, subdomains, and path prefixes where automation is allowed to authenticate and operate.</span></div></div>
            <div class="list-item"><div class="num">3</div><div><strong>Connect CUA to your workflow</strong><span class="micro">Use your own MCP key in clients and let CUA run with your own model configuration and approved access only.</span></div></div>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>
`;