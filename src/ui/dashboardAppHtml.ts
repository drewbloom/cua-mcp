import { DASHBOARD_STYLES } from './components/dashboardStyles.js';
import { renderDashboardSidebar } from './components/dashboardSidebar.js';
import { renderDashboardModals } from './components/dashboardModals.js';
import { renderDashboardClientScript } from './components/dashboardClientScript.js';
import { renderLlmKeysSection } from './pages/llmKeysPage.js';
import { renderMcpKeysSection } from './pages/mcpKeysPage.js';
import { renderConnectionsSection } from './pages/connectionsPage.js';
import { renderPatternsSection } from './pages/patternsPage.js';
import { renderRunsSection } from './pages/runsPage.js';

type DashboardComposer = 'llm' | 'mcp-key' | 'pattern' | 'connection';

export function renderDashboardAppHtml(
  initialSectionId: string,
  options: { openComposer?: DashboardComposer } = {},
): string {
  const activeSection = String(initialSectionId || 'llm-step');
  const hiddenFor = (sectionId: string) => (sectionId === activeSection ? '' : 'hidden');
  const openLlmComposer = activeSection === 'llm-step' && options.openComposer === 'llm';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CUA Dashboard</title>
    <meta name="theme-color" content="#ff8c42" />
    <meta name="apple-mobile-web-app-title" content="CUA MCP" />
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/favicon-16x16.png" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/brand/apple-touch-icon.png" />
    <link rel="manifest" href="/assets/brand/site.webmanifest" />
    <style>${DASHBOARD_STYLES}</style>
  </head>
  <body>
    <main class="app-shell">
      ${renderDashboardSidebar()}
      <div class="workspace-main-shell">
        <div class="workspace-main">
          ${renderLlmKeysSection(hiddenFor('llm-step'), openLlmComposer)}
          ${renderMcpKeysSection(hiddenFor('keys-step'))}
          ${renderConnectionsSection(hiddenFor('connections-step'))}
          ${renderPatternsSection(hiddenFor('patterns-step'))}
          ${renderRunsSection(hiddenFor('runs-step'))}
        </div>
      </div>
    </main>

    <pre id="sessionOut" class="dev-output">Session output</pre>
    ${renderDashboardModals()}
    ${renderDashboardClientScript(activeSection, options.openComposer)}
  </body>
</html>`;
}
