export function renderDashboardSidebar(): string {
  return `
    <aside class="session-rail">
      <div class="session-rail-inner">
        <div class="brand-lockup session-brand">
          <div class="brand-badge">CUA</div>
          <div>Dashboard</div>
        </div>

        <div class="session-card">
          <span class="field-label">Signed in</span>
          <strong id="sessionName">Loading account</strong>
          <p id="sessionEmail">Loading session details.</p>
          <p id="sessionMeta">Your OpenAI key, MCP access keys, connections, and run history stay scoped to this account.</p>
        </div>

        <div class="sidebar-nav">
          <div class="field-label">Dashboard</div>
          <nav class="step-list" aria-label="Dashboard tabs">
            <a class="step-link" href="/dashboard/llm-api-keys" data-step-link="llm-step" data-step-path="/dashboard/llm-api-keys">
              <div class="step-index" aria-hidden="true">
                <svg class="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="5" y="7" width="14" height="11" rx="3" />
                  <path d="M12 3v2" />
                  <circle cx="9.5" cy="12.5" r="1" />
                  <circle cx="14.5" cy="12.5" r="1" />
                  <path d="M9 15.5h6" />
                </svg>
              </div>
              <div class="step-copy">
                <strong>LLM API Keys</strong>
                <span>Set the active model credential for new runs.</span>
              </div>
            </a>
            <a class="step-link" href="/dashboard/connections" data-step-link="connections-step" data-step-path="/dashboard/connections">
              <div class="step-index" aria-hidden="true">
                <svg class="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="6" cy="6" r="2.5" />
                  <circle cx="18" cy="8" r="2.5" />
                  <circle cx="12" cy="18" r="2.5" />
                  <path d="M8.3 7.1 15.7 7" />
                  <path d="M7.2 8.3 10.8 15.7" />
                  <path d="M16.8 9.7 13.2 16.3" />
                </svg>
              </div>
              <div class="step-copy">
                <strong>Connections</strong>
                <span>Create a boundary, then capture access when needed.</span>
              </div>
            </a>
            <a class="step-link" href="/dashboard/patterns" data-step-link="patterns-step" data-step-path="/dashboard/patterns">
              <div class="step-index" aria-hidden="true">
                <svg class="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <path d="M10 6h4" />
                  <path d="M17.5 10v4" />
                  <path d="M7 10v4h7" />
                </svg>
              </div>
              <div class="step-copy">
                <strong>Patterns</strong>
                <span>Store reusable orchestration guides.</span>
              </div>
            </a>
            <a class="step-link" href="/dashboard/runs-privacy" data-step-link="runs-step" data-step-path="/dashboard/runs-privacy">
              <div class="step-index" aria-hidden="true">
                <svg class="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3 5 6v6c0 4.3 2.9 8.1 7 9 4.1-.9 7-4.7 7-9V6l-7-3z" />
                  <path d="m9.5 12.5 2 2 3-3.5" />
                </svg>
              </div>
              <div class="step-copy">
                <strong>Runs and Privacy</strong>
                <span>Inspect runs and retention settings.</span>
              </div>
            </a>
            <a class="step-link" href="/dashboard/mcp-access-keys" data-step-link="keys-step" data-step-path="/dashboard/mcp-access-keys">
              <div class="step-index" aria-hidden="true">
                <svg class="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8" cy="12" r="3.5" />
                  <path d="M11.5 12h9" />
                  <path d="M16.5 12v2.6" />
                  <path d="M19 12v2.6" />
                </svg>
              </div>
              <div class="step-copy">
                <strong>MCP Access Keys</strong>
                <span>Issue and revoke client credentials.</span>
              </div>
            </a>
          </nav>
        </div>

        <div class="session-links">
          <a class="session-link" href="/">Public home</a>
          <a class="session-link" id="quickConnectionsLink" href="/dashboard/connections">Connections</a>
        </div>

        <button id="signOutButton" class="signout-button" type="button" aria-label="Sign out">
          <span class="signout-icon-shell" aria-hidden="true">
            <img class="signout-brand-icon" src="/assets/brand/favicon-32x32.png" alt="" />
          </span>
          <span class="signout-button-label">Sign out</span>
        </button>
      </div>
    </aside>
  `;
}
