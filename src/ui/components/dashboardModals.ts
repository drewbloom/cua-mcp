export function renderDashboardModals(): string {
  return `
    <div id="oneTimeKeyModal" class="modal-backdrop" hidden>
      <div class="modal-card">
        <div>
          <p class="field-label">MCP Access Key</p>
          <h3>Copy the server URL and key now.</h3>
          <p>The raw key is returned once and never shown again.</p>
        </div>
        <label class="field">
          <span class="field-label">Server URL</span>
          <input id="oneTimeKeyServerUrl" readonly />
        </label>
        <label class="field">
          <span class="field-label">Access key</span>
          <input id="oneTimeKeyValue" readonly />
        </label>
        <div class="button-row">
          <button class="secondary" id="copyOneTimeKey">Copy key</button>
          <button class="ghost" id="copyServerUrl">Copy server URL</button>
          <button class="danger" id="clearOneTimeKey">Done</button>
        </div>
      </div>
    </div>

    <div id="runDetailModal" class="modal-backdrop" hidden>
      <div class="modal-card">
        <div>
          <p class="field-label">Run detail</p>
          <h3>Inspect the stored run.</h3>
          <p>Use this to confirm what was persisted for the selected run.</p>
        </div>
        <pre id="runDetailOut">Run detail output</pre>
        <div class="button-row">
          <button class="secondary" id="closeRunDetailModal">Close</button>
        </div>
      </div>
    </div>

    <div id="banner" class="banner" hidden>Ready.</div>
    <div id="toastStack" class="toast-stack" aria-live="polite" aria-atomic="false"></div>
  `;
}
