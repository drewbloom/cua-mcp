export function renderLlmKeysSection(hiddenAttr: string, openComposer: boolean): string {
  const cardsHidden = openComposer ? 'hidden' : '';
  const composerHidden = openComposer ? '' : 'hidden';
  return `
    <section class="section-panel${hiddenAttr ? '' : ' active-panel'}" id="llm-step" data-reveal ${hiddenAttr}>
      <div class="section-head">
        <h2>Store the OpenAI key this account should use for new runs.</h2>
        <p>Keep one active key for normal use, rotate it when needed, and remove stale keys directly from cards.</p>
      </div>

      <div class="section-stack">
        <div class="title-row">
          <div>
            <span class="field-label">Stored keys</span>
            <p class="micro-copy">The active key is used for new runs.</p>
          </div>
          <div class="button-row" id="llmListActions">
            <button class="ghost" id="newLlmKey" type="button" data-open-composer="llm" onclick="window.__dashboardOpenComposer && window.__dashboardOpenComposer('llm'); return false;">Add another key</button>
            <button class="secondary" id="listLlmKeys">Refresh</button>
          </div>
        </div>

        <div id="llmCards" class="card-grid" ${cardsHidden}>
          <article class="empty-state-card">
            <span class="field-label">No OpenAI keys yet</span>
            <strong>Add your first key</strong>
            <p>Store an OpenAI API key for this account before starting runs.</p>
            <div class="button-row">
              <button type="button" data-empty-action="new-llm-key" data-open-composer="llm" onclick="window.__dashboardOpenComposer && window.__dashboardOpenComposer('llm'); return false;">Add your first key</button>
            </div>
          </article>
        </div>

        <div id="llmComposer" class="composer-card" ${composerHidden}>
          <div class="title-row">
            <div>
              <span class="field-label">Add key</span>
              <p class="micro-copy">Key value is accepted once and encrypted at rest.</p>
            </div>
            <div class="button-row">
              <button class="ghost" id="cancelLlmComposer" type="button">Cancel</button>
            </div>
          </div>

          <div class="field-grid">
            <label class="field">
              <span class="field-label">Provider</span>
              <select id="llmProvider">
                <option value="openai">OpenAI</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label">Name</span>
              <input id="llmKeyName" placeholder="Primary OpenAI key" />
            </label>
            <label class="field field-span-2">
              <span class="field-label">OpenAI API key</span>
              <input id="llmApiKey" placeholder="sk-..." type="password" autocomplete="off" />
            </label>
          </div>

          <div class="button-row">
            <button id="createLlmKey">Store OpenAI key</button>
          </div>
        </div>
      </div>

      <div class="output-shell" hidden>
        <div class="output-head"><span>OpenAI key activity</span></div>
        <pre id="llmOut">OpenAI key output</pre>
      </div>
    </section>
  `;
}
