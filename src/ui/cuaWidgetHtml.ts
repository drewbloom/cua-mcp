export const CUA_WIDGET_URI = 'ui://widget/cua-run-v1.html';

export const CUA_WIDGET_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CUA Run Console</title>
    <style>
      :root {
        --bg: #f5f7fb;
        --card: #ffffff;
        --ink: #0b2339;
        --muted: #58718a;
        --line: #d7e2ef;
        --ok: #167d53;
        --warn: #9e6a08;
        --bad: #a52746;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: radial-gradient(circle at 10% 0%, #e6eefb, var(--bg) 38%, #eff7ff 100%);
        color: var(--ink);
        font-family: "Segoe UI", "Avenir Next", sans-serif;
      }

      main {
        max-width: 920px;
        margin: 0 auto;
        padding: 20px;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 14px;
        box-shadow: 0 10px 30px rgba(12, 34, 56, 0.08);
      }

      h2 {
        margin: 0 0 8px;
        font-size: 20px;
      }

      .muted {
        color: var(--muted);
        font-size: 13px;
      }

      .status {
        display: inline-block;
        padding: 5px 9px;
        border-radius: 999px;
        border: 1px solid var(--line);
        font-size: 12px;
        font-weight: 700;
      }

      .status.completed { color: var(--ok); }
      .status.running { color: var(--warn); }
      .status.failed, .status.interrupted { color: var(--bad); }

      pre {
        margin-top: 10px;
        background: #0f1c2a;
        color: #d7e7ff;
        border-radius: 10px;
        padding: 10px;
        overflow: auto;
        max-height: 320px;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <main>
      <article class="card">
        <h2>CUA Run Console</h2>
        <p class="muted">Starter MCP App view. This reads structured tool payloads and shows run status + latest summary.</p>
        <p>Status: <span id="status" class="status">waiting</span></p>
        <pre id="output">No run payload yet.</pre>
      </article>
    </main>

    <script>
      const statusEl = document.getElementById('status');
      const outputEl = document.getElementById('output');

      function updateFromPayload(payload) {
        const run = payload?.structuredContent?.run || payload?.result?.structuredContent?.run;
        if (!run) return;

        const status = String(run.status || 'unknown').toLowerCase();
        statusEl.textContent = status;
        statusEl.className = 'status ' + status;
        outputEl.textContent = JSON.stringify(run, null, 2);
      }

      window.addEventListener('message', (event) => {
        if (event.source !== window.parent) return;
        const message = event.data;
        if (!message || message.jsonrpc !== '2.0') return;

        if (message.method === 'ui/notifications/tool-result') {
          updateFromPayload(message.params || {});
        }
        if (message.method === 'ui/notifications/tool-input') {
          updateFromPayload(message.params || {});
        }
      }, { passive: true });
    </script>
  </body>
</html>
`;
