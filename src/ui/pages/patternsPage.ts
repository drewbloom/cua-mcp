export function renderPatternsSection(hiddenAttr: string): string {
  return `
    <section class="section-panel${hiddenAttr ? '' : ' active-panel'}" id="patterns-step" data-reveal ${hiddenAttr}>
      <div class="section-head">
        <h2>Keep reusable orchestration playbooks in one place.</h2>
        <p>Save working URLs, stepwise guidance, and steering notes as editable cards.</p>
      </div>

      <div id="selectedPatternShell" class="selected-connection-shell empty">
        <div class="selected-connection-head">
          <div class="selected-connection-title">
            <span class="field-label">Selected pattern</span>
            <strong id="selectedPatternName">No pattern selected</strong>
          </div>
          <div class="button-row" id="patternListActions">
            <button class="secondary" id="refreshPatterns">Refresh list</button>
            <button class="ghost" id="newPattern" data-open-composer="pattern" onclick="window.__dashboardOpenComposer && window.__dashboardOpenComposer('pattern'); return false;">Add another pattern</button>
          </div>
        </div>
        <div id="selectedPatternMeta" class="selected-connection-meta">
          <span class="connection-tag">Create or choose a pattern card to edit.</span>
        </div>
      </div>

      <div id="patternCards" class="card-grid">
        <article class="empty-state-card">
          <span class="field-label">No patterns yet</span>
          <strong>Write the first reusable guide</strong>
          <p>Capture one workflow with real URLs, steps, and known issues.</p>
          <div class="button-row">
            <button type="button" data-empty-action="new-pattern" data-open-composer="pattern" onclick="window.__dashboardOpenComposer && window.__dashboardOpenComposer('pattern'); return false;">New pattern</button>
          </div>
        </article>
      </div>

      <div id="patternEditor" class="composer-card" hidden>
        <div class="title-row">
          <div>
            <span class="field-label">Pattern editor</span>
            <p class="micro-copy">Cards are summaries. This form holds the full guide.</p>
          </div>
          <div class="button-row">
            <button class="ghost" id="cancelPatternEditor" type="button">Cancel</button>
          </div>
        </div>

        <div class="field-grid">
          <input id="patternId" type="hidden" />
          <label class="field">
            <span class="field-label">Pattern name</span>
            <input id="patternName" placeholder="NetDocuments login with auth-state fallback" />
          </label>
          <label class="field field-span-2">
            <span class="field-label">Known URLs or paths</span>
            <input id="patternUrls" placeholder="https://example.com/login, /search" />
          </label>
          <label class="field field-span-2">
            <span class="field-label">Summary</span>
            <textarea id="patternSummary" placeholder="Short description of when this pattern applies."></textarea>
          </label>
          <label class="field field-span-2">
            <span class="field-label">Stepwise guide</span>
            <textarea id="patternSteps" placeholder="1. Start on login page."></textarea>
          </label>
          <label class="field field-span-2">
            <span class="field-label">Known issues and steering notes</span>
            <textarea id="patternIssues" placeholder="Ask for clarification when multiple workspaces appear."></textarea>
          </label>
        </div>

        <div class="button-row">
          <button id="savePattern">Save pattern</button>
          <button class="secondary" id="listPatterns">List patterns</button>
          <button class="danger" id="deletePattern" hidden>Delete pattern</button>
        </div>
      </div>

      <div class="output-shell" hidden>
        <pre id="patternsOut">Pattern output</pre>
      </div>
    </section>
  `;
}
