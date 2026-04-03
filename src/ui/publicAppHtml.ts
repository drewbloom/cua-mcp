import { CUA_MCP_ASCII } from './brandAscii.js';

export const PUBLIC_APP_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CUA MCP Onboarding</title>
    <meta name="theme-color" content="#ff8c42" />
    <meta name="apple-mobile-web-app-title" content="CUA MCP" />
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/favicon-16x16.png" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/brand/apple-touch-icon.png" />
    <link rel="manifest" href="/assets/brand/site.webmanifest" />
    <style>
      :root {
        --bg: #050b11;
        --bg-2: #09121b;
        --ink: #eef5ff;
        --muted: #92a5ba;
        --line: rgba(161, 191, 220, 0.14);
        --accent: #ff8c42;
        --warning: #ffd166;
        --success: #78dba9;
        --danger: #d9506f;
        --shadow: 0 28px 80px rgba(0, 0, 0, 0.36);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at 12% 0%, rgba(255, 140, 66, 0.18), transparent 28%),
          radial-gradient(circle at 88% 14%, rgba(115, 210, 222, 0.16), transparent 26%),
          linear-gradient(180deg, var(--bg) 0%, #08111a 42%, var(--bg-2) 100%);
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(rgba(255,255,255,0.016), rgba(255,255,255,0.016)),
          linear-gradient(90deg, rgba(146, 165, 186, 0.05) 1px, transparent 1px),
          linear-gradient(rgba(146, 165, 186, 0.04) 1px, transparent 1px);
        background-size: auto, 40px 40px, 40px 40px;
        mask-image: radial-gradient(circle at center, black 48%, transparent 92%);
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
        gap: 18px;
      }

      .hero,
      .panel,
      .banner {
        position: relative;
        border: 1px solid var(--line);
        border-radius: 30px;
        background: linear-gradient(180deg, rgba(11, 20, 31, 0.9), rgba(8, 16, 25, 0.96));
        box-shadow: var(--shadow);
        overflow: hidden;
      }

      .hero {
        padding: 30px clamp(20px, 4vw, 40px) 34px;
      }

      .hero::before,
      .panel::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(circle at 10% 0%, rgba(255, 140, 66, 0.2), transparent 26%),
          radial-gradient(circle at 90% 10%, rgba(115, 210, 222, 0.16), transparent 24%);
      }

      .hero-inner,
      .panel-inner {
        position: relative;
        display: grid;
        gap: 20px;
        justify-items: center;
      }

      .brand {
        display: grid;
        gap: 14px;
        justify-items: center;
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
      }

      .brand-badge {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        color: #08111a;
        font-weight: 900;
        background: linear-gradient(135deg, var(--accent), var(--warning));
        box-shadow: 0 18px 30px rgba(255, 140, 66, 0.22);
      }

      .eyebrow,
      .nav-label,
      .field-label,
      .output-head {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--muted);
      }

      h1,
      h2 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        letter-spacing: -0.045em;
      }

      h1 {
        max-width: 16ch;
        font-size: clamp(3.2rem, 8vw, 5.7rem);
        line-height: 0.92;
        text-align: center;
      }

      h2 {
        font-size: clamp(1.8rem, 4vw, 2.35rem);
        text-align: center;
      }

      .lede,
      .step-copy,
      .status-copy,
      .output {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .lede,
      .step-copy,
      .status-copy {
        max-width: 76ch;
        text-align: center;
      }

      .hero-art {
        width: min(100%, 1100px);
        margin: 4px auto 0;
        padding: 20px 24px;
        border-radius: 22px;
        border: 1px solid rgba(255, 209, 102, 0.16);
        background: rgba(7, 17, 26, 0.72);
        color: #ffdca3;
        overflow: auto;
        white-space: pre;
        font-family: "Cascadia Mono", "Consolas", "Courier New", monospace;
        font-size: clamp(11px, 1vw, 13px);
        line-height: 1.18;
      }

      .hero-actions,
      .step-list,
      .button-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .hero-button,
      .step-link,
      button {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 46px;
        padding: 0 16px;
        border-radius: 999px;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.02em;
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
      }

      .hero-button,
      button.primary {
        color: #08111a;
        border: 1px solid transparent;
        background: linear-gradient(135deg, var(--accent), var(--warning));
        box-shadow: 0 14px 24px rgba(255, 140, 66, 0.2);
      }

      .hero-button.secondary,
      .step-link,
      button.secondary {
        color: var(--ink);
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--line);
        box-shadow: none;
      }

      button:hover,
      .hero-button:hover,
      .step-link:hover,
      .step-link.active {
        transform: translateY(-1px);
      }

      .step-link.active {
        border-color: rgba(255, 209, 102, 0.22);
        background: rgba(255, 209, 102, 0.1);
      }

      .nav-shell {
        position: sticky;
        top: 12px;
        z-index: 10;
        padding: 14px;
        border-radius: 24px;
        border: 1px solid var(--line);
        background: rgba(7, 14, 22, 0.9);
        backdrop-filter: blur(16px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
      }

      .panel {
        padding: 18px;
      }

      .panel-inner,
      .section-shell,
      .field-grid,
      .field,
      .status-card,
      .output-shell {
        display: grid;
        gap: 12px;
      }

      .section-shell {
        padding: 24px;
        border-radius: 28px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.04);
      }

      .section-shell[hidden] {
        display: none;
      }

      input {
        width: 100%;
        min-height: 48px;
        padding: 13px 15px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.04);
        color: var(--ink);
        font: inherit;
      }

      input:focus {
        outline: 2px solid rgba(115, 210, 222, 0.28);
        outline-offset: 1px;
        border-color: rgba(115, 210, 222, 0.36);
      }

      .status-card,
      .output-shell {
        padding: 16px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.04);
      }

      .output {
        white-space: pre-wrap;
        word-break: break-word;
        font-family: "Cascadia Mono", "Consolas", monospace;
      }

      .banner {
        position: fixed;
        right: 16px;
        bottom: 16px;
        max-width: min(420px, calc(100vw - 32px));
        padding: 14px 16px;
        border-radius: 18px;
        background: rgba(9, 17, 27, 0.95);
        border: 1px solid var(--line);
        box-shadow: 0 24px 50px rgba(0, 0, 0, 0.24);
        font-size: 13px;
        line-height: 1.45;
        backdrop-filter: blur(14px);
      }

      .banner.ok { color: var(--success); }
      .banner.err { color: #ffb6c7; border-color: rgba(217, 80, 111, 0.24); }

      @media (max-width: 840px) {
        .page {
          width: min(100%, calc(100% - 20px));
        }

        h1 {
          max-width: 12ch;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <div class="hero-inner">
          <div class="brand">
            <div class="brand-badge">CUA</div>
            <div>Computer Use Agent, Missing Common Precautions</div>
          </div>
          <p class="eyebrow">Public onboarding. Private dashboard. Same vibes.</p>
          <h1>Join the operation before the control plane hands you the sharp objects.</h1>
          <p class="lede">/app is now the clean part of the funnel: enter a name and email, get a login code, verify it, and then move into the authenticated dashboard where the keys, secrets, and other regrettably powerful controls actually live.</p>
          <pre class="hero-art">${CUA_MCP_ASCII}</pre>
          <div class="hero-actions">
            <a class="hero-button" href="#signup-step">Start onboarding</a>
            <a class="hero-button secondary" href="/">Back to the manifesto</a>
          </div>
          <p class="status-copy">If you already have a live session, this page should redirect you to the dashboard instead of making you repeat the ceremony.</p>
        </div>
      </section>

      <div class="nav-shell">
        <div class="nav-label">Onboarding flow</div>
        <nav class="step-list" aria-label="Onboarding steps">
          <a class="step-link" href="#signup-step" data-public-step-link="signup-step">01 Join</a>
          <a class="step-link" href="#verify-step" data-public-step-link="verify-step">02 Verify</a>
        </nav>
      </div>

      <section class="panel">
        <div class="panel-inner">
          <section class="section-shell" id="signup-step">
            <p class="eyebrow">Step 01</p>
            <h2>Tell us who is about to inherit this security posture.</h2>
            <p class="step-copy">Enter a name and email so we can send the one-time code to an actual person before the software starts doing software things.</p>
            <div class="field-grid">
              <label class="field">
                <span class="field-label">Display name</span>
                <input id="displayName" placeholder="Name the future audit protagonist" />
              </label>
              <label class="field">
                <span class="field-label">Email address</span>
                <input id="email" placeholder="you@example.com" />
              </label>
            </div>
            <div class="button-row">
              <button class="primary" id="requestCode">Send login code</button>
              <a class="step-link" href="#verify-step" data-public-step-link="verify-step">Already have a code?</a>
            </div>
          </section>

          <section class="section-shell" id="verify-step" hidden>
            <p class="eyebrow">Step 02</p>
            <h2>Verify the code, then graduate into the actual dashboard.</h2>
            <p class="step-copy">Use the code from your inbox. A successful verification sends you to the protected dashboard where the rest of the app lives.</p>
            <div class="field-grid">
              <label class="field">
                <span class="field-label">Email address</span>
                <input id="verifyEmail" placeholder="you@example.com" />
              </label>
              <label class="field">
                <span class="field-label">Verification code</span>
                <input id="otpCode" placeholder="Enter the one-time code before the vibes expire" />
              </label>
            </div>
            <div class="button-row">
              <button class="primary" id="verifyCode">Verify code</button>
              <button class="secondary" id="resendCode">Send another code</button>
            </div>
          </section>

          <div class="status-card">
            <p class="eyebrow">After verification</p>
            <p class="status-copy">You will be redirected to /dashboard, which requires a valid session and keeps the rest of the tabs, keys, secrets, and runtime controls out of the public onboarding path.</p>
          </div>

          <div class="output-shell">
            <div class="output-head">Onboarding log</div>
            <pre id="sessionOut" class="output">Onboarding output</pre>
          </div>
        </div>
      </section>
    </main>

    <div id="banner" class="banner">Ready.</div>

    <script>
      const $ = (id) => document.getElementById(id);
      const banner = $('banner');
      const sessionOut = $('sessionOut');
      const sectionMap = {
        'signup-step': $('signup-step'),
        'verify-step': $('verify-step'),
      };
      const stepLinks = Array.from(document.querySelectorAll('[data-public-step-link]'));

      function setBanner(kind, message) {
        banner.className = 'banner ' + (kind || '');
        banner.textContent = message;
      }

      function print(value) {
        sessionOut.textContent = JSON.stringify(value, null, 2);
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
          throw new Error(String(parsed?.message || parsed?.error || 'Request failed'));
        }
        return parsed;
      }

      function activateStep(activeId, syncHash = true) {
        Object.entries(sectionMap).forEach(([id, section]) => {
          if (!section) return;
          section.hidden = id !== activeId;
        });

        stepLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('data-public-step-link') === activeId);
        });

        if (syncHash) {
          window.location.hash = activeId;
        }
      }

      function syncFromLocation() {
        const url = new URL(window.location.href);
        const step = url.hash.replace(/^#/, '') || url.searchParams.get('step') || 'signup-step';
        const email = url.searchParams.get('email') || '';
        const displayName = url.searchParams.get('displayName') || '';
        $('email').value = email;
        $('verifyEmail').value = email;
        $('displayName').value = displayName;
        activateStep(step === 'verify' ? 'verify-step' : step, false);
      }

      stepLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          activateStep(link.getAttribute('data-public-step-link') || 'signup-step');
        });
      });

      $('requestCode').onclick = async () => {
        const email = requireEmail('email');
        if (!email) return;
        const displayName = String($('displayName').value || '').trim();
        try {
          const data = await api('/api/auth/request-code', 'POST', { email, displayName });
          print(data);
          setBanner('ok', 'Login code sent. Moving you to verification.');
          const next = new URL('/app', window.location.origin);
          next.searchParams.set('step', 'verify-step');
          next.searchParams.set('email', email);
          if (displayName) next.searchParams.set('displayName', displayName);
          window.location.assign(next.toString());
        } catch (error) {
          setBanner('err', error.message || 'Could not send login code.');
        }
      };

      $('resendCode').onclick = async () => {
        const email = requireEmail('verifyEmail');
        if (!email) return;
        const displayName = String($('displayName').value || '').trim();
        try {
          const data = await api('/api/auth/request-code', 'POST', { email, displayName });
          print(data);
          setBanner('ok', 'Fresh code sent. Check your inbox again.');
        } catch (error) {
          setBanner('err', error.message || 'Could not resend code.');
        }
      };

      $('verifyCode').onclick = async () => {
        const email = requireEmail('verifyEmail');
        if (!email) return;
        const code = requireText('otpCode', 'Code');
        if (!code) return;
        try {
          const data = await api('/api/auth/verify-code', 'POST', { email, code });
          print(data);
          setBanner('ok', 'Verified. Redirecting to the dashboard.');
          window.location.assign('/dashboard');
        } catch (error) {
          setBanner('err', error.message || 'Verification failed.');
        }
      };

      window.addEventListener('hashchange', syncFromLocation);
      syncFromLocation();
    </script>
  </body>
</html>
`;