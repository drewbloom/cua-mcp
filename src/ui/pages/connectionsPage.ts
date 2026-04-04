export function renderConnectionsSection(hiddenAttr: string): string {
  return `
    <section class="section-panel${hiddenAttr ? '' : ' active-panel'}" id="connections-step" data-reveal ${hiddenAttr}>
      <div class="section-head">
        <h2>Create a connection, then launch guided capture only when browser access is needed.</h2>
        <p>The connection is the security boundary. Guided capture is the default flow.</p>
      </div>

      <div id="selectedConnectionShell" class="selected-connection-shell empty">
        <div class="selected-connection-head">
          <div class="selected-connection-title">
            <span class="field-label">Selected connection</span>
            <strong id="selectedConnectionName">No connection selected</strong>
          </div>
          <div class="button-row">
            <button class="secondary" id="refreshConnections">Refresh list</button>
            <button class="ghost" id="manageSelectedConnection" type="button">Launch guided capture</button>
            <button id="newConnection" type="button" data-open-composer="connection" onclick="window.__dashboardOpenComposer && window.__dashboardOpenComposer('connection'); return false;">Create connection</button>
          </div>
        </div>
        <div id="selectedConnectionMeta" class="selected-connection-meta">
          <span class="connection-tag">Create or choose a connection card, then launch capture.</span>
        </div>
      </div>

      <div id="connectionCreateModeModal" class="modal-backdrop" hidden>
        <div class="modal-card">
          <div>
            <p class="field-label">Create connection</p>
            <h3>How should this connection be created?</h3>
            <p>Guided capture is recommended and launches browser flow after saving the boundary.</p>
          </div>
          <div class="button-row">
            <button id="startGuidedConnectionCreate">Guided capture (recommended)</button>
            <button class="secondary" id="startManualConnectionCreate">Manual only</button>
            <button class="ghost" id="cancelConnectionCreateMode">Cancel</button>
          </div>
        </div>
      </div>

      <div id="connectionsBoard" class="connection-board capture-history-empty">No connections loaded yet.</div>

      <div id="connectionSetupView" class="subview">
        <div id="connectionComposer" class="composer-card" hidden>
          <div class="title-row">
            <div>
              <span class="field-label">Connection policy</span>
              <p class="micro-copy">Create the host boundary first, then capture access from the card.</p>
            </div>
            <div class="button-row">
              <button class="ghost" id="cancelConnectionComposer" type="button">Cancel</button>
            </div>
          </div>

          <div class="field-grid">
            <label class="field"><span class="field-label">Connection name</span><input id="connName" placeholder="NetDocuments production" /></label>
            <label class="field"><span class="field-label">Base host</span><input id="connBaseHost" placeholder="portal.example.com" /></label>
            <label class="field field-span-2"><span class="field-label">Allowed hosts</span><input id="connHosts" placeholder="app.example.com, support.example.com" /></label>
            <label class="field field-span-2"><span class="field-label">Allowed path prefixes</span><input id="connPaths" placeholder="/, /login, /dashboard" /></label>
            <label class="field checkbox-field"><span class="field-label">Allow base-host subdomains</span><input id="connAllowSubdomains" type="checkbox" /></label>
            <label class="field checkbox-field"><span class="field-label">Allow any path on approved hosts</span><input id="connAllowAnyPath" type="checkbox" /></label>
            <label class="field"><span class="field-label">Preferred auth method</span><select id="connAuthMethod"><option value="oauth">oauth</option><option value="auth_state">auth_state</option><option value="credentials">credentials</option></select></label>
            <label class="field"><span class="field-label">Status</span><select id="patchConnStatus"><option value="active">active</option><option value="paused">paused</option><option value="disabled">disabled</option></select></label>
            <input id="patchConnId" type="hidden" />
            <input id="secretConnId" type="hidden" />
          </div>

          <div class="button-row">
            <button id="createConn">Create connection</button>
            <button class="secondary" id="patchConn">Save changes</button>
          </div>
        </div>
      </div>

      <div id="connectionAccessView" class="subview" hidden>
        <div class="subtle-shell">
          <div class="field-grid">
            <label class="field field-span-2"><span class="field-label">Capture session id</span><input id="captureSessionId" placeholder="Start a capture session." /></label>
            <label class="field field-span-2"><span class="field-label">Auth state expiry</span><input id="authStateExpiresAt" placeholder="2026-01-31T18:30:00Z" /></label>
            <label class="field field-span-2"><span class="field-label">Capture start URL</span><input id="captureStartUrl" placeholder="https://portal.example.com/login" /></label>
            <label class="field"><span class="field-label">Navigate URL</span><input id="captureNavigateUrl" placeholder="https://portal.example.com/account" /></label>
            <label class="field"><span class="field-label">Type text</span><input id="captureTypeText" placeholder="Text to type" /></label>
            <label class="field"><span class="field-label">Keypress combo</span><input id="captureKeypress" placeholder="Tab or Control+L" /></label>
            <label class="field"><span class="field-label">Click position</span><input id="captureClick" placeholder="x,y" /></label>
            <label class="field"><span class="field-label">Scroll delta Y</span><input id="captureScrollY" placeholder="600" /></label>
            <label class="field"><span class="field-label">Wait milliseconds</span><input id="captureWaitMs" placeholder="1000" /></label>
          </div>
          <div class="button-row">
            <button class="secondary" id="startCapture">Start capture</button>
            <button class="ghost" id="refreshCapture">Refresh capture</button>
            <button class="ghost" id="captureNavigate">Navigate</button>
            <button class="ghost" id="captureType">Type</button>
            <button class="ghost" id="captureKey">Keypress</button>
            <button class="ghost" id="captureClickButton">Click</button>
            <button class="ghost" id="captureScrollButton">Scroll</button>
            <button class="ghost" id="captureWaitButton">Wait</button>
            <button class="secondary" id="finalizeCapture">Finalize</button>
            <button class="danger" id="cancelCapture">Cancel</button>
          </div>
        </div>

        <div class="capture-preview">
          <div id="captureFrame" class="capture-frame empty">
            <img id="captureImage" alt="Live capture session preview" style="display:none" />
            <div id="captureMarker" class="capture-marker" aria-hidden="true"></div>
            <div id="captureEmptyText">Start an auth capture session to control an isolated browser.</div>
          </div>
          <div class="capture-selection">
            <span>Click inside the screenshot to populate click position.</span>
            <strong id="captureSelectionText">No coordinate selected</strong>
          </div>
        </div>

        <div class="subtle-shell">
          <div id="captureHistoryOut" class="capture-history-empty">No capture history loaded yet.</div>
        </div>
      </div>

      <pre id="connOut" class="dev-output">Connections output</pre>
      <pre id="secretOut" class="dev-output">Secrets output</pre>
      <pre id="captureOut" class="dev-output">Capture output</pre>
    </section>
  `;
}
