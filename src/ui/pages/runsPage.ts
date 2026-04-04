export function renderRunsSection(hiddenAttr: string): string {
  return `
    <section class="section-panel${hiddenAttr ? '' : ' active-panel'}" id="runs-step" data-reveal ${hiddenAttr}>
      <div class="section-head">
        <h2>Decide what the system remembers and what it forgets.</h2>
        <p>Runtime settings stay user-scoped. Inspect stored runs and control retention.</p>
      </div>

      <div class="subsection-nav" aria-label="Runs views">
        <button id="runsHistoryTab" class="subview-toggle active" type="button">List runs</button>
        <button id="runsSettingsTab" class="subview-toggle" type="button">Privacy settings</button>
      </div>

      <div id="runSettingsView" class="subview">
        <div class="field-grid">
          <label class="field"><span class="field-label">Run retention days</span><input id="runtimeRetentionDays" type="number" min="1" max="365" placeholder="30" /></label>
          <label class="field checkbox-field"><span class="field-label">Zero-data retention</span><input id="runtimeZdrEnabled" type="checkbox" /></label>
          <label class="field checkbox-field"><span class="field-label">Persist run events</span><input id="runtimePersistEvents" type="checkbox" checked /></label>
          <label class="field checkbox-field"><span class="field-label">Persist run output</span><input id="runtimePersistOutput" type="checkbox" checked /></label>
        </div>

        <div class="button-row">
          <button id="loadRuntimeSettings">Load settings</button>
          <button class="secondary" id="saveRuntimeSettings">Save settings</button>
        </div>
      </div>

      <div id="runHistoryView" class="subview" hidden>
        <div class="surface-actions">
          <div>
            <span class="field-label">Stored runs</span>
            <p class="micro-copy">Inspect or delete stored runs.</p>
          </div>
          <div class="button-row">
            <button class="secondary" id="listRuns">Refresh runs</button>
          </div>
        </div>

        <div class="subtle-shell">
          <div id="runsHistoryOut" class="capture-history-empty">No runs loaded yet.</div>
        </div>
      </div>

      <pre id="runtimeSettingsOut" class="dev-output">Runtime settings output</pre>
    </section>
  `;
}
