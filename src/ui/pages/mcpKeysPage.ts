export function renderMcpKeysSection(hiddenAttr: string): string {
  return `
    <section class="section-panel${hiddenAttr ? '' : ' active-panel'}" id="keys-step" data-reveal ${hiddenAttr}>
      <div class="section-head">
        <h2>Create access keys for clients and scope them to allowed connections.</h2>
        <p>MCP access keys are shown once, then redacted. Revoke directly from cards when no longer needed.</p>
      </div>

      <div class="section-stack">
        <div class="title-row">
          <div>
            <span class="field-label">Issued keys</span>
            <p class="micro-copy">Cards show scope, creation time, and last use.</p>
          </div>
          <div class="button-row" id="apiKeyListActions">
            <button class="ghost" id="newApiKey" type="button" data-open-composer="mcp-key" onclick="window.__dashboardOpenComposer && window.__dashboardOpenComposer('mcp-key'); return false;">Add another key</button>
            <button class="secondary" id="listKeys">Refresh</button>
          </div>
        </div>

        <div id="apiKeyCards" class="card-grid">
          <article class="empty-state-card">
            <span class="field-label">No access keys yet</span>
            <strong>Create your first MCP key</strong>
            <p>Issue a key for a client and scope it to the connections it should use.</p>
            <div class="button-row">
              <button type="button" data-empty-action="new-api-key" data-open-composer="mcp-key" onclick="window.__dashboardOpenComposer && window.__dashboardOpenComposer('mcp-key'); return false;">Create access key</button>
            </div>
          </article>
        </div>

        <div id="keyComposer" class="composer-card" hidden>
          <div class="title-row">
            <div>
              <span class="field-label">Issue key</span>
              <p class="micro-copy">Leave all options unselected to allow every connection on this account.</p>
            </div>
            <div class="button-row">
              <button class="ghost" id="scopeSelectedConnection" type="button">Use selected connection</button>
              <button class="ghost" id="cancelKeyComposer" type="button">Cancel</button>
            </div>
          </div>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Name</span>
              <input id="keyName" placeholder="Desktop client" />
            </label>
            <div class="field field-span-2">
              <span class="field-label">Allowed connections</span>
              <div id="keyScopePicker" class="connection-scope-picker"></div>
              <input id="keyConnIds" type="hidden" />
            </div>
          </div>

          <div class="button-row">
            <button id="createKey">Create access key</button>
          </div>
        </div>
      </div>

      <div class="output-shell" hidden>
        <pre id="keysOut">MCP key output</pre>
      </div>
    </section>
  `;
}
