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
      .status.running, .status.awaiting_approval { color: var(--warn); }
      .status.failed, .status.interrupted { color: var(--bad); }

      .actions {
        margin-top: 10px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      button {
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 8px 12px;
        background: #ffffff;
        color: var(--ink);
        font-weight: 700;
        cursor: pointer;
      }

      button.primary {
        background: #17324a;
        color: #f3fbff;
      }

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
        <p class="muted">MCP Apps bridge widget: initializes via ui/initialize and uses tools/call for refresh, approval, and interrupt handoffs.</p>
        <p>Status: <span id="status" class="status">waiting</span></p>
        <div class="actions">
          <button id="refresh-btn" type="button">Refresh Run</button>
          <button id="approve-btn" type="button" class="primary">Approve + Resume</button>
          <button id="interrupt-btn" type="button">Interrupt</button>
        </div>
        <pre id="output">No run payload yet.</pre>
      </article>
    </main>

    <script>
      const statusEl = document.getElementById('status');
      const outputEl = document.getElementById('output');
      const refreshBtn = document.getElementById('refresh-btn');
      const approveBtn = document.getElementById('approve-btn');
      const interruptBtn = document.getElementById('interrupt-btn');

      const inFlight = new Map();
      let nextId = 1;
      let currentRunId = null;

      function rpcRequest(method, params) {
        return new Promise((resolve, reject) => {
          const id = nextId++;
          inFlight.set(id, { resolve, reject });
          window.parent.postMessage({ jsonrpc: '2.0', id, method, params }, '*');
        });
      }

      function rpcNotify(method, params) {
        window.parent.postMessage({ jsonrpc: '2.0', method, params }, '*');
      }

      function updateFromPayload(payload) {
        const run = payload?.structuredContent?.run || payload?.result?.structuredContent?.run;
        if (!run) return;
        currentRunId = String(run.id || '').trim() || currentRunId;

        const status = String(run.status || 'unknown').toLowerCase();
        statusEl.textContent = status;
        statusEl.className = 'status ' + status;
        outputEl.textContent = JSON.stringify(run, null, 2);
      }

      async function initializeBridge() {
        await rpcRequest('ui/initialize', {
          appInfo: { name: 'cua-run-widget', version: '0.1.0' },
          appCapabilities: {},
          protocolVersion: '2026-01-26'
        });
        rpcNotify('ui/notifications/initialized', {});
      }

      async function callTool(name, args) {
        return rpcRequest('tools/call', {
          name,
          arguments: args
        });
      }

      async function refreshRun() {
        if (!currentRunId) return;
        const result = await callTool('cua_get_run', { runId: currentRunId });
        updateFromPayload(result);
      }

      async function approveRun() {
        if (!currentRunId) return;
        const result = await callTool('cua_approve_action', {
          runId: currentRunId,
          approved: true,
          note: 'Approved from MCP App widget'
        });
        updateFromPayload(result);
      }

      async function interruptRun() {
        if (!currentRunId) return;
        const result = await callTool('cua_interrupt', {
          runId: currentRunId,
          reason: 'Interrupted from MCP App widget',
          source: 'user'
        });
        updateFromPayload(result);
      }

      window.addEventListener('message', (event) => {
        if (event.source !== window.parent) return;
        const message = event.data;
        if (!message || message.jsonrpc !== '2.0') return;

        if (typeof message.id === 'number') {
          const pendingReq = inFlight.get(message.id);
          if (!pendingReq) return;
          inFlight.delete(message.id);
          if (message.error) pendingReq.reject(message.error);
          else pendingReq.resolve(message.result);
          return;
        }

        if (message.method === 'ui/notifications/tool-result') {
          updateFromPayload(message.params || {});
        }
        if (message.method === 'ui/notifications/tool-input') {
          updateFromPayload(message.params || {});
        }
      }, { passive: true });

      refreshBtn.addEventListener('click', () => {
        refreshRun().catch((error) => {
          outputEl.textContent = 'Refresh failed: ' + (error?.message || JSON.stringify(error));
        });
      });

      approveBtn.addEventListener('click', () => {
        approveRun().catch((error) => {
          outputEl.textContent = 'Approval failed: ' + (error?.message || JSON.stringify(error));
        });
      });

      interruptBtn.addEventListener('click', () => {
        interruptRun().catch((error) => {
          outputEl.textContent = 'Interrupt failed: ' + (error?.message || JSON.stringify(error));
        });
      });

      initializeBridge().catch((error) => {
        outputEl.textContent = 'Bridge init failed: ' + (error?.message || JSON.stringify(error));
      });
    </script>
  </body>
</html>
`;
