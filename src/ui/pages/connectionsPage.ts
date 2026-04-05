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

      <div id="captureLaunchModal" class="modal-backdrop" hidden>
        <div class="modal-card">
          <div>
            <p class="field-label">Launch capture</p>
            <h3 id="captureLaunchTitle">Start secure capture?</h3>
            <p id="captureLaunchBody">A secure remote browser session will open in this page. Use the control panel on the right to navigate and complete sign-in.</p>
          </div>
          <div class="button-row">
            <button id="confirmCaptureLaunch">Launch capture</button>
            <button class="ghost" id="cancelCaptureLaunch">Cancel</button>
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
        <div class="capture-workspace">
          <div class="capture-preview">
            <div id="captureFrame" class="capture-frame empty">
              <img id="captureImage" alt="Live capture session preview" style="display:none" />
              <div id="captureMarker" class="capture-marker" aria-hidden="true"></div>
              <div id="captureEmptyText">Start an auth capture session to control an isolated browser.</div>
            </div>
            <div class="capture-selection">
              <span>Use the control panel to drive this remote browser. Click the screenshot to set coordinates.</span>
              <strong id="captureSelectionText">No coordinate selected</strong>
              <strong id="captureCursorCoords" class="capture-cursor-readout">x: -, y: -</strong>
            </div>
          </div>

          <aside class="capture-controls subtle-shell">
            <div>
              <span class="field-label">Remote controls</span>
              <p class="micro-copy">All actions apply to the isolated capture browser shown on the left.</p>
            </div>
            <div class="field-grid capture-control-grid">
              <label class="field field-span-2"><span class="field-label">Capture session id</span><input id="captureSessionId" placeholder="Start a capture session." /></label>
              <label class="field field-span-2"><span class="field-label">Auth state expiry</span><input id="authStateExpiresAt" placeholder="2026-01-31T18:30:00Z" /></label>
              <label class="field field-span-2"><span class="field-label">Capture start URL</span><input id="captureStartUrl" placeholder="https://portal.example.com/login" /></label>
              <label class="field field-span-2"><span class="field-label">Current page URL</span><input id="captureCurrentUrl" placeholder="Captured URL" readonly /></label>
              <label class="field field-span-2"><span class="field-label">Current page title</span><input id="capturePageTitle" placeholder="Captured title" readonly /></label>
              <label class="field field-span-2"><span class="field-label">Discovered hosts</span><input id="captureDiscoveredHosts" placeholder="Discovered during session" readonly /></label>
              <label class="field field-span-2"><span class="field-label">Discovered path prefixes</span><input id="captureDiscoveredPaths" placeholder="Discovered during session" readonly /></label>
              <label class="field field-span-2 capture-action-field"><span class="field-label">Navigate URL</span><div class="capture-inline-action"><input id="captureNavigateUrl" placeholder="https://portal.example.com/account" /><button class="ghost capture-go" id="captureNavigate" type="button" aria-label="Navigate" title="Navigate"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3l7 5-7 5V3z"/></svg></button></div></label>
              <label class="field field-span-2 capture-action-field"><span class="field-label">Type text</span><div class="capture-inline-action"><input id="captureTypeText" placeholder="Text to type" /><button class="ghost capture-go" id="captureType" type="button" aria-label="Type" title="Type"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3l7 5-7 5V3z"/></svg></button></div></label>
              <label class="field field-span-2 capture-action-field"><span class="field-label">Keypress combo</span><div class="capture-inline-action"><input id="captureKeypress" placeholder="Tab or Control+L" /><button class="ghost capture-go" id="captureKey" type="button" aria-label="Send keypress" title="Send keypress"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3l7 5-7 5V3z"/></svg></button></div></label>
              <label class="field field-span-2 capture-action-field"><span class="field-label">Click position</span><div class="capture-inline-action"><input id="captureClick" placeholder="x,y" /><button class="ghost capture-go" id="captureClickButton" type="button" aria-label="Click" title="Click"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3l7 5-7 5V3z"/></svg></button></div></label>
              <label class="field checkbox-field"><span class="field-label">Instant click on preview selection</span><input id="captureAutoClick" type="checkbox" /></label>
              <label class="field field-span-2 capture-action-field"><span class="field-label">Scroll delta Y</span><div class="capture-inline-action"><input id="captureScrollY" placeholder="600" /><button class="ghost capture-go" id="captureScrollButton" type="button" aria-label="Scroll" title="Scroll"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3l7 5-7 5V3z"/></svg></button></div></label>
              <label class="field field-span-2 capture-action-field"><span class="field-label">Wait milliseconds</span><div class="capture-inline-action"><input id="captureWaitMs" placeholder="1000" /><button class="ghost capture-go" id="captureWaitButton" type="button" aria-label="Wait" title="Wait"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3l7 5-7 5V3z"/></svg></button></div></label>
            </div>
            <div class="button-row">
              <button class="secondary" id="startCapture">Start capture</button>
              <button class="ghost" id="refreshCapture">Refresh capture</button>
              <button class="secondary" id="finalizeCapture">Finalize</button>
              <button class="danger" id="cancelCapture">Cancel</button>
            </div>
          </aside>
        </div>

        <div class="subtle-shell">
          <div class="field-grid">
            <label class="field field-span-2"><span class="field-label">Capture mode</span><input id="captureModeSummary" value="Remote secure capture" readonly /></label>
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
