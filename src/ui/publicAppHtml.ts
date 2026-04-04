import { CUA_MCP_ASCII } from './brandAscii.js';

export const PUBLIC_APP_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CUA MCP Access</title>
    <meta name="theme-color" content="#ff8c42" />
    <meta name="apple-mobile-web-app-title" content="CUA MCP" />
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/favicon-16x16.png" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/brand/apple-touch-icon.png" />
    <link rel="manifest" href="/assets/brand/site.webmanifest" />
    <style>
      :root {
        --bg: #f4efe6;
        --bg-strong: #e8dcc7;
        --panel: rgba(255, 251, 245, 0.9);
        --panel-strong: #fffaf1;
        --ink: #20160e;
        --muted: #69584b;
        --line: rgba(61, 42, 28, 0.14);
        --accent: #df6f24;
        --accent-strong: #b85618;
        --success: #2d8c64;
        --danger: #c34a42;
        --shadow: 0 30px 90px rgba(77, 50, 28, 0.16);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
        background:
          radial-gradient(circle at top left, rgba(223, 111, 36, 0.16), transparent 26%),
          radial-gradient(circle at bottom right, rgba(113, 156, 130, 0.16), transparent 24%),
          linear-gradient(180deg, #f8f3ea 0%, var(--bg) 48%, var(--bg-strong) 100%);
      }

      body.signin-mode {
        background:
          radial-gradient(circle at top left, rgba(223, 111, 36, 0.1), transparent 22%),
          linear-gradient(180deg, #f8f3ea 0%, #efe4d3 100%);
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(rgba(255,255,255,0.22), rgba(255,255,255,0.04)),
          repeating-linear-gradient(90deg, rgba(61, 42, 28, 0.03) 0, rgba(61, 42, 28, 0.03) 1px, transparent 1px, transparent 40px),
          repeating-linear-gradient(rgba(61, 42, 28, 0.025) 0, rgba(61, 42, 28, 0.025) 1px, transparent 1px, transparent 40px);
        mask-image: radial-gradient(circle at center, black 58%, transparent 96%);
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      button,
      input {
        font: inherit;
      }

      .page {
        position: relative;
        z-index: 1;
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 20px 0 48px;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 26px;
      }

      .brand-lockup {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-size: 0.84rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .brand-badge {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 14px;
        background: linear-gradient(135deg, var(--accent) 0%, #f2a559 100%);
        color: #fffaf4;
        font-weight: 700;
        letter-spacing: 0.08em;
      }

      .topbar-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .topbar-link,
      .topbar-action,
      .button,
      .button-secondary,
      .button-ghost {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 46px;
        padding: 0 18px;
        border-radius: 999px;
        border: 1px solid transparent;
        cursor: pointer;
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background-color 160ms ease;
      }

      .topbar-link,
      .button-secondary,
      .button-ghost {
        background: rgba(255, 250, 241, 0.7);
        border-color: var(--line);
        color: var(--ink);
      }

      .topbar-action,
      .button {
        background: linear-gradient(135deg, var(--accent) 0%, #f29a53 100%);
        color: #fffaf1;
        box-shadow: 0 14px 30px rgba(223, 111, 36, 0.24);
      }

      .topbar-link:hover,
      .topbar-action:hover,
      .button:hover,
      .button-secondary:hover,
      .button-ghost:hover,
      .topbar-link:focus-visible,
      .topbar-action:focus-visible,
      .button:focus-visible,
      .button-secondary:focus-visible,
      .button-ghost:focus-visible {
        transform: translateY(-1px);
        outline: none;
      }

      .layout {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 22px;
      }

      .info-panel,
      .auth-panel,
      .banner,
      .status-card {
        border: 1px solid var(--line);
        border-radius: 30px;
        background: linear-gradient(180deg, rgba(255, 250, 241, 0.94), rgba(255, 246, 235, 0.86));
        box-shadow: var(--shadow);
      }

      .info-panel {
        padding: 30px;
        display: grid;
        align-content: space-between;
        gap: 28px;
        min-height: 660px;
      }

      .info-panel.signin-mode {
        display: none;
      }

      .eyebrow {
        margin: 0;
        color: var(--accent-strong);
        font-size: 0.78rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .info-panel h1,
      .auth-panel h2 {
        margin: 0;
        font-size: clamp(2.4rem, 4.8vw, 4.8rem);
        line-height: 0.94;
        letter-spacing: -0.05em;
        font-weight: 600;
      }

      .auth-panel h2 {
        font-size: clamp(2rem, 3.8vw, 3.1rem);
      }

      .lede,
      .muted-copy,
      .status-copy {
        margin: 0;
        font-size: 1rem;
        line-height: 1.7;
        color: var(--muted);
      }

      .art-card {
        padding: 22px;
        border-radius: 24px;
        border: 1px solid rgba(61, 42, 28, 0.12);
        background: rgba(255, 255, 255, 0.42);
      }

      .hero-art {
        margin: 0;
        overflow: auto;
        color: #5e4a39;
        font-size: 11px;
        line-height: 1.12;
        font-family: "Cascadia Mono", Consolas, monospace;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .info-cell {
        padding: 16px 18px;
        border-radius: 22px;
        border: 1px solid rgba(61, 42, 28, 0.1);
        background: rgba(255,255,255,0.45);
      }

      .info-cell span {
        display: block;
        margin-bottom: 8px;
        font-size: 0.78rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .info-cell strong {
        font-size: 1.04rem;
      }

      .auth-panel {
        padding: 28px;
        display: grid;
        gap: 18px;
        align-content: start;
      }

      .signin-shell {
        max-width: 540px;
        margin: 74px auto 0;
      }

      body.signin-mode .page {
        width: min(560px, calc(100% - 24px));
        padding-top: 40px;
      }

      body.signin-mode .topbar {
        margin-bottom: 18px;
      }

      body.signin-mode #layout {
        display: block;
      }

      body.signin-mode #displayNameField {
        display: none !important;
      }

      .flow-pills {
        display: inline-flex;
        gap: 8px;
        padding: 6px;
        border-radius: 999px;
        background: rgba(255,255,255,0.55);
        border: 1px solid rgba(61, 42, 28, 0.08);
      }

      .pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 38px;
        padding: 0 14px;
        border-radius: 999px;
        font-size: 0.84rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .pill.active {
        background: rgba(223, 111, 36, 0.12);
        color: var(--accent-strong);
      }

      .form-card {
        display: grid;
        gap: 18px;
        padding: 22px;
        border-radius: 26px;
        border: 1px solid rgba(61, 42, 28, 0.08);
        background: rgba(255,255,255,0.55);
      }

      .field-grid {
        display: grid;
        gap: 14px;
      }

      .field {
        display: grid;
        gap: 8px;
      }

      .field-label {
        font-size: 0.8rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--muted);
      }

      input {
        width: 100%;
        min-height: 54px;
        padding: 0 16px;
        border-radius: 18px;
        border: 1px solid rgba(61, 42, 28, 0.14);
        background: rgba(255,255,255,0.9);
        color: var(--ink);
      }

      input:focus-visible {
        outline: 2px solid rgba(223, 111, 36, 0.2);
        border-color: rgba(223, 111, 36, 0.5);
      }

      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .button-row .button,
      .button-row .button-secondary,
      .button-row .button-ghost {
        flex: 1 1 180px;
      }

      .inline-note {
        padding: 14px 16px;
        border-radius: 18px;
        background: rgba(255,255,255,0.5);
        border: 1px solid rgba(61, 42, 28, 0.08);
        color: var(--muted);
        line-height: 1.6;
      }

      .status-card {
        padding: 18px 20px;
      }

      .status-card strong {
        display: block;
        margin-bottom: 6px;
      }

      .banner {
        position: fixed;
        left: 50%;
        bottom: 18px;
        transform: translateX(-50%);
        min-width: min(520px, calc(100% - 24px));
        padding: 14px 18px;
        color: #fffaf1;
        background: rgba(32, 22, 14, 0.92);
        border-color: rgba(32, 22, 14, 0.18);
        z-index: 20;
      }

      .banner.ok { background: rgba(45, 140, 100, 0.92); }
      .banner.err { background: rgba(195, 74, 66, 0.94); }

      .toast-stack {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 21;
        display: grid;
        gap: 10px;
      }

      .toast {
        min-width: 240px;
        max-width: 360px;
        padding: 14px 16px;
        border-radius: 18px;
        color: #fffaf1;
        background: rgba(32, 22, 14, 0.92);
        box-shadow: 0 18px 36px rgba(32, 22, 14, 0.2);
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 160ms ease, transform 160ms ease;
      }

      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }

      .toast.ok { background: rgba(45, 140, 100, 0.94); }
      .toast.err { background: rgba(195, 74, 66, 0.96); }

      .dev-output {
        display: none !important;
      }

      @media (max-width: 920px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .info-panel {
          min-height: auto;
        }

        .signin-shell {
          margin-top: 24px;
        }
      }

      @media (max-width: 640px) {
        .page {
          width: min(100%, calc(100% - 18px));
        }

        .topbar {
          flex-direction: column;
          align-items: stretch;
        }

        .topbar-actions,
        .button-row {
          flex-direction: column;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="topbar">
        <div class="brand-lockup">
          <div class="brand-badge">CUA</div>
          <div>Computer Use Access</div>
        </div>
        <div class="topbar-actions">
          <a class="topbar-link" href="/">Public home</a>
          <a id="topbarAction" class="topbar-action" href="/sign-in">Sign in</a>
        </div>
      </div>

      <div id="layout" class="layout">
        <aside id="infoPanel" class="info-panel">
          <div>
            <p id="heroEyebrow" class="eyebrow">Registration</p>
            <h1 id="heroTitle">Create the account once. Run the control plane after.</h1>
            <p id="heroLede" class="lede">/app exists to register an account and verify the email. Everything with actual consequence stays behind the authenticated dashboard.</p>
          </div>

          <div class="art-card">
            <pre class="hero-art">${CUA_MCP_ASCII}</pre>
          </div>

          <div class="info-grid" aria-label="What happens next">
            <div class="info-cell">
              <span>Step 01</span>
              <strong>Register with name and email</strong>
            </div>
            <div class="info-cell">
              <span>Step 02</span>
              <strong>Verify the one-time code</strong>
            </div>
            <div class="info-cell">
              <span>Step 03</span>
              <strong>Land in the private dashboard</strong>
            </div>
            <div class="info-cell">
              <span>Scope</span>
              <strong>Keys, connections, and runs stay user-scoped</strong>
            </div>
          </div>
        </aside>

        <section id="authPanel" class="auth-panel">
          <div class="flow-pills" aria-label="Access flow">
            <div id="pillRequest" class="pill active">Request code</div>
            <div id="pillVerify" class="pill">Verify</div>
          </div>

          <div>
            <p id="panelEyebrow" class="eyebrow">Start</p>
            <h2 id="panelTitle">Create your account.</h2>
            <p id="panelCopy" class="muted-copy">Enter the details for the account owner. We will send a short-lived code and then move you into the dashboard.</p>
          </div>

          <section id="requestStep" class="form-card">
            <div class="field-grid">
              <label id="displayNameField" class="field" hidden>
                <span class="field-label">Display name</span>
                <input id="displayName" placeholder="Name the human behind this account" />
              </label>
              <label class="field">
                <span class="field-label">Email address</span>
                <input id="email" placeholder="you@example.com" />
              </label>
            </div>
            <div class="button-row">
              <button id="requestCode" class="button" type="button">Send code</button>
              <a id="secondaryActionLink" class="button-secondary" href="/sign-in">Already have an account?</a>
            </div>
            <div id="requestNote" class="inline-note">Registration creates the account, sends the code, and takes you to verification in one pass.</div>
          </section>

          <section id="verifyStep" class="form-card" hidden>
            <div class="field-grid">
              <label class="field">
                <span class="field-label">Email address</span>
                <input id="verifyEmail" placeholder="you@example.com" />
              </label>
              <label class="field">
                <span class="field-label">Verification code</span>
                <input id="otpCode" placeholder="6-digit code" inputmode="numeric" />
              </label>
            </div>
            <div class="button-row">
              <button id="verifyCode" class="button" type="button">Verify and continue</button>
              <button id="resendCode" class="button-ghost" type="button">Send another code</button>
            </div>
            <div class="inline-note">Verification returns you to /dashboard with a live session cookie.</div>
          </section>

          <div class="status-card">
            <p class="eyebrow">After verification</p>
            <strong id="statusTitle">Dashboard access</strong>
            <p id="statusCardCopy" class="status-copy">The dashboard is where LLM keys, MCP access keys, connections, patterns, and runtime privacy settings actually live.</p>
          </div>

        </section>
      </div>
    </main>

    <div id="banner" class="banner">Ready.</div>
    <div id="toastStack" class="toast-stack" aria-live="polite" aria-atomic="false"></div>

    <script>
      const $ = (id) => document.getElementById(id);
      const banner = $('banner');
      const toastStack = $('toastStack');
      const sessionOut = $('sessionOut');
      const mode = window.location.pathname.startsWith('/sign-in') ? 'signin' : 'register';
      const requestStep = $('requestStep');
      const verifyStep = $('verifyStep');
      const pillRequest = $('pillRequest');
      const pillVerify = $('pillVerify');
      const infoPanel = $('infoPanel');
      const authPanel = $('authPanel');
      const flowPills = document.querySelector('.flow-pills');
      const statusCard = document.querySelector('.status-card');

      function showToast(kind, message) {
        if (!toastStack || !message) return;
        const toast = document.createElement('div');
        toast.className = 'toast ' + (kind || '');
        toast.textContent = message;
        toastStack.appendChild(toast);
        requestAnimationFrame(function () {
          toast.classList.add('show');
        });
        window.setTimeout(function () {
          toast.classList.remove('show');
          window.setTimeout(function () {
            toast.remove();
          }, 180);
        }, kind === 'err' ? 4200 : 2600);
      }

      function setBanner(kind, message) {
        if (!banner) return;
        banner.className = 'banner ' + (kind || '');
        banner.textContent = message;
        showToast(kind, message);
      }

      function print(value) {
        if (sessionOut) {
          sessionOut.textContent = JSON.stringify(value, null, 2);
        }
      }

      function requireText(id, label) {
        const el = $(id);
        const value = String(el && el.value || '').trim();
        if (!value) {
          setBanner('err', label + ' is required.');
          if (el) el.focus();
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
          const el = $(id);
          if (el) el.focus();
          return null;
        }
        return value;
      }

      async function api(path, method, body) {
        const response = await fetch(path, {
          method: method || 'GET',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        const text = await response.text();
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { raw: text };
        }
        if (!response.ok) {
          const error = new Error(String(parsed && (parsed.message || parsed.error) || 'Request failed'));
          error.data = parsed;
          throw error;
        }
        return parsed;
      }

      function activateStep(step) {
        const verify = step === 'verify-step';
        if (requestStep) requestStep.hidden = verify;
        if (verifyStep) verifyStep.hidden = !verify;
        if (pillRequest) pillRequest.classList.toggle('active', !verify);
        if (pillVerify) pillVerify.classList.toggle('active', verify);
      }

      function syncFromLocation() {
        const url = new URL(window.location.href);
        const step = url.searchParams.get('step') || url.hash.replace(/^#/, '') || 'request-step';
        const email = url.searchParams.get('email') || '';
        const displayName = mode === 'register' ? (url.searchParams.get('displayName') || '') : '';
        if ($('email')) $('email').value = email;
        if ($('verifyEmail')) $('verifyEmail').value = email;
        if (mode === 'register' && $('displayName')) $('displayName').value = displayName;
        activateStep(step === 'verify-step' ? 'verify-step' : 'request-step');
      }

      function configurePageMode() {
        const isSignIn = mode === 'signin';
        document.body.classList.toggle('signin-mode', isSignIn);
        document.title = isSignIn ? 'CUA MCP Sign In' : 'CUA MCP Registration';
        $('topbarAction').textContent = isSignIn ? 'Create account' : 'Sign in';
        $('topbarAction').href = isSignIn ? '/app' : '/sign-in';
        $('secondaryActionLink').textContent = isSignIn ? 'Need a new account?' : 'Already have an account?';
        $('secondaryActionLink').href = isSignIn ? '/app' : '/sign-in';
        $('displayNameField').hidden = isSignIn;
        if (!isSignIn) {
          $('displayNameField').hidden = false;
        }

        if (isSignIn) {
          $('layout').classList.remove('layout');
          authPanel.classList.add('signin-shell');
          if (infoPanel) infoPanel.hidden = true;
          if (flowPills) flowPills.hidden = true;
          if (statusCard) statusCard.hidden = true;
          if (sessionOut) sessionOut.hidden = true;
          $('panelEyebrow').textContent = 'Existing account';
          $('panelTitle').textContent = 'Sign in with email.';
          $('panelCopy').textContent = 'Enter the email already attached to your account. We send a one-time code and verify it here.';
          $('requestCode').textContent = 'Send code';
          $('requestNote').textContent = 'If the email is not registered yet, this flow will redirect you to /app.';
          $('statusTitle').textContent = 'Back to work';
          $('statusCardCopy').textContent = 'Verification returns you to the dashboard. MFA or OTP prompts encountered later during browser runs can be relayed through steering and clarification rather than stored as durable secrets.';
        }
      }

      async function redirectIfAuthenticated() {
        try {
          const response = await fetch('/api/session/me', { credentials: 'include' });
          if (response.ok) {
            window.location.assign('/dashboard');
          }
        } catch {
        }
      }

      $('requestCode').onclick = async function () {
        const email = requireEmail('email');
        if (!email) return;
        const displayName = mode === 'register'
          ? String($('displayName') && $('displayName').value || '').trim()
          : '';
        if (mode === 'register' && !displayName) {
          setBanner('err', 'Display name is required.');
          $('displayName').focus();
          return;
        }

        try {
          const payload = { email: email, mode: mode };
          if (mode === 'register') payload.displayName = displayName;
          const data = await api('/api/auth/request-code', 'POST', payload);
          print(data);
          setBanner('ok', 'Code sent. Check your inbox.');
          const next = new URL(mode === 'signin' ? '/sign-in' : '/app', window.location.origin);
          next.searchParams.set('step', 'verify-step');
          next.searchParams.set('email', email);
          if (mode === 'register' && displayName) next.searchParams.set('displayName', displayName);
          window.location.assign(next.toString());
        } catch (error) {
          const message = String(error && error.message || 'Could not send code.');
          if (mode === 'signin' && message.toLowerCase().includes('registration required')) {
            const next = new URL('/app', window.location.origin);
            next.searchParams.set('email', email);
            setBanner('err', 'No account exists for that email yet. Redirecting to registration.');
            window.location.assign(next.toString());
            return;
          }
          setBanner('err', message);
        }
      };

      $('resendCode').onclick = async function () {
        const email = requireEmail('verifyEmail');
        if (!email) return;
        const displayName = mode === 'register'
          ? String($('displayName') && $('displayName').value || '').trim()
          : '';
        try {
          const payload = { email: email, mode: mode };
          if (mode === 'register' && displayName) payload.displayName = displayName;
          const data = await api('/api/auth/request-code', 'POST', payload);
          print(data);
          setBanner('ok', 'Fresh code sent.');
        } catch (error) {
          const message = String(error && error.message || 'Could not resend code.');
          if (mode === 'signin' && message.toLowerCase().includes('registration required')) {
            const next = new URL('/app', window.location.origin);
            next.searchParams.set('email', email);
            setBanner('err', 'That email is not registered yet. Redirecting to registration.');
            window.location.assign(next.toString());
            return;
          }
          setBanner('err', message);
        }
      };

      $('verifyCode').onclick = async function () {
        const email = requireEmail('verifyEmail');
        if (!email) return;
        const code = requireText('otpCode', 'Code');
        if (!code) return;
        try {
          const data = await api('/api/auth/verify-code', 'POST', { email: email, code: code });
          print(data);
          setBanner('ok', 'Verified. Redirecting to the dashboard.');
          window.location.assign('/dashboard');
        } catch (error) {
          setBanner('err', String(error && error.message || 'Verification failed.'));
        }
      };

      configurePageMode();
      syncFromLocation();
      redirectIfAuthenticated();
    </script>
  </body>
</html>
`;
