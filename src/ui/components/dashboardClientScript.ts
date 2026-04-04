type DashboardComposer = 'llm' | 'mcp-key' | 'pattern' | 'connection';

export function renderDashboardClientScript(initialSectionId: string, openComposer?: DashboardComposer): string {
  const initial = JSON.stringify(String(initialSectionId || 'llm-step'));
  const composer = JSON.stringify(openComposer || '');
  return `
    <script>
      (() => {
        const $ = (id) => document.getElementById(id);
        const out = {
          llm: $('llmOut'),
          keys: $('keysOut'),
          conn: $('connOut'),
          patterns: $('patternsOut'),
          runtimeSettings: $('runtimeSettingsOut'),
          runsHistory: $('runsHistoryOut'),
          runDetail: $('runDetailOut'),
        };

        const state = {
          llmKeys: [],
          apiKeys: [],
          connections: [],
          patterns: [],
          selectedConnectionId: '',
          selectedPatternId: '',
          llmComposerMode: 'create',
          llmEditKeyId: '',
          apiKeyComposerMode: 'create',
          apiKeyEditId: '',
          patternEditorMode: 'create',
          patternEditId: '',
          connectionCreateMode: 'guided',
        };

        const sections = Array.from(document.querySelectorAll('[data-reveal]'));
        const navLinks = Array.from(document.querySelectorAll('[data-step-link]'));
        const banner = $('banner');
        const toastStack = $('toastStack');
        const llmCards = $('llmCards');
        const llmComposer = $('llmComposer');
        const llmListActions = $('llmListActions');
        const apiKeyCards = $('apiKeyCards');
        const keyComposer = $('keyComposer');
        const apiKeyListActions = $('apiKeyListActions');
        const keyScopePicker = $('keyScopePicker');
        const patternCards = $('patternCards');
        const patternEditor = $('patternEditor');
        const patternListActions = $('patternListActions');
        const connectionsBoard = $('connectionsBoard');
        const selectedConnectionName = $('selectedConnectionName');
        const selectedConnectionMeta = $('selectedConnectionMeta');
        const selectedConnectionShell = $('selectedConnectionShell');
        const connectionComposer = $('connectionComposer');
        const connectionCreateModeModal = $('connectionCreateModeModal');
        const oneTimeKeyModal = $('oneTimeKeyModal');
        const runDetailModal = $('runDetailModal');

        const DASHBOARD_ROUTE_BY_SECTION = {
          'llm-step': '/dashboard/llm-api-keys',
          'connections-step': '/dashboard/connections',
          'patterns-step': '/dashboard/patterns',
          'runs-step': '/dashboard/runs-privacy',
          'keys-step': '/dashboard/mcp-access-keys',
        };

        const DASHBOARD_SECTION_BY_ROUTE = {
          '/dashboard': 'llm-step',
          '/dashboard/llm-api-keys': 'llm-step',
          '/dashboard/connections': 'connections-step',
          '/dashboard/patterns': 'patterns-step',
          '/dashboard/runs-privacy': 'runs-step',
          '/dashboard/mcp-access-keys': 'keys-step',
        };

        function showToast(kind, message) {
          if (!toastStack || !message) return;
          const toast = document.createElement('div');
          toast.className = 'toast ' + (kind || '');
          toast.textContent = message;
          toastStack.appendChild(toast);
          requestAnimationFrame(() => toast.classList.add('show'));
          window.setTimeout(() => {
            toast.classList.remove('show');
            window.setTimeout(() => toast.remove(), 180);
          }, kind === 'err' ? 4200 : 2600);
        }

        function setBanner(kind, message) {
          if (banner) {
            banner.hidden = false;
            banner.className = 'banner ' + (kind || '');
            banner.textContent = message;
          }
          showToast(kind, message);
        }

        function print(target, data) {
          if (!target) return;
          target.textContent = JSON.stringify(data || {}, null, 2);
        }

        function escapeHtml(value) {
          return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function formatTimestamp(value) {
          if (!value) return 'Unknown time';
          const date = new Date(String(value));
          if (Number.isNaN(date.getTime())) return String(value);
          return date.toLocaleString();
        }

        async function api(path, method = 'GET', body) {
          try {
            const res = await fetch(path, {
              method,
              credentials: 'include',
              headers: { 'content-type': 'application/json' },
              body: body ? JSON.stringify(body) : undefined,
            });
            const text = await res.text();
            let parsed;
            try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
            if (!res.ok) {
              setBanner('err', String(parsed?.message || parsed?.error || ('Request failed (' + res.status + ').')));
              return { ok: false, status: res.status, body: parsed };
            }
            return { ok: true, status: res.status, body: parsed };
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error || 'Unknown network error');
            setBanner('err', message);
            return { ok: false, status: 0, body: { error: message } };
          }
        }

        function splitCsv(raw) {
          return String(raw || '').split(',').map((v) => v.trim()).filter(Boolean);
        }

        function showSurface(element, show) {
          if (!element) return;
          element.hidden = !show;
        }

        function requireText(id, label) {
          const el = $(id);
          const value = String(el?.value || '').trim();
          if (!value) {
            setBanner('err', label + ' is required.');
            el?.focus();
            return null;
          }
          return value;
        }

        function sectionFromPath(pathname) {
          const normalized = String(pathname || '/dashboard').replace(/\\/+$/, '') || '/dashboard';
          return DASHBOARD_SECTION_BY_ROUTE[normalized] || 'llm-step';
        }

        function routeFromSection(sectionId) {
          return DASHBOARD_ROUTE_BY_SECTION[sectionId] || '/dashboard/llm-api-keys';
        }

        function updateActiveSectionNav(sectionId) {
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('data-step-link') === sectionId);
          });
        }

        function activateSection(sectionId, pushRoute = true) {
          const fallback = sections[0];
          const section = sections.find((entry) => entry.id === sectionId) || fallback;
          const resolved = section?.id || 'llm-step';
          sections.forEach((entry) => {
            const active = entry.id === resolved;
            entry.hidden = !active;
            entry.classList.toggle('active-panel', active);
          });
          updateActiveSectionNav(resolved);
          if (pushRoute) {
            const path = routeFromSection(resolved);
            const nextUrl = path + window.location.search;
            if ((window.location.pathname + window.location.search) !== nextUrl) {
              history.pushState({ sectionId: resolved }, '', nextUrl);
            }
          }
        }

        function showLlmComposer(show) {
          showSurface(llmComposer, show);
          showSurface(llmCards, !show);
          if (llmListActions) {
            llmListActions.hidden = show || state.llmKeys.length === 0;
          }
        }

        function showKeyComposer(show) {
          showSurface(keyComposer, show);
          showSurface(apiKeyCards, !show);
          if (apiKeyListActions) {
            apiKeyListActions.hidden = show || state.apiKeys.length === 0;
          }
        }

        function showPatternEditor(show) {
          showSurface(patternEditor, show);
          showSurface(patternCards, !show);
          if (patternListActions) {
            patternListActions.hidden = show || state.patterns.length === 0;
          }
        }

        function openComposer(kind) {
          if (kind === 'llm') {
            resetLlmComposer();
            showLlmComposer(true);
            activateSection('llm-step');
            $('llmKeyName')?.focus();
            return;
          }
          if (kind === 'mcp-key') {
            resetApiKeyComposer();
            showKeyComposer(true);
            activateSection('keys-step');
            $('keyName')?.focus();
            return;
          }
          if (kind === 'pattern') {
            resetPatternEditor();
            showPatternEditor(true);
            activateSection('patterns-step');
            $('patternName')?.focus();
            return;
          }
          if (kind === 'connection') {
            activateSection('connections-step');
            openModal(connectionCreateModeModal);
          }
        }

        function resetLlmComposer() {
          state.llmComposerMode = 'create';
          state.llmEditKeyId = '';
          if ($('llmApiKey')) $('llmApiKey').value = '';
          if ($('llmKeyName')) $('llmKeyName').value = '';
          if ($('createLlmKey')) $('createLlmKey').textContent = 'Store OpenAI key';
        }

        function resetApiKeyComposer() {
          state.apiKeyComposerMode = 'create';
          state.apiKeyEditId = '';
          if ($('keyName')) $('keyName').value = '';
          if ($('keyConnIds')) $('keyConnIds').value = '';
          if ($('createKey')) $('createKey').textContent = 'Create access key';
          setSelectedConnectionScopeIds([]);
        }

        function resetPatternEditor() {
          state.patternEditorMode = 'create';
          state.patternEditId = '';
          ['patternId', 'patternName', 'patternUrls', 'patternSummary', 'patternSteps', 'patternIssues'].forEach((id) => {
            if ($(id)) $(id).value = '';
          });
          if ($('savePattern')) $('savePattern').textContent = 'Save pattern';
          if ($('deletePattern')) $('deletePattern').hidden = true;
        }

        function setSelectedConnectionScopeIds(connectionIds) {
          const selected = new Set(Array.isArray(connectionIds) ? connectionIds : []);
          if (!keyScopePicker) return;
          keyScopePicker.querySelectorAll('input[type="checkbox"]').forEach((input) => {
            const checked = selected.has(String(input.value || ''));
            input.checked = checked;
            input.closest('.scope-chip')?.classList.toggle('active', checked);
          });
          if ($('keyConnIds')) $('keyConnIds').value = Array.from(selected).join(', ');
        }

        function collectSelectedConnectionIds() {
          if (!keyScopePicker) return [];
          const ids = Array.from(keyScopePicker.querySelectorAll('input[type="checkbox"]:checked'))
            .map((input) => String(input.value || '').trim())
            .filter(Boolean);
          if ($('keyConnIds')) $('keyConnIds').value = ids.join(', ');
          return ids;
        }

        function describeConnectionScopes(connectionIds) {
          const ids = Array.isArray(connectionIds) ? connectionIds : [];
          if (!ids.length) return 'all connections';
          const names = ids.map((id) => {
            const connection = state.connections.find((entry) => entry.id === id);
            return connection?.name || connection?.baseHost || id;
          });
          return names.join(', ');
        }

        function renderConnectionScopePicker() {
          if (!keyScopePicker) return;
          if (!state.connections.length) {
            keyScopePicker.innerHTML = '<span class="connection-tag">All connections</span>';
            return;
          }
          keyScopePicker.innerHTML = state.connections.map((connection) => {
            const label = escapeHtml(connection.name || connection.baseHost || 'Unnamed connection');
            const id = escapeHtml(connection.id);
            return '<label class="scope-chip" data-scope-chip="' + id + '">' +
              '<input type="checkbox" value="' + id + '" />' + label + '</label>';
          }).join('');
          keyScopePicker.querySelectorAll('input[type="checkbox"]').forEach((input) => {
            input.addEventListener('change', () => {
              input.closest('.scope-chip')?.classList.toggle('active', input.checked);
              collectSelectedConnectionIds();
            });
          });
        }

        function renderLlmCards(keys) {
          state.llmKeys = Array.isArray(keys) ? keys : [];
          if (!llmCards) return;
          if (llmListActions) llmListActions.hidden = state.llmKeys.length === 0;
          if (!state.llmKeys.length) {
            llmCards.innerHTML = '<article class="empty-state-card"><span class="field-label">No OpenAI keys yet</span><strong>Add your first key</strong><p>Store an OpenAI API key for this account before starting runs.</p><div class="button-row"><button type="button" data-empty-action="new-llm-key" data-open-composer="llm">Add your first key</button></div></article>';
            return;
          }
          llmCards.innerHTML = state.llmKeys.map((key) => {
            const statusClass = key.revokedAt ? 'revoked' : (key.isActive ? 'active' : 'idle');
            const statusLabel = key.revokedAt ? 'revoked' : (key.isActive ? 'active' : 'stored');
            const actions = [];
            actions.push('<button class="secondary" type="button" data-llm-action="edit" data-llm-key-id="' + escapeHtml(key.id) + '">Edit</button>');
            if (!key.revokedAt && !key.isActive) {
              actions.push('<button class="secondary" type="button" data-llm-action="activate" data-llm-key-id="' + escapeHtml(key.id) + '">Activate</button>');
            }
            if (!key.revokedAt) {
              actions.push('<button class="danger" type="button" data-llm-action="revoke" data-llm-key-id="' + escapeHtml(key.id) + '">Delete</button>');
            }
            return '<article class="key-card">' +
              '<div class="key-card-head"><div><span class="field-label">OpenAI</span><strong>' + escapeHtml(key.name || 'Unnamed key') + '</strong></div><span class="status-pill ' + statusClass + '">' + statusLabel + '</span></div>' +
              '<div class="key-card-meta">' +
              '<div><strong>ID:</strong> ' + escapeHtml(key.id || '') + '</div>' +
              '<div><strong>Created:</strong> ' + escapeHtml(formatTimestamp(key.createdAt)) + '</div>' +
              '<div><strong>Last used:</strong> ' + escapeHtml(key.lastUsedAt ? formatTimestamp(key.lastUsedAt) : 'Never') + '</div>' +
              '</div>' +
              '<div class="key-card-actions">' + actions.join('') + '</div></article>';
          }).join('');
        }

        function renderApiKeyCards(keys) {
          state.apiKeys = Array.isArray(keys) ? keys : [];
          if (!apiKeyCards) return;
          if (apiKeyListActions) apiKeyListActions.hidden = state.apiKeys.length === 0;
          if (!state.apiKeys.length) {
            apiKeyCards.innerHTML = '<article class="empty-state-card"><span class="field-label">No access keys yet</span><strong>Create your first MCP key</strong><p>Issue a key for a client and scope it to connections.</p><div class="button-row"><button type="button" data-empty-action="new-api-key" data-open-composer="mcp-key">Create access key</button></div></article>';
            return;
          }
          apiKeyCards.innerHTML = state.apiKeys.map((key) => {
            const statusClass = key.revokedAt ? 'revoked' : 'active';
            const statusLabel = key.revokedAt ? 'revoked' : 'active';
            const actions = [];
            if (!key.revokedAt) {
              actions.push('<button class="secondary" type="button" data-api-key-action="edit" data-api-key-id="' + escapeHtml(key.id) + '">Edit</button>');
              actions.push('<button class="danger" type="button" data-api-key-action="revoke" data-api-key-id="' + escapeHtml(key.id) + '">Delete</button>');
            }
            return '<article class="key-card">' +
              '<div class="key-card-head"><div><span class="field-label">MCP key</span><strong>' + escapeHtml(key.name || 'Unnamed key') + '</strong></div><span class="status-pill ' + statusClass + '">' + statusLabel + '</span></div>' +
              '<div class="key-card-meta"><div><strong>ID:</strong> ' + escapeHtml(key.id || '') + '</div><div><strong>Scope:</strong> ' + escapeHtml(describeConnectionScopes(key.allowedConnectionIds)) + '</div></div>' +
              '<div class="key-card-actions">' + actions.join('') + '</div></article>';
          }).join('');
        }

        function renderConnectionsBoard(connections) {
          state.connections = Array.isArray(connections) ? connections : [];
          renderConnectionScopePicker();
          if (!connectionsBoard) return;
          if (!state.connections.length) {
            connectionsBoard.className = 'connection-board capture-history-empty';
            connectionsBoard.innerHTML = '<article class="empty-state-card"><span class="field-label">No connections yet</span><strong>Create your first connection</strong><p>Define allowed host boundary first.</p><div class="button-row"><button type="button" data-empty-action="new-connection" data-open-composer="connection">Create connection</button></div></article>';
            return;
          }
          connectionsBoard.className = 'connection-board';
          connectionsBoard.innerHTML = state.connections.map((connection) => {
            const active = connection.id === state.selectedConnectionId ? ' active' : '';
            return '<article class="connection-card' + active + '" data-connection-id="' + escapeHtml(connection.id) + '">' +
              '<div class="connection-card-head"><span class="connection-tag">' + escapeHtml(connection.status || 'active') + '</span></div>' +
              '<div><strong>' + escapeHtml(connection.name || 'Unnamed connection') + '</strong><div><code>' + escapeHtml(connection.baseHost || '') + '</code></div></div>' +
              '<div class="connection-card-actions"><button class="secondary" type="button" data-connection-edit="' + escapeHtml(connection.id) + '">Edit</button><button class="ghost" type="button" data-connection-capture="' + escapeHtml(connection.id) + '">Launch capture</button><button class="danger" type="button" data-connection-delete="' + escapeHtml(connection.id) + '">Delete</button></div>' +
              '</article>';
          }).join('');
        }

        function renderPatternCards(patterns) {
          state.patterns = Array.isArray(patterns) ? patterns : [];
          if (!patternCards) return;
          if (patternListActions) patternListActions.hidden = state.patterns.length === 0;
          if (!state.patterns.length) {
            patternCards.innerHTML = '<article class="empty-state-card"><span class="field-label">No patterns yet</span><strong>Write the first reusable guide</strong><p>Capture one workflow with working steps.</p><div class="button-row"><button type="button" data-empty-action="new-pattern" data-open-composer="pattern">New pattern</button></div></article>';
            return;
          }
          patternCards.innerHTML = state.patterns.map((pattern) => {
            const summary = escapeHtml((pattern.summary || '').slice(0, 160));
            return '<article class="key-card" data-pattern-id="' + escapeHtml(pattern.id) + '">' +
              '<div class="key-card-head"><div><span class="field-label">Pattern</span><strong>' + escapeHtml(pattern.name || 'Unnamed pattern') + '</strong></div><span class="status-pill idle">saved</span></div>' +
              '<div class="key-card-meta"><div><strong>Updated:</strong> ' + escapeHtml(formatTimestamp(pattern.updatedAt)) + '</div><div><strong>Summary:</strong> ' + summary + '</div></div>' +
              '<div class="key-card-actions"><button class="secondary" type="button" data-pattern-edit="' + escapeHtml(pattern.id) + '">Edit</button><button class="danger" type="button" data-pattern-delete="' + escapeHtml(pattern.id) + '">Delete</button></div>' +
              '</article>';
          }).join('');
        }

        function populateConnectionForm(connection) {
          if (!connection) return;
          state.selectedConnectionId = String(connection.id || '');
          if ($('patchConnId')) $('patchConnId').value = state.selectedConnectionId;
          if ($('secretConnId')) $('secretConnId').value = state.selectedConnectionId;
          if ($('connName')) $('connName').value = String(connection.name || '');
          if ($('connBaseHost')) $('connBaseHost').value = String(connection.baseHost || '');
          if ($('connHosts')) $('connHosts').value = Array.isArray(connection.allowedHosts) ? connection.allowedHosts.join(', ') : '';
          if ($('connPaths')) $('connPaths').value = Array.isArray(connection.allowedPathPrefixes) ? connection.allowedPathPrefixes.join(', ') : '';
          if ($('connAllowSubdomains')) $('connAllowSubdomains').checked = Boolean(connection.allowSubdomains);
          if ($('connAllowAnyPath')) $('connAllowAnyPath').checked = Boolean(connection.allowAnyPath);
          if ($('connAuthMethod')) $('connAuthMethod').value = String(connection.authMethod || 'oauth');
          if ($('patchConnStatus')) $('patchConnStatus').value = String(connection.status || 'active');
          if (selectedConnectionShell) selectedConnectionShell.classList.remove('empty');
          if (selectedConnectionName) selectedConnectionName.textContent = connection.name || 'Unnamed connection';
          if (selectedConnectionMeta) selectedConnectionMeta.innerHTML = '<span class="connection-tag">' + escapeHtml(connection.baseHost || '') + '</span>';
          showSurface(connectionComposer, true);
        }

        function populatePatternForm(pattern) {
          state.patternEditorMode = 'edit';
          state.patternEditId = String(pattern.id || '');
          if ($('patternId')) $('patternId').value = state.patternEditId;
          if ($('patternName')) $('patternName').value = String(pattern.name || '');
          if ($('patternUrls')) $('patternUrls').value = Array.isArray(pattern.urls) ? pattern.urls.join(', ') : '';
          if ($('patternSummary')) $('patternSummary').value = String(pattern.summary || '');
          if ($('patternSteps')) $('patternSteps').value = String(pattern.stepsMarkdown || '');
          if ($('patternIssues')) $('patternIssues').value = String(pattern.knownIssuesMarkdown || '');
          if ($('savePattern')) $('savePattern').textContent = 'Save pattern changes';
          if ($('deletePattern')) $('deletePattern').hidden = false;
          showPatternEditor(true);
        }

        async function loadSessionSummary() {
          const data = await api('/api/session/me');
          if (data.ok) {
            const user = data.body?.user || null;
            const session = data.body?.session || null;
            const sessionName = $('sessionName');
            const sessionEmail = $('sessionEmail');
            const sessionMeta = $('sessionMeta');
            if (sessionName) sessionName.textContent = user?.displayName || user?.name || (user?.email || 'Authenticated user').split('@')[0] || 'Authenticated user';
            if (sessionEmail) sessionEmail.textContent = user?.email || 'Authenticated account';
            if (sessionMeta) {
              const details = [];
              if (session?.createdAt) details.push('Session started ' + formatTimestamp(session.createdAt));
              if (session?.expiresAt) details.push('idle expiry ' + formatTimestamp(session.expiresAt));
              sessionMeta.textContent = details.length ? details.join(' · ') + '.' : 'Manage keys, connections, and runs for this account.';
            }
          } else if (data.status === 401) {
            window.location.href = '/sign-in';
          }
        }

        async function loadLlmKeys() {
          const data = await api('/api/llm-keys');
          if (data.ok) renderLlmCards(data.body?.llmKeys || []);
          print(out.llm, data);
          return data;
        }

        async function loadApiKeys() {
          const data = await api('/api/keys');
          if (data.ok) renderApiKeyCards(data.body?.apiKeys || []);
          print(out.keys, data);
          return data;
        }

        async function loadConnections() {
          const data = await api('/api/connections');
          if (data.ok) renderConnectionsBoard(data.body?.connections || []);
          print(out.conn, data);
          return data;
        }

        async function loadPatterns() {
          const data = await api('/api/orchestration-patterns');
          if (data.ok) renderPatternCards(data.body?.patterns || []);
          print(out.patterns, data);
          return data;
        }

        async function loadRuntimeSettings() {
          const data = await api('/api/settings/runtime');
          if (data.ok) {
            if ($('runtimeRetentionDays')) $('runtimeRetentionDays').value = data.body?.settings?.runRetentionDays ?? 30;
            if ($('runtimeZdrEnabled')) $('runtimeZdrEnabled').checked = Boolean(data.body?.settings?.zdrEnabled);
            if ($('runtimePersistEvents')) $('runtimePersistEvents').checked = Boolean(data.body?.settings?.persistRunEvents);
            if ($('runtimePersistOutput')) $('runtimePersistOutput').checked = Boolean(data.body?.settings?.persistRunOutput);
          }
          print(out.runtimeSettings, data);
          return data;
        }

        function renderRuns(data) {
          const container = $('runsHistoryOut');
          if (!container) return;
          const runs = Array.isArray(data?.body?.runs) ? data.body.runs : [];
          if (!runs.length) {
            container.className = 'capture-history-empty';
            container.innerHTML = 'No runs stored for this user.';
            return;
          }
          container.className = 'capture-history-list';
          container.innerHTML = runs.map((run) => {
            const status = escapeHtml(run.status || 'unknown').toLowerCase();
            return '<article class="capture-history-item">' +
              '<div class="capture-history-head"><div class="capture-history-id">' + escapeHtml(run.id || '') + '</div><span class="capture-badge ' + status + '">' + status + '</span></div>' +
              '<div class="capture-meta"><div><strong>Created:</strong> ' + escapeHtml(formatTimestamp(run.createdAt)) + '</div><div><strong>Task:</strong> ' + escapeHtml(run.input?.task || 'No task persisted') + '</div><div class="button-row"><button class="secondary" type="button" data-run-inspect="' + escapeHtml(run.id || '') + '">Inspect</button><button class="danger" type="button" data-run-delete="' + escapeHtml(run.id || '') + '">Delete</button></div></div>' +
              '</article>';
          }).join('');
        }

        async function loadRuns() {
          const data = await api('/api/runs');
          renderRuns(data);
          return data;
        }

        function setRunsSubview(view) {
          const settings = $('runSettingsView');
          const history = $('runHistoryView');
          const isHistory = view === 'history';
          showSurface(settings, !isHistory);
          showSurface(history, isHistory);
          $('runsSettingsTab')?.classList.toggle('active', !isHistory);
          $('runsHistoryTab')?.classList.toggle('active', isHistory);
        }

        function setConnectionsSubview(view) {
          const setup = $('connectionSetupView');
          const access = $('connectionAccessView');
          const isAccess = view === 'access';
          showSurface(setup, !isAccess);
          showSurface(access, isAccess);
        }

        function closeModal(modal) {
          if (modal) modal.hidden = true;
        }

        function openModal(modal) {
          if (modal) modal.hidden = false;
        }

        // Fallback global opener keeps create actions functional even if a later script section throws.
        window.__dashboardOpenComposer = openComposer;

        document.addEventListener('click', (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const source = target.closest('[data-open-composer]');
          if (!(source instanceof HTMLElement)) return;
          const kind = String(source.getAttribute('data-open-composer') || '').trim();
          if (!kind) return;
          event.preventDefault();
          event.stopPropagation();
          openComposer(kind);
        });

        navLinks.forEach((link) => {
          link.addEventListener('click', (event) => {
            event.preventDefault();
            const sectionId = link.getAttribute('data-step-link') || 'llm-step';
            activateSection(sectionId, true);
          });
        });

        window.addEventListener('popstate', () => {
          activateSection(sectionFromPath(window.location.pathname), false);
        });

        $('signOutButton')?.addEventListener('click', async () => {
          const data = await api('/api/session/logout', 'POST');
          if (data.ok) window.location.href = '/';
        });

        $('newLlmKey')?.addEventListener('click', () => {
          openComposer('llm');
        });

        llmCards?.addEventListener('click', async (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const source = target.closest('[data-empty-action], [data-llm-action]');
          if (!(source instanceof HTMLElement)) return;
          const emptyAction = source.getAttribute('data-empty-action');
          if (emptyAction === 'new-llm-key') {
            openComposer('llm');
            return;
          }

          const action = source.getAttribute('data-llm-action');
          const keyId = source.getAttribute('data-llm-key-id');
          const key = state.llmKeys.find((entry) => entry.id === keyId);
          if (!action || !key) return;

          if (action === 'edit') {
            state.llmComposerMode = 'edit';
            state.llmEditKeyId = key.id;
            if ($('llmProvider')) $('llmProvider').value = String(key.provider || 'openai');
            if ($('llmKeyName')) $('llmKeyName').value = String(key.name || '');
            if ($('llmApiKey')) $('llmApiKey').value = '';
            if ($('createLlmKey')) $('createLlmKey').textContent = 'Save key update';
            showLlmComposer(true);
            return;
          }

          if (action === 'activate') {
            const data = await api('/api/llm-keys/' + encodeURIComponent(key.id), 'PATCH', { isActive: true });
            print(out.llm, data);
            if (data.ok) await loadLlmKeys();
            return;
          }

          if (action === 'revoke') {
            const approved = window.confirm('Delete this stored OpenAI key? This action is irreversible.');
            if (!approved) return;
            const data = await api('/api/llm-keys/' + encodeURIComponent(key.id), 'DELETE');
            print(out.llm, data);
            if (data.ok) await loadLlmKeys();
          }
        });

        $('cancelLlmComposer')?.addEventListener('click', () => {
          resetLlmComposer();
          showLlmComposer(false);
        });

        $('createLlmKey')?.addEventListener('click', async () => {
          const modeBeforeSave = state.llmComposerMode;
          const name = requireText('llmKeyName', 'Key name');
          if (!name) return;
          const apiKeyValue = requireText('llmApiKey', 'OpenAI API key');
          if (!apiKeyValue) return;
          const data = state.llmComposerMode === 'edit' && state.llmEditKeyId
            ? await api('/api/llm-keys/' + encodeURIComponent(state.llmEditKeyId), 'PATCH', { name, apiKey: apiKeyValue, isActive: true })
            : await api('/api/llm-keys', 'POST', { provider: $('llmProvider')?.value || 'openai', name, apiKey: apiKeyValue, activate: true });
          print(out.llm, data);
          if (data.ok) {
            await loadLlmKeys();
            resetLlmComposer();
            showLlmComposer(false);
            setBanner('ok', modeBeforeSave === 'edit' ? 'OpenAI key updated.' : 'OpenAI key stored.');
          }
        });

        $('listLlmKeys')?.addEventListener('click', loadLlmKeys);

        $('newApiKey')?.addEventListener('click', () => {
          openComposer('mcp-key');
        });

        apiKeyCards?.addEventListener('click', async (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const source = target.closest('[data-empty-action], [data-api-key-action]');
          if (!(source instanceof HTMLElement)) return;
          const emptyAction = source.getAttribute('data-empty-action');
          if (emptyAction === 'new-api-key') {
            openComposer('mcp-key');
            return;
          }

          const action = source.getAttribute('data-api-key-action');
          const keyId = source.getAttribute('data-api-key-id');
          const key = state.apiKeys.find((entry) => entry.id === keyId);
          if (!action || !key) return;

          if (action === 'edit') {
            state.apiKeyComposerMode = 'edit';
            state.apiKeyEditId = key.id;
            if ($('keyName')) $('keyName').value = String(key.name || '');
            setSelectedConnectionScopeIds(key.allowedConnectionIds || []);
            if ($('createKey')) $('createKey').textContent = 'Save key changes';
            showKeyComposer(true);
            return;
          }

          if (action === 'revoke') {
            const approved = window.confirm('Delete this MCP access key? This action is irreversible.');
            if (!approved) return;
            const data = await api('/api/keys/' + encodeURIComponent(key.id), 'DELETE');
            print(out.keys, data);
            if (data.ok) await loadApiKeys();
          }
        });

        $('cancelKeyComposer')?.addEventListener('click', () => {
          resetApiKeyComposer();
          showKeyComposer(false);
        });

        $('createKey')?.addEventListener('click', async () => {
          const name = requireText('keyName', 'Key name');
          if (!name) return;
          const allowedConnectionIds = collectSelectedConnectionIds();
          const data = state.apiKeyComposerMode === 'edit' && state.apiKeyEditId
            ? await api('/api/keys/' + encodeURIComponent(state.apiKeyEditId), 'PATCH', { name, allowedConnectionIds })
            : await api('/api/keys', 'POST', { name, allowedConnectionIds });

          if (state.apiKeyComposerMode === 'edit') {
            print(out.keys, data);
            if (data.ok) {
              await loadApiKeys();
              resetApiKeyComposer();
              showKeyComposer(false);
              setBanner('ok', 'MCP access key updated.');
            }
            return;
          }

          if (data.ok && data.body?.secret) {
            if ($('oneTimeKeyServerUrl')) $('oneTimeKeyServerUrl').value = window.location.origin + '/mcp';
            if ($('oneTimeKeyValue')) $('oneTimeKeyValue').value = String(data.body.secret);
            const safe = { ...data, body: { ...data.body } };
            delete safe.body.secret;
            print(out.keys, safe);
            setBanner('ok', 'API key created. Copy and store the one-time key now.');
            resetApiKeyComposer();
            showKeyComposer(false);
            openModal(oneTimeKeyModal);
            await loadApiKeys();
            return;
          }

          print(out.keys, data);
        });

        $('listKeys')?.addEventListener('click', loadApiKeys);

        $('scopeSelectedConnection')?.addEventListener('click', () => {
          if (!state.selectedConnectionId) {
            setBanner('err', 'Select a connection in Connections first.');
            return;
          }
          setSelectedConnectionScopeIds([state.selectedConnectionId]);
          setBanner('ok', 'Scoped this key to selected connection.');
        });

        $('newPattern')?.addEventListener('click', () => {
          openComposer('pattern');
        });

        $('refreshPatterns')?.addEventListener('click', loadPatterns);
        $('listPatterns')?.addEventListener('click', loadPatterns);

        patternCards?.addEventListener('click', async (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const source = target.closest('[data-empty-action], [data-pattern-edit], [data-pattern-delete], [data-pattern-id]');
          if (!(source instanceof HTMLElement)) return;
          const emptyAction = source.getAttribute('data-empty-action');
          if (emptyAction === 'new-pattern') {
            openComposer('pattern');
            return;
          }

          const editId = source.getAttribute('data-pattern-edit');
          const deleteId = source.getAttribute('data-pattern-delete');
          const cardId = source.closest('[data-pattern-id]')?.getAttribute('data-pattern-id');
          const patternId = editId || deleteId || cardId;
          if (!patternId) return;
          const pattern = state.patterns.find((entry) => entry.id === patternId);
          if (!pattern) return;

          if (deleteId) {
            const approved = window.confirm('Delete this orchestration pattern? This action is irreversible.');
            if (!approved) return;
            const data = await api('/api/orchestration-patterns/' + encodeURIComponent(patternId), 'DELETE');
            print(out.patterns, data);
            if (data.ok) {
              await loadPatterns();
              resetPatternEditor();
              showPatternEditor(false);
            }
            return;
          }

          if (editId) {
            populatePatternForm(pattern);
          }
        });

        $('cancelPatternEditor')?.addEventListener('click', () => {
          resetPatternEditor();
          showPatternEditor(false);
        });

        $('savePattern')?.addEventListener('click', async () => {
          const name = requireText('patternName', 'Pattern name');
          if (!name) return;
          const stepsMarkdown = requireText('patternSteps', 'Stepwise guide');
          if (!stepsMarkdown) return;
          const patternId = state.patternEditorMode === 'edit' ? state.patternEditId : '';
          const payload = {
            name,
            summary: $('patternSummary')?.value?.trim() || '',
            urls: splitCsv($('patternUrls')?.value),
            stepsMarkdown,
            knownIssuesMarkdown: $('patternIssues')?.value?.trim() || '',
          };
          const data = patternId
            ? await api('/api/orchestration-patterns/' + encodeURIComponent(patternId), 'PATCH', payload)
            : await api('/api/orchestration-patterns', 'POST', payload);
          print(out.patterns, data);
          if (data.ok) {
            await loadPatterns();
            resetPatternEditor();
            showPatternEditor(false);
            setBanner('ok', patternId ? 'Pattern updated.' : 'Pattern created.');
          }
        });

        $('deletePattern')?.addEventListener('click', async () => {
          const patternId = String(state.patternEditId || $('patternId')?.value || '').trim();
          if (!patternId) {
            setBanner('err', 'Select a pattern card before deleting it.');
            return;
          }
          const approved = window.confirm('Delete this orchestration pattern? This action is irreversible.');
          if (!approved) return;
          const data = await api('/api/orchestration-patterns/' + encodeURIComponent(patternId), 'DELETE');
          print(out.patterns, data);
          if (data.ok) {
            await loadPatterns();
            resetPatternEditor();
            showPatternEditor(false);
          }
        });

        $('refreshConnections')?.addEventListener('click', loadConnections);

        $('newConnection')?.addEventListener('click', () => openComposer('connection'));
        $('cancelConnectionCreateMode')?.addEventListener('click', () => closeModal(connectionCreateModeModal));

        $('startGuidedConnectionCreate')?.addEventListener('click', () => {
          state.connectionCreateMode = 'guided';
          showSurface(connectionComposer, true);
          setConnectionsSubview('setup');
          closeModal(connectionCreateModeModal);
        });

        $('startManualConnectionCreate')?.addEventListener('click', () => {
          state.connectionCreateMode = 'manual';
          showSurface(connectionComposer, true);
          setConnectionsSubview('setup');
          closeModal(connectionCreateModeModal);
        });

        $('cancelConnectionComposer')?.addEventListener('click', () => {
          if ($('connName')) $('connName').value = '';
          if ($('connBaseHost')) $('connBaseHost').value = '';
          showSurface(connectionComposer, false);
        });

        connectionsBoard?.addEventListener('click', async (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const source = target.closest('[data-empty-action], [data-connection-edit], [data-connection-capture], [data-connection-delete], [data-connection-id]');
          if (!(source instanceof HTMLElement)) return;
          const emptyAction = source.getAttribute('data-empty-action');
          if (emptyAction === 'new-connection') {
            openComposer('connection');
            return;
          }

          const editId = source.getAttribute('data-connection-edit');
          const captureId = source.getAttribute('data-connection-capture');
          const deleteId = source.getAttribute('data-connection-delete');
          const cardId = source.closest('[data-connection-id]')?.getAttribute('data-connection-id');
          const connectionId = editId || captureId || deleteId || cardId;
          if (!connectionId) return;
          const connection = state.connections.find((entry) => entry.id === connectionId);

          if (deleteId) {
            const approved = window.confirm('Delete this connection and its artifacts? This action is irreversible.');
            if (!approved) return;
            const data = await api('/api/connections/' + encodeURIComponent(connectionId), 'DELETE');
            print(out.conn, data);
            if (data.ok) await loadConnections();
            return;
          }

          if (editId || cardId) {
            if (connection) populateConnectionForm(connection);
            return;
          }

          if (captureId) {
            if ($('secretConnId')) $('secretConnId').value = connectionId;
            if ($('captureStartUrl') && connection?.baseHost) {
              $('captureStartUrl').value = 'https://' + String(connection.baseHost || '');
            }
            setConnectionsSubview('access');
            const data = await api('/api/connections/' + encodeURIComponent(connectionId) + '/capture-sessions', 'POST', {
              startUrl: $('captureStartUrl')?.value?.trim() || undefined,
            });
            print(out.conn, data);
          }
        });

        $('createConn')?.addEventListener('click', async () => {
          const name = requireText('connName', 'Connection name');
          if (!name) return;
          const baseHost = requireText('connBaseHost', 'Base host');
          if (!baseHost) return;
          const data = await api('/api/connections', 'POST', {
            name,
            baseHost,
            allowedHosts: splitCsv($('connHosts')?.value),
            allowedPathPrefixes: splitCsv($('connPaths')?.value),
            allowSubdomains: Boolean($('connAllowSubdomains')?.checked),
            allowAnyPath: Boolean($('connAllowAnyPath')?.checked),
            authMethod: $('connAuthMethod')?.value || 'oauth',
          });
          print(out.conn, data);
          if (data.ok) {
            await loadConnections();
            showSurface(connectionComposer, false);
            if (state.connectionCreateMode === 'guided' && data.body?.connection?.id) {
              const connId = String(data.body.connection.id);
              if ($('secretConnId')) $('secretConnId').value = connId;
              setConnectionsSubview('access');
              await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions', 'POST', {
                startUrl: $('captureStartUrl')?.value?.trim() || undefined,
              });
            }
          }
        });

        $('patchConn')?.addEventListener('click', async () => {
          const id = String($('patchConnId')?.value || '').trim();
          if (!id) {
            setBanner('err', 'Select a connection card before editing it.');
            return;
          }
          const payload = {
            name: $('connName')?.value?.trim() || undefined,
            allowedHosts: splitCsv($('connHosts')?.value),
            allowedPathPrefixes: splitCsv($('connPaths')?.value),
            allowSubdomains: Boolean($('connAllowSubdomains')?.checked),
            allowAnyPath: Boolean($('connAllowAnyPath')?.checked),
            status: $('patchConnStatus')?.value || 'active',
          };
          const data = await api('/api/connections/' + encodeURIComponent(id), 'PATCH', payload);
          print(out.conn, data);
          if (data.ok) {
            await loadConnections();
            showSurface(connectionComposer, false);
          }
        });

        $('manageSelectedConnection')?.addEventListener('click', async () => {
          const connId = String(state.selectedConnectionId || $('secretConnId')?.value || '').trim();
          if (!connId) {
            setBanner('err', 'Select a connection first.');
            return;
          }
          setConnectionsSubview('access');
          await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions', 'POST', {
            startUrl: $('captureStartUrl')?.value?.trim() || undefined,
          });
        });

        async function runCaptureAction(payload) {
          const connId = requireText('secretConnId', 'Connection ID');
          if (!connId) return;
          const sessionId = requireText('captureSessionId', 'Capture session ID');
          if (!sessionId) return;
          const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId) + '/actions', 'POST', payload);
          print(out.conn, data);
        }

        $('startCapture')?.addEventListener('click', async () => {
          const connId = requireText('secretConnId', 'Connection ID');
          if (!connId) return;
          await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions', 'POST', {
            startUrl: $('captureStartUrl')?.value?.trim() || undefined,
          });
        });
        $('refreshCapture')?.addEventListener('click', async () => {
          const connId = requireText('secretConnId', 'Connection ID');
          if (!connId) return;
          const sessionId = requireText('captureSessionId', 'Capture session ID');
          if (!sessionId) return;
          const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId));
          print(out.conn, data);
        });
        $('captureNavigate')?.addEventListener('click', async () => {
          const url = requireText('captureNavigateUrl', 'Navigate URL');
          if (!url) return;
          await runCaptureAction({ actionType: 'navigate', url });
        });
        $('captureType')?.addEventListener('click', async () => {
          const text = requireText('captureTypeText', 'Type text');
          if (!text) return;
          await runCaptureAction({ actionType: 'type', text });
        });
        $('captureKey')?.addEventListener('click', async () => {
          const combo = requireText('captureKeypress', 'Keypress combo');
          if (!combo) return;
          await runCaptureAction({ actionType: 'keypress', keys: combo.split('+').map((v) => v.trim()).filter(Boolean) });
        });
        $('captureClickButton')?.addEventListener('click', async () => {
          const raw = requireText('captureClick', 'Click position');
          if (!raw) return;
          const [xRaw, yRaw] = raw.split(',').map((v) => v.trim());
          const x = Number(xRaw);
          const y = Number(yRaw);
          if (!Number.isFinite(x) || !Number.isFinite(y)) {
            setBanner('err', 'Click position must be x,y.');
            return;
          }
          await runCaptureAction({ actionType: 'click', x, y });
        });
        $('captureScrollButton')?.addEventListener('click', async () => {
          const deltaY = Number($('captureScrollY')?.value || 600);
          await runCaptureAction({ actionType: 'scroll', deltaY: Number.isFinite(deltaY) ? deltaY : 600 });
        });
        $('captureWaitButton')?.addEventListener('click', async () => {
          const ms = Number($('captureWaitMs')?.value || 1000);
          await runCaptureAction({ actionType: 'wait', ms: Number.isFinite(ms) ? ms : 1000 });
        });
        $('finalizeCapture')?.addEventListener('click', async () => {
          const connId = requireText('secretConnId', 'Connection ID');
          if (!connId) return;
          const sessionId = requireText('captureSessionId', 'Capture session ID');
          if (!sessionId) return;
          const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId) + '/finalize', 'POST', {
            expiresAt: $('authStateExpiresAt')?.value?.trim() || undefined,
          });
          print(out.conn, data);
        });
        $('cancelCapture')?.addEventListener('click', async () => {
          const connId = requireText('secretConnId', 'Connection ID');
          if (!connId) return;
          const sessionId = requireText('captureSessionId', 'Capture session ID');
          if (!sessionId) return;
          const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId), 'DELETE');
          print(out.conn, data);
        });

        $('loadRuntimeSettings')?.addEventListener('click', loadRuntimeSettings);

        $('runtimeZdrEnabled')?.addEventListener('change', () => {
          const zdr = Boolean($('runtimeZdrEnabled')?.checked);
          if ($('runtimePersistEvents')) {
            $('runtimePersistEvents').disabled = zdr;
            if (zdr) $('runtimePersistEvents').checked = false;
          }
          if ($('runtimePersistOutput')) {
            $('runtimePersistOutput').disabled = zdr;
            if (zdr) $('runtimePersistOutput').checked = false;
          }
        });

        $('saveRuntimeSettings')?.addEventListener('click', async () => {
          const runRetentionDays = Number($('runtimeRetentionDays')?.value || 30);
          if (!Number.isFinite(runRetentionDays) || runRetentionDays < 1 || runRetentionDays > 365) {
            setBanner('err', 'Run retention days must be between 1 and 365.');
            return;
          }
          const data = await api('/api/settings/runtime', 'PATCH', {
            runRetentionDays,
            zdrEnabled: Boolean($('runtimeZdrEnabled')?.checked),
            persistRunEvents: Boolean($('runtimePersistEvents')?.checked),
            persistRunOutput: Boolean($('runtimePersistOutput')?.checked),
          });
          print(out.runtimeSettings, data);
          if (data.ok) await loadRuntimeSettings();
        });

        $('runsSettingsTab')?.addEventListener('click', () => setRunsSubview('settings'));
        $('runsHistoryTab')?.addEventListener('click', async () => {
          setRunsSubview('history');
          await loadRuns();
        });
        $('listRuns')?.addEventListener('click', async () => {
          setRunsSubview('history');
          await loadRuns();
        });

        $('runsHistoryOut')?.addEventListener('click', async (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          const inspectId = target.getAttribute('data-run-inspect');
          const deleteId = target.getAttribute('data-run-delete');
          if (inspectId) {
            const data = await api('/api/runs/' + encodeURIComponent(inspectId));
            print(out.runDetail, data);
            if (data.ok) openModal(runDetailModal);
            return;
          }
          if (deleteId) {
            const approved = window.confirm('Delete this stored run? This action is irreversible.');
            if (!approved) return;
            const data = await api('/api/runs/' + encodeURIComponent(deleteId), 'DELETE');
            print(out.runDetail, data);
            if (data.ok) {
              closeModal(runDetailModal);
              await loadRuns();
            }
          }
        });

        $('closeRunDetailModal')?.addEventListener('click', () => closeModal(runDetailModal));

        $('copyOneTimeKey')?.addEventListener('click', async () => {
          const value = String($('oneTimeKeyValue')?.value || '');
          if (!value) return;
          try {
            await navigator.clipboard.writeText(value);
            setBanner('ok', 'API key copied to clipboard.');
          } catch {
            setBanner('err', 'Clipboard copy failed.');
          }
        });

        $('copyServerUrl')?.addEventListener('click', async () => {
          const value = String($('oneTimeKeyServerUrl')?.value || '');
          if (!value) return;
          try {
            await navigator.clipboard.writeText(value);
            setBanner('ok', 'Server URL copied to clipboard.');
          } catch {
            setBanner('err', 'Clipboard copy failed.');
          }
        });

        $('clearOneTimeKey')?.addEventListener('click', () => {
          if ($('oneTimeKeyValue')) $('oneTimeKeyValue').value = '';
          if ($('oneTimeKeyServerUrl')) $('oneTimeKeyServerUrl').value = '';
          closeModal(oneTimeKeyModal);
        });

        [oneTimeKeyModal, runDetailModal, connectionCreateModeModal].forEach((modal) => {
          modal?.addEventListener('click', (event) => {
            if (event.target === modal) closeModal(modal);
          });
        });

        const captureImage = $('captureImage');
        const captureMarker = $('captureMarker');
        const captureSelectionText = $('captureSelectionText');
        captureImage?.addEventListener('click', (event) => {
          const rect = captureImage.getBoundingClientRect();
          if (!rect.width || !rect.height || !captureImage.naturalWidth || !captureImage.naturalHeight) return;
          const offsetX = event.clientX - rect.left;
          const offsetY = event.clientY - rect.top;
          const x = Math.max(0, Math.min(captureImage.naturalWidth, Math.round((offsetX / rect.width) * captureImage.naturalWidth)));
          const y = Math.max(0, Math.min(captureImage.naturalHeight, Math.round((offsetY / rect.height) * captureImage.naturalHeight)));
          if ($('captureClick')) $('captureClick').value = x + ',' + y;
          if (captureMarker) {
            captureMarker.style.left = offsetX + 'px';
            captureMarker.style.top = offsetY + 'px';
            captureMarker.style.display = 'block';
          }
          if (captureSelectionText) captureSelectionText.textContent = 'Selected ' + x + ',' + y;
        });

        const initialSection = ${initial};
        const initialComposer = ${composer};
        activateSection(initialSection || sectionFromPath(window.location.pathname), false);
        setRunsSubview('history');
        setConnectionsSubview('setup');

        showLlmComposer(false);
        showKeyComposer(false);
        showPatternEditor(false);
        showSurface(connectionComposer, false);

        if (initialComposer === 'llm') {
          resetLlmComposer();
          showLlmComposer(true);
        }
        if (initialComposer === 'mcp-key') {
          resetApiKeyComposer();
          showKeyComposer(true);
        }
        if (initialComposer === 'pattern') {
          resetPatternEditor();
          showPatternEditor(true);
        }
        if (initialComposer === 'connection') {
          openModal(connectionCreateModeModal);
        }

        loadSessionSummary();
        loadLlmKeys();
        loadApiKeys();
        loadConnections();
        loadPatterns();
        loadRuntimeSettings();
        loadRuns();

        window.setInterval(() => {
          loadSessionSummary();
        }, 30000);
      })();
    </script>
  `;
}
