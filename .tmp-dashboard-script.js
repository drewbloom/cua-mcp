
      const $ = (id) => document.getElementById(id);
      const out = {
        session: $('sessionOut'),
        llm: $('llmOut'),
        keys: $('keysOut'),
        conn: $('connOut'),
        patterns: $('patternsOut'),
        secret: $('secretOut'),
        capture: $('captureOut'),
        captureHistory: $('captureHistoryOut'),
        runtimeSettings: $('runtimeSettingsOut'),
        runsHistory: $('runsHistoryOut'),
        runDetail: $('runDetailOut'),
      };
      const banner = $('banner');
      const toastStack = $('toastStack');
      const captureImage = $('captureImage');
      const captureMarker = $('captureMarker');
      const captureSelectionText = $('captureSelectionText');
      const captureSummary = $('captureSummary');
      const connectionsBoard = $('connectionsBoard');
      const selectedConnectionShell = $('selectedConnectionShell');
      const selectedConnectionName = $('selectedConnectionName');
      const selectedConnectionMeta = $('selectedConnectionMeta');
      const sessionName = $('sessionName');
      const sessionEmail = $('sessionEmail');
      const sessionMeta = $('sessionMeta');
      const signOutButton = $('signOutButton');
      const llmCards = $('llmCards');
      const apiKeyCards = $('apiKeyCards');
      const patternCards = $('patternCards');
      const selectedPatternShell = $('selectedPatternShell');
      const selectedPatternName = $('selectedPatternName');
      const selectedPatternMeta = $('selectedPatternMeta');
      const llmComposer = $('llmComposer');
      const keyComposer = $('keyComposer');
      const patternEditor = $('patternEditor');
      const patternListActions = $('patternListActions');
      const llmListActions = $('llmListActions');
      const apiKeyListActions = $('apiKeyListActions');
      const keyScopePicker = $('keyScopePicker');
      const oneTimeKeyModal = $('oneTimeKeyModal');
      const runDetailModal = $('runDetailModal');
      const connectionCreateModeModal = $('connectionCreateModeModal');
      const connectionComposer = $('connectionComposer');
      const connectionSetupView = $('connectionSetupView');
      const connectionAccessView = $('connectionAccessView');
      const runSettingsView = $('runSettingsView');
      const runHistoryView = $('runHistoryView');
      const sections = Array.from(document.querySelectorAll('[data-reveal]'));
      const navLinks = Array.from(document.querySelectorAll('[data-step-link]'));
      const state = {
        connections: [],
        selectedConnectionId: '',
        llmKeys: [],
        apiKeys: [],
        patterns: [],
        selectedPatternId: '',
        currentUser: null,
        currentSession: null,
        llmComposerMode: 'create',
        llmEditKeyId: '',
        apiKeyComposerMode: 'create',
        apiKeyEditId: '',
        patternEditorMode: 'create',
        patternEditId: '',
        connectionCreateMode: 'guided',
        connectionsSubview: 'setup',
        runsSubview: 'history',
      };

      const DASHBOARD_ROUTE_BY_SECTION = {
        'llm-step': '/dashboard/llm-api-keys',
        'connections-step': '/dashboard/connections',
        'patterns-step': '/dashboard/patterns',
        'runs-step': '/dashboard/runs-privacy',
        'keys-step': '/dashboard/mcp-access-keys',
      };

      const DASHBOARD_SECTION_BY_ROUTE = {
        '/dashboard': 'llm-step',
        '/dashboard/': 'llm-step',
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
        requestAnimationFrame(() => {
          toast.classList.add('show');
        });
        window.setTimeout(() => {
          toast.classList.remove('show');
          window.setTimeout(() => toast.remove(), 180);
        }, kind === 'err' ? 4200 : 2600);
      }

      function setBanner(kind, message, options = {}) {
        banner.className = 'banner ' + (kind || '');
        banner.textContent = message;
        if (options.toast !== false) {
          showToast(kind, message);
        }
      }

      function looksLikeFeatureDisabled(status, body) {
        if (status !== 404) return false;
        const msg = String(body?.error || body?.raw || '').toLowerCase();
        return msg.includes('not found') || msg.includes('disabled') || msg.includes('feature');
      }

      function redact(value) {
        if (Array.isArray(value)) return value.map(redact);
        if (!value || typeof value !== 'object') return value;

        const outObj = {};
        for (const [k, v] of Object.entries(value)) {
          const key = String(k).toLowerCase();
          if (key.includes('secret') || key.includes('password') || key.includes('code') || key.includes('token') || key.includes('cookie')) {
            outObj[k] = '[redacted]';
          } else {
            outObj[k] = redact(v);
          }
        }
        return outObj;
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

      function requireEmail(id) {
        const value = requireText(id, 'Email');
        if (!value) return null;
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!ok) {
          setBanner('err', 'Enter a valid email address.');
          $(id)?.focus();
          return null;
        }
        return value;
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
            if (looksLikeFeatureDisabled(res.status, parsed)) {
              setBanner('err', 'This route is disabled on the server. Enable the matching backend feature flag before using this step.');
            } else {
              setBanner('err', String(parsed?.message || parsed?.error || ('Request failed (' + res.status + ').')));
            }
            return { ok: false, status: res.status, body: parsed };
          }
          return { ok: true, status: res.status, body: parsed };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error || 'Unknown network error');
          setBanner('err', 'Request failed before a response was received. ' + message);
          return { ok: false, status: 0, body: { error: message } };
        }
      }

      function splitCsv(raw) {
        return String(raw || '').split(',').map(v => v.trim()).filter(Boolean);
      }

      function showSurface(element, show) {
        if (!element) return;
        element.hidden = !show;
      }

      function openModal(element) {
        if (!element) return;
        element.hidden = false;
      }

      function closeModal(element) {
        if (!element) return;
        element.hidden = true;
      }

      function setConnectionsSubview(view) {
        state.connectionsSubview = view === 'access' ? 'access' : 'setup';
        showSurface(connectionSetupView, state.connectionsSubview === 'setup');
        showSurface(connectionAccessView, state.connectionsSubview === 'access');
        $('connectionsSetupTab')?.classList.toggle('active', state.connectionsSubview === 'setup');
        $('connectionsAccessTab')?.classList.toggle('active', state.connectionsSubview === 'access');
      }

      function setRunsSubview(view) {
        state.runsSubview = view === 'history' ? 'history' : 'settings';
        showSurface(runSettingsView, state.runsSubview === 'settings');
        showSurface(runHistoryView, state.runsSubview === 'history');
        $('runsSettingsTab')?.classList.toggle('active', state.runsSubview === 'settings');
        $('runsHistoryTab')?.classList.toggle('active', state.runsSubview === 'history');
      }

      function showLlmComposer(show) {
        if (!llmCards) return;
        showSurface(llmComposer, show);
        showSurface(llmCards, !show);
        if (llmListActions) {
          llmListActions.hidden = show || state.llmKeys.length === 0;
        }
      }

      function showKeyComposer(show) {
        if (!apiKeyCards) return;
        showSurface(keyComposer, show);
        showSurface(apiKeyCards, !show);
        if (apiKeyListActions) {
          apiKeyListActions.hidden = show || state.apiKeys.length === 0;
        }
      }

      function showPatternEditor(show) {
        if (!patternCards) return;
        showSurface(patternEditor, show);
        showSurface(patternCards, !show);
        if (patternListActions) {
          patternListActions.hidden = show || state.patterns.length === 0;
        }
      }

      function openConnectionCreateModeDialog() {
        openModal(connectionCreateModeModal);
      }

      function applyStepGateForLlmKeys() {
        const llmReady = state.llmKeys.length > 0;
        navLinks.forEach((link) => {
          const stepId = link.getAttribute('data-step-link');
          const shouldHide = !llmReady && stepId !== 'llm-step';
          link.hidden = shouldHide;
        });
        if (!llmReady && getSectionIdFromPathname(window.location.pathname) !== 'llm-step') {
          activateSection('llm-step');
        }
      }

      function truncateText(value, limit = 180) {
        const text = String(value || '').trim();
        if (!text) return '';
        return text.length > limit ? text.slice(0, limit - 1) + '…' : text;
      }

      function setActiveConnectionId(connectionId) {
        const value = String(connectionId || '').trim();
        if (!value) return;
        $('secretConnId').value = value;
        $('patchConnId').value = value;
        state.selectedConnectionId = value;
      }

      function clearConnectionSelection() {
        $('patchConnId').value = '';
        $('secretConnId').value = '';
        state.selectedConnectionId = '';
        selectedConnectionShell.classList.add('empty');
        selectedConnectionName.textContent = 'No connection selected';
        selectedConnectionMeta.innerHTML = '<span class="connection-tag">Create or choose a connection card, then launch capture when it needs browser access.</span>';
        setConnectionsSubview('setup');
      }

      function clearConnectionForm() {
        $('connName').value = '';
        $('connBaseHost').value = '';
        $('connHosts').value = '';
        $('connPaths').value = '';
        $('connAllowSubdomains').checked = false;
        $('connAllowAnyPath').checked = false;
        $('connAuthMethod').value = 'oauth';
        $('patchConnStatus').value = 'active';
        clearConnectionSelection();
        showSurface(connectionComposer, false);
      }

      function resetLlmComposer() {
        state.llmComposerMode = 'create';
        state.llmEditKeyId = '';
        $('llmApiKey').value = '';
        $('llmKeyName').value = '';
        $('createLlmKey').textContent = 'Store OpenAI key';
      }

      function resetApiKeyComposer() {
        state.apiKeyComposerMode = 'create';
        state.apiKeyEditId = '';
        $('keyName').value = '';
        setSelectedConnectionScopeIds([]);
        $('createKey').textContent = 'Create access key';
      }

      function resetPatternEditor() {
        state.patternEditorMode = 'create';
        state.patternEditId = '';
        $('patternId').value = '';
        $('patternName').value = '';
        $('patternUrls').value = '';
        $('patternSummary').value = '';
        $('patternSteps').value = '';
        $('patternIssues').value = '';
        $('savePattern').textContent = 'Save pattern';
        $('deletePattern').hidden = true;
      }

      function setActivePatternId(patternId) {
        const value = String(patternId || '').trim();
        $('patternId').value = value;
        state.selectedPatternId = value;
      }

      function clearPatternSelection() {
        setActivePatternId('');
        if (!selectedPatternShell || !selectedPatternName || !selectedPatternMeta) return;
        selectedPatternShell.classList.add('empty');
        selectedPatternName.textContent = 'No pattern selected';
        selectedPatternMeta.innerHTML = '<span class="connection-tag">Create or choose a pattern card to edit the learned guide it contributes to future runs.</span>';
      }

      function clearPatternForm() {
        resetPatternEditor();
        showPatternEditor(false);
      }

      function describeConnectionScopes(connectionIds) {
        const ids = Array.isArray(connectionIds) ? connectionIds : [];
        if (!ids.length) {
          return 'all connections';
        }
        const names = ids.map((id) => {
          const connection = state.connections.find((entry) => entry.id === id);
          return connection?.name || connection?.baseHost || id;
        });
        return names.join(', ');
      }

      function collectSelectedConnectionIds() {
        if (!keyScopePicker) return [];
        const ids = Array.from(keyScopePicker.querySelectorAll('input[type="checkbox"]:checked'))
          .map((input) => String(input.value || '').trim())
          .filter(Boolean);
        $('keyConnIds').value = ids.join(', ');
        return ids;
      }

      function setSelectedConnectionScopeIds(connectionIds) {
        const selected = new Set(Array.isArray(connectionIds) ? connectionIds : []);
        if (!keyScopePicker) return;
        Array.from(keyScopePicker.querySelectorAll('input[type="checkbox"]')).forEach((input) => {
          const checked = selected.has(String(input.value || ''));
          input.checked = checked;
          input.closest('.scope-chip')?.classList.toggle('active', checked);
        });
        $('keyConnIds').value = Array.from(selected).join(', ');
      }

      function renderConnectionScopePicker() {
        if (!keyScopePicker) return;
        if (!state.connections.length) {
          keyScopePicker.innerHTML = '<span class="connection-tag">All connections</span><span class="micro-copy">Create a connection first if you need to scope this key.</span>';
          $('keyConnIds').value = '';
          return;
        }

        keyScopePicker.innerHTML = state.connections.map((connection) => {
          const label = escapeHtml(connection.name || connection.baseHost || 'Unnamed connection');
          const id = escapeAttr(connection.id);
          return '<label class="scope-chip" data-scope-chip="' + id + '">' +
            '<input type="checkbox" value="' + id + '" />' +
            label +
          '</label>';
        }).join('');

        Array.from(keyScopePicker.querySelectorAll('input[type="checkbox"]')).forEach((input) => {
          input.addEventListener('change', () => {
            input.closest('.scope-chip')?.classList.toggle('active', input.checked);
            collectSelectedConnectionIds();
          });
        });
      }

      function getFaviconUrl(baseHost) {
        const host = String(baseHost || '').trim();
        if (!host) return '';
        return 'https://' + host + '/favicon.ico';
      }

      function renderSelectedConnection(connection) {
        if (!connection) {
          clearConnectionSelection();
          return;
        }

        selectedConnectionShell.classList.remove('empty');
        selectedConnectionName.textContent = connection.name || 'Unnamed connection';
        selectedConnectionMeta.innerHTML = [
          '<span class="connection-tag">' + escapeHtml(connection.status || 'active') + '</span>',
          '<span class="connection-tag">' + escapeHtml(connection.authMethod || 'oauth') + '</span>',
          '<code>' + escapeHtml(connection.baseHost || '') + '</code>',
          '<span class="connection-tag">subdomains ' + (connection.allowSubdomains ? 'on' : 'off') + '</span>',
          '<span class="connection-tag">any path ' + (connection.allowAnyPath ? 'on' : 'off') + '</span>'
        ].join('');
      }

      function populateConnectionForm(connection) {
        if (!connection) return;
        $('connName').value = String(connection.name || '');
        $('connBaseHost').value = String(connection.baseHost || '');
        $('connHosts').value = Array.isArray(connection.allowedHosts)
          ? connection.allowedHosts.filter((host) => host !== connection.baseHost).join(', ')
          : '';
        $('connPaths').value = Array.isArray(connection.allowedPathPrefixes)
          ? connection.allowedPathPrefixes.join(', ')
          : '';
        $('connAllowSubdomains').checked = Boolean(connection.allowSubdomains);
        $('connAllowAnyPath').checked = Boolean(connection.allowAnyPath);
        $('connAuthMethod').value = String(connection.authMethod || 'oauth');
        $('patchConnStatus').value = String(connection.status || 'active');
        setActiveConnectionId(connection.id);
        renderSelectedConnection(connection);
        showSurface(connectionComposer, true);
      }

      function renderSelectedPattern(pattern) {
        if (!pattern) {
          clearPatternSelection();
          return;
        }

        selectedPatternShell.classList.remove('empty');
        selectedPatternName.textContent = pattern.name || 'Unnamed pattern';
        const urlCount = Array.isArray(pattern.urls) ? pattern.urls.length : 0;
        selectedPatternMeta.innerHTML = [
          '<span class="connection-tag">' + urlCount + ' url' + (urlCount === 1 ? '' : 's') + '</span>',
          '<span class="connection-tag">updated ' + escapeHtml(formatTimestamp(pattern.updatedAt)) + '</span>',
          pattern.summary ? '<span class="connection-tag">' + escapeHtml(truncateText(pattern.summary, 120)) + '</span>' : '<span class="connection-tag">No summary yet</span>'
        ].join('');
      }

      function populatePatternForm(pattern) {
        if (!pattern) return;
        state.patternEditorMode = 'edit';
        state.patternEditId = String(pattern.id || '');
        $('patternName').value = String(pattern.name || '');
        $('patternUrls').value = Array.isArray(pattern.urls) ? pattern.urls.join(', ') : '';
        $('patternSummary').value = String(pattern.summary || '');
        $('patternSteps').value = String(pattern.stepsMarkdown || '');
        $('patternIssues').value = String(pattern.knownIssuesMarkdown || '');
        setActivePatternId(pattern.id);
        $('savePattern').textContent = 'Save pattern changes';
        $('deletePattern').hidden = false;
        renderSelectedPattern(pattern);
        showPatternEditor(true);
      }

      function renderConnectionsBoard(connections) {
        state.connections = Array.isArray(connections) ? connections : [];
        renderConnectionScopePicker();
        if (!state.connections.length) {
          connectionsBoard.className = 'connection-board capture-history-empty';
          connectionsBoard.innerHTML = '<article class="empty-state-card"><span class="field-label">No connections yet</span><strong>Create your first connection</strong><p>Define the allowed host boundary first. Guided capture comes after the connection exists.</p><div class="button-row"><button type="button" data-empty-action="new-connection">Create connection</button></div></article>';
          if (!state.selectedConnectionId) {
            renderSelectedConnection(null);
          }
          return;
        }

        connectionsBoard.className = 'connection-board';
        connectionsBoard.innerHTML = state.connections.map((connection) => {
          const active = connection.id === state.selectedConnectionId ? ' active' : '';
          const faviconUrl = getFaviconUrl(connection.baseHost);
          const initial = escapeHtml((connection.name || connection.baseHost || '?').slice(0, 1).toUpperCase());
          return '<article class="connection-card' + active + '" data-connection-id="' + escapeHtml(connection.id) + '">' +
            '<div class="connection-card-head">' +
              '<div class="connection-favicon">' +
                (faviconUrl
                  ? '<img src="' + escapeHtml(faviconUrl) + '" alt="" loading="lazy" onerror="this.remove(); this.parentNode.textContent=\'' + initial + '\';" />'
                  : initial) +
              '</div>' +
              '<span class="connection-tag">' + escapeHtml(connection.status || 'active') + '</span>' +
            '</div>' +
            '<div class="connection-card-body">' +
              '<strong>' + escapeHtml(connection.name || 'Unnamed connection') + '</strong>' +
              '<code>' + escapeHtml(connection.baseHost || '') + '</code>' +
              '<div class="connection-card-tags">' +
                '<span class="connection-tag">' + escapeHtml(connection.authMethod || 'oauth') + '</span>' +
                '<span class="connection-tag">subdomains ' + (connection.allowSubdomains ? 'on' : 'off') + '</span>' +
                '<span class="connection-tag">any path ' + (connection.allowAnyPath ? 'on' : 'off') + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="connection-card-actions">' +
              '<button class="secondary" type="button" data-connection-edit="' + escapeHtml(connection.id) + '">Edit</button>' +
              '<button class="ghost" type="button" data-connection-capture="' + escapeHtml(connection.id) + '">Launch capture</button>' +
              '<button class="danger" type="button" data-connection-delete="' + escapeHtml(connection.id) + '">Delete</button>' +
            '</div>' +
          '</article>';
        }).join('');
      }

      function renderPatternCards(patterns) {
        state.patterns = Array.isArray(patterns) ? patterns : [];
        if (!patternCards) return;
        if (patternListActions) {
          patternListActions.hidden = state.patterns.length === 0;
        }
        if (!state.patterns.length) {
          patternCards.innerHTML = '<article class="empty-state-card"><span class="field-label">No patterns yet</span><strong>Write the first reusable guide</strong><p>Capture one workflow with real URLs, working steps, and the issues that usually require steering.</p><div class="button-row"><button type="button" data-empty-action="new-pattern">New pattern</button></div></article>';
          if (!state.selectedPatternId) {
            renderSelectedPattern(null);
          }
          return;
        }

        patternCards.innerHTML = state.patterns.map((pattern) => {
          const active = pattern.id === state.selectedPatternId ? ' active' : '';
          const summary = truncateText(pattern.summary || pattern.stepsMarkdown || 'No summary yet.', 180);
          const urlCount = Array.isArray(pattern.urls) ? pattern.urls.length : 0;
          const issueState = pattern.knownIssuesMarkdown ? 'Issues tracked' : 'No issues logged';
          return '<article class="key-card' + active + '" data-pattern-id="' + escapeAttr(pattern.id) + '">' +
            '<div class="key-card-head">' +
              '<div>' +
                '<span class="field-label">Pattern</span>' +
                '<strong>' + escapeHtml(pattern.name || 'Unnamed pattern') + '</strong>' +
              '</div>' +
              '<span class="status-pill idle">saved</span>' +
            '</div>' +
            '<div class="key-card-meta">' +
              '<div><strong>Updated:</strong> ' + escapeHtml(formatTimestamp(pattern.updatedAt)) + '</div>' +
              '<div><strong>URLs:</strong> ' + escapeHtml(String(urlCount)) + '</div>' +
              '<div><strong>Notes:</strong> ' + escapeHtml(issueState) + '</div>' +
              '<div><strong>Summary:</strong> ' + escapeHtml(summary) + '</div>' +
            '</div>' +
            '<div class="key-card-actions">' +
              '<button class="secondary" type="button" data-pattern-edit="' + escapeAttr(pattern.id) + '">Edit</button>' +
              '<button class="danger" type="button" data-pattern-delete="' + escapeAttr(pattern.id) + '">Delete</button>' +
            '</div>' +
          '</article>';
        }).join('');
      }

      function selectConnectionById(connectionId, options = {}) {
        const connection = state.connections.find((entry) => entry.id === connectionId);
        if (!connection) return;
        populateConnectionForm(connection);
        renderConnectionsBoard(state.connections);
        if (options.loadArtifacts) {
          setConnectionsSubview('access');
          refreshConnectionArtifacts();
        } else {
          setConnectionsSubview('setup');
        }
      }

      function selectPatternById(patternId, options = {}) {
        const pattern = state.patterns.find((entry) => entry.id === patternId);
        if (!pattern) return;
        setActivePatternId(pattern.id);
        renderSelectedPattern(pattern);
        renderPatternCards(state.patterns);
        if (options.openEditor) {
          populatePatternForm(pattern);
        }
      }

      function getDefaultCaptureStartUrl(connection) {
        const host = String(connection?.baseHost || '').trim();
        return host ? 'https://' + host : '';
      }

      async function launchGuidedCaptureForConnection(connectionId) {
        const connection = state.connections.find((entry) => entry.id === connectionId);
        if (!connection) {
          setBanner('err', 'Select a connection first.');
          return;
        }

        setActiveConnectionId(connection.id);
        renderSelectedConnection(connection);
        setConnectionsSubview('access');
        $('captureStartUrl').value = $('captureStartUrl').value.trim() || getDefaultCaptureStartUrl(connection);

        const data = await api('/api/connections/' + encodeURIComponent(connection.id) + '/capture-sessions', 'POST', {
          startUrl: $('captureStartUrl').value.trim() || undefined,
        });
        renderCapture(data);
        if (data.ok) {
          await refreshCaptureHistory();
          setBanner('ok', 'Guided capture started for ' + (connection.name || connection.baseHost || 'this connection') + '.');
        }
      }

      function detectAuthStateType(parsed) {
        if (!parsed || typeof parsed !== 'object') return null;
        const hasOrigins = Array.isArray(parsed.origins);
        const hasCookiesArray = Array.isArray(parsed.cookies);
        if (hasOrigins || hasCookiesArray) {
          return 'playwright_storage_state_json';
        }
        if (Array.isArray(parsed)) {
          return 'cookie_bundle_json';
        }
        if (Array.isArray(parsed.cookies)) {
          return 'cookie_bundle_json';
        }
        return null;
      }

      async function readSelectedAuthStateFile() {
        const input = $('authStateFile');
        const file = input?.files?.[0];
        if (!file) {
          setBanner('err', 'Select a JSON auth state file first.');
          input?.focus();
          return null;
        }
        const text = await file.text();
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          setBanner('err', 'Selected file is not valid JSON.');
          return null;
        }
        return {
          filename: file.name,
          text,
          parsed,
          detectedType: detectAuthStateType(parsed),
        };
      }

      function print(target, data) {
        if (!target) return;
        target.textContent = JSON.stringify(redact(data), null, 2);
      }

      function escapeHtml(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function formatTimestamp(value) {
        if (!value) return 'Unknown time';
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString();
      }

      function escapeAttr(value) {
        return escapeHtml(value);
      }

      async function copyText(value, successMessage) {
        try {
          await navigator.clipboard.writeText(String(value || ''));
          setBanner('ok', successMessage);
        } catch {
          setBanner('err', 'Clipboard copy failed. Copy manually.');
        }
      }

      function setSessionSummary(user, session) {
        state.currentUser = user || null;
        state.currentSession = session || null;
        if (!sessionName || !sessionEmail || !sessionMeta) return;
        if (!user) {
          sessionName.textContent = 'Not signed in';
          sessionEmail.textContent = 'Return to the sign-in flow to continue.';
          sessionMeta.textContent = 'This dashboard requires an active session.';
          return;
        }

        const displayName = String(
          user.displayName
          || user.name
          || user.fullName
          || (typeof user.email === 'string' && user.email.includes('@')
            ? user.email.split('@')[0]
            : user.email)
          || 'Authenticated user'
        ).trim();

        sessionName.textContent = displayName || 'Authenticated user';
        sessionEmail.textContent = user.email || 'Authenticated account';
        const details = [];
        if (session?.createdAt) {
          details.push('Session started ' + formatTimestamp(session.createdAt));
        }
        if (session?.expiresAt) {
          details.push('idle expiry ' + formatTimestamp(session.expiresAt));
        }
        if (user.createdAt) {
          details.push('account created ' + formatTimestamp(user.createdAt));
        }
        sessionMeta.textContent = details.length
          ? details.join(' · ') + '.'
          : 'Manage keys, connections, and runs for this account.';
      }

      async function loadSessionSummary() {
        const data = await api('/api/session/me');
        if (data.ok) {
          setSessionSummary(data.body?.user || null, data.body?.session || null);
        } else if (data.status === 401) {
          setSessionSummary(null, null);
          window.location.href = '/sign-in';
        } else {
          sessionName.textContent = 'Session unavailable';
          sessionEmail.textContent = 'Could not load account details.';
          sessionMeta.textContent = 'Reload this page after sign-in to restore account context.';
        }
        print(out.session, data);
        return data;
      }

      function renderLlmCards(keys) {
        state.llmKeys = Array.isArray(keys) ? keys : [];
        if (!llmCards) return;
        applyStepGateForLlmKeys();
        if (llmListActions) {
          llmListActions.hidden = state.llmKeys.length === 0;
        }
        if (!state.llmKeys.length) {
          llmCards.innerHTML = '<article class="empty-state-card"><span class="field-label">No OpenAI keys yet</span><strong>Add your first key</strong><p>Store an OpenAI API key for this account before starting runs.</p><div class="button-row"><button type="button" data-empty-action="new-llm-key">Add your first key</button></div></article>';
          return;
        }

        llmCards.innerHTML = state.llmKeys.map((key) => {
          const statusClass = key.revokedAt ? 'revoked' : (key.isActive ? 'active' : 'idle');
          const statusLabel = key.revokedAt ? 'revoked' : (key.isActive ? 'active' : 'stored');
          const actions = [];
          actions.push('<button class="secondary" type="button" data-llm-action="edit" data-llm-key-id="' + escapeAttr(key.id) + '">Edit</button>');
          if (!key.revokedAt && !key.isActive) {
            actions.push('<button class="secondary" type="button" data-llm-action="activate" data-llm-key-id="' + escapeAttr(key.id) + '">Activate</button>');
          }
          if (!key.revokedAt) {
            actions.push('<button class="danger" type="button" data-llm-action="revoke" data-llm-key-id="' + escapeAttr(key.id) + '">Delete</button>');
          }
          const providerLabel = String(key.provider || 'openai').toLowerCase() === 'openai' ? 'OpenAI' : String(key.provider || 'LLM');
          return '<article class="key-card">' +
            '<div class="key-card-head">' +
              '<div>' +
                '<span class="field-label">' + escapeHtml(providerLabel) + '</span>' +
                '<strong>' + escapeHtml(key.name || 'Unnamed key') + '</strong>' +
              '</div>' +
              '<span class="status-pill ' + statusClass + '">' + statusLabel + '</span>' +
            '</div>' +
            '<div class="key-card-meta">' +
              '<div><strong>ID:</strong> ' + escapeHtml(key.id || '') + '</div>' +
              '<div><strong>Version:</strong> ' + escapeHtml(key.keyVersion || 'unknown') + '</div>' +
              '<div><strong>Created:</strong> ' + escapeHtml(formatTimestamp(key.createdAt)) + '</div>' +
              '<div><strong>Last used:</strong> ' + escapeHtml(key.lastUsedAt ? formatTimestamp(key.lastUsedAt) : 'Never') + '</div>' +
            '</div>' +
            '<div class="key-card-actions">' + actions.join('') + '</div>' +
          '</article>';
        }).join('');
      }

      async function loadLlmKeys() {
        const data = await api('/api/llm-keys');
        if (data.ok) {
          renderLlmCards(data.body?.llmKeys || []);
        }
        print(out.llm, data);
        return data;
      }

      function renderApiKeyCards(keys) {
        state.apiKeys = Array.isArray(keys) ? keys : [];
        if (!apiKeyCards) return;
        if (apiKeyListActions) {
          apiKeyListActions.hidden = state.apiKeys.length === 0;
        }
        if (!state.apiKeys.length) {
          apiKeyCards.innerHTML = '<article class="empty-state-card"><span class="field-label">No access keys yet</span><strong>Create your first MCP key</strong><p>Issue a key for a client and scope it to the connections it should be able to reach.</p><div class="button-row"><button type="button" data-empty-action="new-api-key">Create access key</button></div></article>';
          return;
        }

        apiKeyCards.innerHTML = state.apiKeys.map((key) => {
          const scopeLabel = describeConnectionScopes(key.allowedConnectionIds);
          const statusClass = key.revokedAt ? 'revoked' : 'active';
          const statusLabel = key.revokedAt ? 'revoked' : 'active';
          const actions = [];
          if (!key.revokedAt) {
            actions.push('<button class="secondary" type="button" data-api-key-action="edit" data-api-key-id="' + escapeAttr(key.id) + '">Edit</button>');
            actions.push('<button class="danger" type="button" data-api-key-action="revoke" data-api-key-id="' + escapeAttr(key.id) + '">Delete</button>');
          }
          return '<article class="key-card">' +
            '<div class="key-card-head">' +
              '<div>' +
                '<span class="field-label">MCP key</span>' +
                '<strong>' + escapeHtml(key.name || 'Unnamed key') + '</strong>' +
              '</div>' +
              '<span class="status-pill ' + statusClass + '">' + statusLabel + '</span>' +
            '</div>' +
            '<div class="key-card-meta">' +
              '<div><strong>ID:</strong> ' + escapeHtml(key.id || '') + '</div>' +
              '<div><strong>Prefix:</strong> ' + escapeHtml(key.keyPrefix || '') + '</div>' +
              '<div><strong>Scope:</strong> ' + escapeHtml(scopeLabel) + '</div>' +
              '<div><strong>Created:</strong> ' + escapeHtml(formatTimestamp(key.createdAt)) + '</div>' +
              '<div><strong>Last used:</strong> ' + escapeHtml(key.lastUsedAt ? formatTimestamp(key.lastUsedAt) : 'Never') + '</div>' +
            '</div>' +
            '<div class="key-card-actions">' + actions.join('') + '</div>' +
          '</article>';
        }).join('');
      }

      async function loadApiKeys() {
        const data = await api('/api/keys');
        if (data.ok) {
          renderApiKeyCards(data.body?.apiKeys || []);
        }
        print(out.keys, data);
        return data;
      }

      async function loadPatterns() {
        const data = await api('/api/orchestration-patterns');
        if (data.ok) {
          const patterns = data.body?.patterns || [];
          renderPatternCards(patterns);
          if (state.selectedPatternId) {
            const stillExists = patterns.some((entry) => entry.id === state.selectedPatternId);
            if (stillExists) {
              selectPatternById(state.selectedPatternId);
            } else {
              clearPatternForm();
            }
          }
        }
        print(out.patterns, data);
        return data;
      }

      async function confirmAndLogout() {
        setBanner('ok', 'Signing out.', { toast: true });
        const data = await api('/api/session/logout', 'POST');
        print(out.session, data);
        if (data.ok) {
          window.location.href = '/';
        }
      }

      function renderCaptureHistory(data) {
        const body = data?.body || {};
        const captures = Array.isArray(body.captures) ? body.captures : [];
        if (!captures.length) {
          out.captureHistory.className = 'capture-history-empty';
          out.captureHistory.innerHTML = 'No capture sessions yet for this connection.';
          return;
        }

        out.captureHistory.className = 'capture-history-list';
        out.captureHistory.innerHTML = captures.map((capture) => {
          const status = escapeHtml(capture.status || 'unknown').toLowerCase();
          const currentUrl = escapeHtml(capture.currentUrl || 'about:blank');
          const title = escapeHtml(capture.title || 'Untitled page');
          const endedReason = capture.endedReason ? '<div><strong>Ended:</strong> ' + escapeHtml(capture.endedReason) + '</div>' : '';
          const lastError = capture.lastError ? '<div><strong>Last error:</strong> ' + escapeHtml(capture.lastError) + '</div>' : '';
          return '<article class="capture-history-item">' +
            '<div class="capture-history-head">' +
              '<div class="capture-history-id">' + escapeHtml(capture.sessionId || '') + '</div>' +
              '<span class="capture-badge ' + status + '">' + status + '</span>' +
            '</div>' +
            '<div class="capture-meta">' +
              '<div><strong>Updated:</strong> ' + escapeHtml(formatTimestamp(capture.updatedAt)) + '</div>' +
              '<div><strong>Page:</strong> ' + title + '</div>' +
              '<div><strong>URL:</strong> ' + currentUrl + '</div>' +
              endedReason +
              lastError +
            '</div>' +
          '</article>';
        }).join('');
      }

      function applyRuntimeSettings(settings) {
        $('runtimeRetentionDays').value = settings?.runRetentionDays ?? 30;
        $('runtimeZdrEnabled').checked = Boolean(settings?.zdrEnabled);
        $('runtimePersistEvents').checked = Boolean(settings?.persistRunEvents);
        $('runtimePersistOutput').checked = Boolean(settings?.persistRunOutput);
      }

      function syncRuntimeCheckboxes() {
        const zdrEnabled = $('runtimeZdrEnabled').checked;
        $('runtimePersistEvents').disabled = zdrEnabled;
        $('runtimePersistOutput').disabled = zdrEnabled;
        if (zdrEnabled) {
          $('runtimePersistEvents').checked = false;
          $('runtimePersistOutput').checked = false;
        }
      }

      function renderRuns(data) {
        const body = data?.body || {};
        const runs = Array.isArray(body.runs) ? body.runs : [];
        if (!runs.length) {
          out.runsHistory.className = 'capture-history-empty';
          out.runsHistory.innerHTML = 'No runs stored for this user.';
          return;
        }

        out.runsHistory.className = 'capture-history-list';
        out.runsHistory.innerHTML = runs.map((run) => {
          const status = escapeHtml(run.status || 'unknown').toLowerCase();
          const task = escapeHtml(run.input?.task || 'No task persisted');
          const connectionId = escapeHtml(run.input?.connectionId || 'none');
          const summary = escapeHtml(run.outputSummary || run.error || 'No summary persisted');
          return '<article class="capture-history-item">' +
            '<div class="capture-history-head">' +
              '<div class="capture-history-id">' + escapeHtml(run.id || '') + '</div>' +
              '<span class="capture-badge ' + status + '">' + status + '</span>' +
            '</div>' +
            '<div class="capture-meta">' +
              '<div><strong>Created:</strong> ' + escapeHtml(formatTimestamp(run.createdAt)) + '</div>' +
              '<div><strong>Updated:</strong> ' + escapeHtml(formatTimestamp(run.updatedAt)) + '</div>' +
              '<div><strong>Connection:</strong> ' + connectionId + '</div>' +
              '<div><strong>Task:</strong> ' + task + '</div>' +
              '<div><strong>Summary:</strong> ' + summary + '</div>' +
              '<div class="button-row"><button class="secondary" type="button" data-run-inspect="' + escapeAttr(run.id || '') + '">Inspect</button><button class="danger" type="button" data-run-delete="' + escapeAttr(run.id || '') + '">Delete</button></div>' +
            '</div>' +
          '</article>';
        }).join('');
      }

      async function loadRuntimeSettings() {
        const data = await api('/api/settings/runtime');
        if (data.ok) {
          applyRuntimeSettings(data.body?.settings || {});
          syncRuntimeCheckboxes();
        }
        print(out.runtimeSettings, data);
        return data;
      }

      async function loadRuns() {
        const data = await api('/api/runs');
        renderRuns(data);
        return data;
      }

      function renderCaptureSummary(data) {
        const body = data?.body || {};
        const authState = body.authState || null;
        const connection = body.connection || null;
        const capture = body.capture || null;

        if (!authState && !connection && !capture) {
          captureSummary.className = 'capture-summary empty';
          captureSummary.textContent = 'Finalize a capture to see which auth artifacts were saved and which hosts or paths were discovered.';
          return;
        }

        const hosts = Array.isArray(connection?.allowedHosts) ? connection.allowedHosts : [];
        const paths = Array.isArray(connection?.allowedPathPrefixes) ? connection.allowedPathPrefixes : [];
        const allowSubdomains = connection?.allowSubdomains ? 'enabled' : 'disabled';
        const allowAnyPath = connection?.allowAnyPath ? 'enabled' : 'disabled';
        captureSummary.className = 'capture-summary';
        captureSummary.innerHTML =
          '<div class="capture-summary-grid">' +
            '<div class="capture-summary-card"><span>Connection</span><strong>' + escapeHtml(connection?.name || connection?.id || 'Updated') + '</strong></div>' +
            '<div class="capture-summary-card"><span>Auth state</span><strong>' + escapeHtml(authState?.stateType || 'Stored') + '</strong></div>' +
            '<div class="capture-summary-card"><span>Capture status</span><strong>' + escapeHtml(capture?.status || 'Completed') + '</strong></div>' +
          '</div>' +
          '<ol class="capture-summary-list">' +
            '<li>Saved auth artifact: <strong>' + escapeHtml(authState?.id || 'created') + '</strong></li>' +
            '<li>Allowed hosts now include: <strong>' + escapeHtml(hosts.slice(0, 5).join(', ') || 'none recorded') + '</strong></li>' +
            '<li>Allowed path prefixes now include: <strong>' + escapeHtml(paths.slice(0, 5).join(', ') || 'none recorded') + '</strong></li>' +
            '<li>Policy toggles: <strong>subdomains ' + escapeHtml(allowSubdomains) + ', any-path ' + escapeHtml(allowAnyPath) + '</strong></li>' +
          '</ol>';
      }

      function renderCapture(data) {
        const snapshot = data?.body?.capture || data?.capture || null;
        if (!snapshot) {
          print(out.capture, data);
          return;
        }
        const frame = $('captureFrame');
        const emptyText = $('captureEmptyText');
        if (snapshot.screenshotDataUrl) {
          captureImage.src = snapshot.screenshotDataUrl;
          captureImage.style.display = 'block';
          frame.classList.remove('empty');
          if (emptyText) emptyText.style.display = 'none';
        } else {
          captureImage.removeAttribute('src');
          captureImage.style.display = 'none';
          frame.classList.add('empty');
          if (emptyText) emptyText.style.display = 'block';
          captureMarker.style.display = 'none';
          captureSelectionText.textContent = 'No coordinate selected';
        }
        $('captureSessionId').value = snapshot.sessionId || '';
        $('captureStartUrl').value = snapshot.currentUrl || $('captureStartUrl').value;
        print(out.capture, data);
      }

      async function refreshCaptureHistory() {
        const connId = String($('secretConnId')?.value || '').trim();
        if (!connId) return null;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions?limit=10');
        renderCaptureHistory(data);
        return data;
      }

      async function refreshConnectionArtifacts() {
        const connId = String($('secretConnId')?.value || '').trim();
        if (!connId) return;
        const [secrets, authStates, connections, captures] = await Promise.all([
          api('/api/connections/' + encodeURIComponent(connId) + '/secrets'),
          api('/api/connections/' + encodeURIComponent(connId) + '/auth-states'),
          api('/api/connections'),
          api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions?limit=10'),
        ]);
        if (connections.ok && Array.isArray(connections.body?.connections)) {
          renderConnectionsBoard(connections.body.connections);
        }
        print(out.secret, {
          secrets: secrets.body,
          authStates: authStates.body,
        });
        print(out.conn, connections);
        renderCaptureHistory(captures);
      }

      async function loadConnections() {
        const data = await api('/api/connections');
        if (data.ok && Array.isArray(data.body?.connections)) {
          renderConnectionsBoard(data.body.connections);
          if (state.selectedConnectionId) {
            const stillExists = data.body.connections.some((entry) => entry.id === state.selectedConnectionId);
            if (stillExists) {
              selectConnectionById(state.selectedConnectionId, { loadArtifacts: state.connectionsSubview === 'access' });
            } else {
              clearConnectionSelection();
            }
          }
        }
        print(out.conn, data);
        return data;
      }

      captureImage.addEventListener('click', (event) => {
        const rect = captureImage.getBoundingClientRect();
        if (!rect.width || !rect.height || !captureImage.naturalWidth || !captureImage.naturalHeight) {
          setBanner('err', 'Capture image is not ready for coordinate selection yet.');
          return;
        }

        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        const x = Math.max(0, Math.min(captureImage.naturalWidth, Math.round((offsetX / rect.width) * captureImage.naturalWidth)));
        const y = Math.max(0, Math.min(captureImage.naturalHeight, Math.round((offsetY / rect.height) * captureImage.naturalHeight)));

        $('captureClick').value = x + ',' + y;
        captureMarker.style.left = offsetX + 'px';
        captureMarker.style.top = offsetY + 'px';
        captureMarker.style.display = 'block';
        captureSelectionText.textContent = 'Selected ' + x + ',' + y;
        setBanner('ok', 'Capture click position selected from screenshot.');
      });

      function updateActiveSection(activeId) {
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('data-step-link') === activeId);
        });
      }

      function getSectionIdFromPathname(pathname) {
        const normalized = String(pathname || '/dashboard').replace(/\/+$/, '') || '/dashboard';
        return DASHBOARD_SECTION_BY_ROUTE[normalized] || 'llm-step';
      }

      function getRouteForSection(sectionId) {
        return DASHBOARD_ROUTE_BY_SECTION[sectionId] || '/dashboard/llm-api-keys';
      }

      function activateSection(activeId, syncRoute = true, shouldScroll = true) {
        const fallback = sections[0];
        const section = sections.find((entry) => entry.id === activeId) || fallback;
        const resolvedId = section?.id || '';

        sections.forEach((entry) => {
          const isActive = entry.id === resolvedId;
          entry.hidden = !isActive;
          entry.classList.toggle('active-panel', isActive);
          entry.classList.toggle('in-view', isActive);
        });

        updateActiveSection(resolvedId);

        if (syncRoute && resolvedId) {
          const nextPath = getRouteForSection(resolvedId);
          if (window.location.pathname !== nextPath) {
            history.pushState(null, '', nextPath);
          }
        }

        if (shouldScroll && section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      navLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          activateSection(link.getAttribute('data-step-link') || 'llm-step');
        });
      });

      window.addEventListener('popstate', () => {
        activateSection(getSectionIdFromPathname(window.location.pathname), false, false);
      });

      if (signOutButton) {
        signOutButton.addEventListener('click', () => {
          confirmAndLogout();
        });
      }

      if (llmCards) {
        llmCards.addEventListener('click', async (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          const emptyAction = target.getAttribute('data-empty-action');
          if (emptyAction === 'new-llm-key') {
            showLlmComposer(true);
            return;
          }
          const action = target.getAttribute('data-llm-action');
          const keyId = target.getAttribute('data-llm-key-id');
          if (!action || !keyId) return;
          const key = state.llmKeys.find((entry) => entry.id === keyId);
          if (!key) return;
          if (action === 'edit') {
            state.llmComposerMode = 'edit';
            state.llmEditKeyId = keyId;
            $('llmProvider').value = String(key.provider || 'openai');
            $('llmKeyName').value = String(key.name || '');
            $('llmApiKey').value = '';
            $('createLlmKey').textContent = 'Save key update';
            showLlmComposer(true);
            setBanner('ok', 'Update the name and/or key value, then save.');
            return;
          }
          if (action === 'activate') {
            const data = await api('/api/llm-keys/' + encodeURIComponent(keyId), 'PATCH', { isActive: true });
            print(out.llm, data);
            if (data.ok) {
              await loadLlmKeys();
            }
            return;
          }
          if (action === 'revoke') {
            const approved = window.confirm('Delete this stored OpenAI key? This action is irreversible.');
            if (!approved) return;
            const data = await api('/api/llm-keys/' + encodeURIComponent(keyId), 'DELETE');
            print(out.llm, data);
            if (data.ok) {
              await loadLlmKeys();
            }
          }
        });
      }

      if (apiKeyCards) {
        apiKeyCards.addEventListener('click', async (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          const emptyAction = target.getAttribute('data-empty-action');
          if (emptyAction === 'new-api-key') {
            resetApiKeyComposer();
            showKeyComposer(true);
            activateSection('keys-step');
            return;
          }
          const action = target.getAttribute('data-api-key-action');
          const keyId = target.getAttribute('data-api-key-id');
          if (!action || !keyId) return;
          const key = state.apiKeys.find((entry) => entry.id === keyId);
          if (!key) return;
          if (action === 'edit') {
            state.apiKeyComposerMode = 'edit';
            state.apiKeyEditId = keyId;
            $('keyName').value = String(key.name || '');
            setSelectedConnectionScopeIds(key.allowedConnectionIds || []);
            $('createKey').textContent = 'Save key changes';
            showKeyComposer(true);
            activateSection('keys-step');
            setBanner('ok', 'Edit key metadata and scope, then save changes.');
            return;
          }
          if (action === 'revoke') {
            const approved = window.confirm('Delete this MCP access key? This action is irreversible.');
            if (!approved) return;
            const data = await api('/api/keys/' + encodeURIComponent(keyId), 'DELETE');
            print(out.keys, data);
            if (data.ok) {
              await loadApiKeys();
            }
          }
        });
      }

      if (patternCards) {
        patternCards.addEventListener('click', async (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          const emptyAction = target.getAttribute('data-empty-action');
          if (emptyAction === 'new-pattern') {
            resetPatternEditor();
            showPatternEditor(true);
            return;
          }
          const editId = target.getAttribute('data-pattern-edit');
          const deleteId = target.getAttribute('data-pattern-delete');
          const cardId = target.closest('[data-pattern-id]')?.getAttribute('data-pattern-id');
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
              if (state.selectedPatternId === patternId) {
                clearPatternSelection();
              }
              clearPatternForm();
              await loadPatterns();
              setBanner('ok', 'Pattern deleted.');
            }
            return;
          }
          if (editId) {
            selectPatternById(patternId, { openEditor: true });
            return;
          }
          selectPatternById(patternId, { openEditor: false });
        });
      }

      connectionsBoard.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const emptyAction = target.getAttribute('data-empty-action');
        if (emptyAction === 'new-connection') {
          openConnectionCreateModeDialog();
          return;
        }
        const editId = target.getAttribute('data-connection-edit');
        const captureId = target.getAttribute('data-connection-capture');
        const deleteId = target.getAttribute('data-connection-delete');
        const cardId = target.closest('[data-connection-id]')?.getAttribute('data-connection-id');
        const connectionId = editId || captureId || deleteId || cardId;
        if (!connectionId) return;
        if (deleteId) {
          const approved = window.confirm('Delete this connection and its stored artifacts? This action is irreversible.');
          if (!approved) return;
          const data = await api('/api/connections/' + encodeURIComponent(connectionId), 'DELETE');
          print(out.conn, data);
          if (data.ok) {
            if (state.selectedConnectionId === connectionId) {
              clearConnectionSelection();
            }
            await loadConnections();
            setConnectionsSubview('setup');
          }
          return;
        }
        if (captureId) {
          await launchGuidedCaptureForConnection(connectionId);
          return;
        }
        selectConnectionById(connectionId, { loadArtifacts: false });
      });

      activateSection(getSectionIdFromPathname(window.location.pathname), false, false);
      setConnectionsSubview('setup');
      setRunsSubview('history');
      showLlmComposer(false);
      showKeyComposer(false);
      showPatternEditor(false);
      showSurface(connectionComposer, false);
      syncRuntimeCheckboxes();
      loadSessionSummary();
      loadLlmKeys();
      loadApiKeys();
      loadConnections();
      loadPatterns();
      loadRuntimeSettings();
      loadRuns();

      $('newLlmKey').onclick = () => {
        resetLlmComposer();
        showLlmComposer(true);
      };

      $('cancelLlmComposer').onclick = () => {
        resetLlmComposer();
        showLlmComposer(false);
      };

      $('createLlmKey').onclick = async () => {
        const modeBeforeSave = state.llmComposerMode;
        const name = requireText('llmKeyName', 'Key name');
        if (!name) return;
        const apiKeyValue = requireText('llmApiKey', 'OpenAI API key');
        if (!apiKeyValue) return;
        const data = state.llmComposerMode === 'edit' && state.llmEditKeyId
          ? await api('/api/llm-keys/' + encodeURIComponent(state.llmEditKeyId), 'PATCH', {
              name,
              apiKey: apiKeyValue,
              isActive: true,
            })
          : await api('/api/llm-keys', 'POST', {
              provider: $('llmProvider').value,
              name,
              apiKey: apiKeyValue,
              activate: true,
            });
        print(out.llm, data);
        if (data.ok) {
          await loadLlmKeys();
          resetLlmComposer();
          showLlmComposer(false);
          setBanner('ok', modeBeforeSave === 'edit' ? 'OpenAI key updated.' : 'OpenAI key stored.');
        }
      };

      $('listLlmKeys').onclick = loadLlmKeys;

      $('newApiKey').onclick = () => {
        resetApiKeyComposer();
        showKeyComposer(true);
      };

      $('cancelKeyComposer').onclick = () => {
        resetApiKeyComposer();
        showKeyComposer(false);
      };

      $('createKey').onclick = async () => {
        const name = requireText('keyName', 'Key name');
        if (!name) return;
        const allowedConnectionIds = collectSelectedConnectionIds();
        const data = state.apiKeyComposerMode === 'edit' && state.apiKeyEditId
          ? await api('/api/keys/' + encodeURIComponent(state.apiKeyEditId), 'PATCH', {
              name,
              allowedConnectionIds,
            })
          : await api('/api/keys', 'POST', {
              name,
              allowedConnectionIds,
            });

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
          $('oneTimeKeyServerUrl').value = window.location.origin + '/mcp';
          $('oneTimeKeyValue').value = String(data.body.secret);
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
      };

      $('copyOneTimeKey').onclick = async () => {
        const value = String($('oneTimeKeyValue').value || '');
        if (!value) {
          setBanner('err', 'No one-time key to copy.');
          return;
        }
        await copyText(value, 'API key copied to clipboard.');
      };

      $('copyServerUrl').onclick = async () => {
        const value = String($('oneTimeKeyServerUrl').value || '');
        if (!value) {
          setBanner('err', 'No server URL to copy.');
          return;
        }
        await copyText(value, 'Server URL copied to clipboard.');
      };

      $('clearOneTimeKey').onclick = () => {
        $('oneTimeKeyValue').value = '';
        $('oneTimeKeyServerUrl').value = '';
        closeModal(oneTimeKeyModal);
        setBanner('ok', 'One-time key cleared from screen.');
      };

      $('listKeys').onclick = loadApiKeys;
      $('scopeSelectedConnection').onclick = () => {
        const connectionId = String(state.selectedConnectionId || '').trim();
        if (!connectionId) {
          setBanner('err', 'Select a connection in the Connections tab first.');
          return;
        }
        setSelectedConnectionScopeIds([connectionId]);
        setBanner('ok', 'Scoped this key to the selected connection.');
      };

      $('refreshPatterns').onclick = loadPatterns;
      $('listPatterns').onclick = loadPatterns;
      $('newPattern').onclick = () => {
        resetPatternEditor();
        showPatternEditor(true);
        setBanner('ok', 'Pattern editor ready for a new pattern.');
      };

      $('cancelPatternEditor').onclick = () => {
        clearPatternForm();
      };

      $('savePattern').onclick = async () => {
        const name = requireText('patternName', 'Pattern name');
        if (!name) return;
        const stepsMarkdown = requireText('patternSteps', 'Stepwise guide');
        if (!stepsMarkdown) return;
        const patternId = state.patternEditorMode === 'edit'
          ? String(state.patternEditId || '').trim()
          : '';
        const payload = {
          name,
          summary: $('patternSummary').value.trim(),
          urls: splitCsv($('patternUrls').value),
          stepsMarkdown,
          knownIssuesMarkdown: $('patternIssues').value.trim(),
        };
        const data = patternId
          ? await api('/api/orchestration-patterns/' + encodeURIComponent(patternId), 'PATCH', payload)
          : await api('/api/orchestration-patterns', 'POST', payload);
        print(out.patterns, data);
        if (data.ok) {
          const nextId = data.body?.pattern?.id || patternId;
          await loadPatterns();
          if (nextId) {
            selectPatternById(nextId, { openEditor: false });
          }
          clearPatternForm();
          setBanner('ok', patternId ? 'Pattern updated.' : 'Pattern created.');
        }
      };
      $('deletePattern').onclick = async () => {
        const patternId = String(state.patternEditId || $('patternId').value || '').trim();
        if (!patternId) {
          setBanner('err', 'Select a pattern card before deleting it.');
          return;
        }
        const approved = window.confirm('Delete this orchestration pattern? This action is irreversible.');
        if (!approved) return;
        const data = await api('/api/orchestration-patterns/' + encodeURIComponent(patternId), 'DELETE');
        print(out.patterns, data);
        if (data.ok) {
          clearPatternForm();
          await loadPatterns();
          setBanner('ok', 'Pattern deleted.');
        }
      };

      $('connectionsSetupTab').onclick = () => {
        setConnectionsSubview('setup');
      };

      $('connectionsAccessTab').onclick = async () => {
        if (!state.selectedConnectionId) {
          setBanner('err', 'Select a connection first.');
          return;
        }
        setConnectionsSubview('access');
        await refreshConnectionArtifacts();
      };

      $('refreshConnections').onclick = loadConnections;
      $('manageSelectedConnection').onclick = async () => {
        if (!state.selectedConnectionId) {
          setBanner('err', 'Select a connection first.');
          return;
        }
        await launchGuidedCaptureForConnection(state.selectedConnectionId);
      };

      $('cancelConnectionCreateMode').onclick = () => {
        closeModal(connectionCreateModeModal);
      };

      $('startGuidedConnectionCreate').onclick = () => {
        state.connectionCreateMode = 'guided';
        clearConnectionForm();
        showSurface(connectionComposer, true);
        setConnectionsSubview('setup');
        closeModal(connectionCreateModeModal);
        setBanner('ok', 'Create the connection boundary, then guided capture starts automatically.');
      };

      $('startManualConnectionCreate').onclick = () => {
        state.connectionCreateMode = 'manual';
        clearConnectionForm();
        showSurface(connectionComposer, true);
        setConnectionsSubview('setup');
        closeModal(connectionCreateModeModal);
        setBanner('ok', 'Manual connection setup selected.');
      };

      $('newConnection').onclick = () => {
        openConnectionCreateModeDialog();
      };

      $('cancelConnectionComposer').onclick = () => {
        clearConnectionForm();
      };

      $('createConn').onclick = async () => {
        const name = requireText('connName', 'Connection name');
        if (!name) return;
        const baseHost = requireText('connBaseHost', 'Base host');
        if (!baseHost) return;
        const data = await api('/api/connections', 'POST', {
          name,
          baseHost,
          allowedHosts: splitCsv($('connHosts').value),
          allowedPathPrefixes: splitCsv($('connPaths').value),
          allowSubdomains: $('connAllowSubdomains').checked,
          allowAnyPath: $('connAllowAnyPath').checked,
          authMethod: $('connAuthMethod').value,
        });
        if (data.ok) {
          setActiveConnectionId(data.body?.connection?.id);
          await loadConnections();
          selectConnectionById(data.body?.connection?.id, { loadArtifacts: false });
          showSurface(connectionComposer, false);
          if (state.connectionCreateMode === 'guided' && data.body?.connection?.id) {
            await launchGuidedCaptureForConnection(data.body.connection.id);
          }
        }
        print(out.conn, data);
      };

      $('patchConn').onclick = async () => {
        const id = String($('patchConnId').value || '').trim();
        if (!id) {
          setBanner('err', 'Select a connection card before editing it.');
          return;
        }
        if (!id) return;
        const payload = {
          name: $('connName').value.trim() || undefined,
          allowSubdomains: $('connAllowSubdomains').checked,
          allowAnyPath: $('connAllowAnyPath').checked,
          status: $('patchConnStatus').value,
        };
        const allowedHosts = splitCsv($('connHosts').value);
        const allowedPathPrefixes = splitCsv($('connPaths').value);
        if (allowedHosts.length > 0) payload.allowedHosts = allowedHosts;
        if (allowedPathPrefixes.length > 0) payload.allowedPathPrefixes = allowedPathPrefixes;
        const data = await api('/api/connections/' + encodeURIComponent(id), 'PATCH', payload);
        if (data.ok) {
          setActiveConnectionId(id);
          await loadConnections();
          selectConnectionById(id, { loadArtifacts: false });
          setConnectionsSubview('setup');
          showSurface(connectionComposer, false);
        }
        print(out.conn, data);
      };

      $('loadConnArtifacts').onclick = async () => {
        const connId = String($('secretConnId').value || '').trim();
        if (!connId) {
          setBanner('err', 'Choose a connection card before loading its access artifacts.');
          return;
        }
        if (!connId) return;
        setActiveConnectionId(connId);
        setConnectionsSubview('access');
        await refreshConnectionArtifacts();
      };

      $('addSecret').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const secretValue = requireText('secretValue', 'Secret value');
        if (!secretValue) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/secrets', 'POST', {
          secretType: $('secretType').value,
          secretValue,
        });
        $('secretValue').value = '';
        print(out.secret, data);
      };

      $('listSecrets').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        print(out.secret, await api('/api/connections/' + encodeURIComponent(connId) + '/secrets'));
      };

      $('deleteSecret').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const secretId = requireText('deleteSecretId', 'Delete secret ID');
        if (!secretId) return;
        print(out.secret, await api('/api/connections/' + encodeURIComponent(connId) + '/secrets/' + encodeURIComponent(secretId), 'DELETE'));
      };

      $('addAuthState').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const statePayload = requireText('authStatePayload', 'Auth state payload');
        if (!statePayload) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/auth-states', 'POST', {
          stateType: $('authStateType').value,
          statePayload,
          expiresAt: $('authStateExpiresAt').value.trim() || undefined,
        });
        $('authStatePayload').value = '';
        print(out.secret, data);
      };

      $('importAuthState').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const imported = await readSelectedAuthStateFile();
        if (!imported) return;

        if (!imported.detectedType) {
          setBanner('err', 'Could not determine auth state type from this file. Provide a Playwright storageState export or cookie bundle JSON.');
          return;
        }

        $('authStateType').value = imported.detectedType;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/auth-states', 'POST', {
          stateType: imported.detectedType,
          statePayload: imported.text,
          expiresAt: $('authStateExpiresAt').value.trim() || undefined,
        });
        if (data.ok) {
          $('authStateFile').value = '';
          $('authStatePayload').value = '';
          setBanner('ok', 'Imported auth state from ' + imported.filename + '.');
        }
        print(out.secret, {
          importedFrom: imported.filename,
          detectedType: imported.detectedType,
          result: data,
        });
      };

      $('listAuthStates').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        print(out.secret, await api('/api/connections/' + encodeURIComponent(connId) + '/auth-states'));
      };

      $('deleteAuthState').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const authStateId = requireText('deleteAuthStateId', 'Delete auth state ID');
        if (!authStateId) return;
        print(out.secret, await api('/api/connections/' + encodeURIComponent(connId) + '/auth-states/' + encodeURIComponent(authStateId), 'DELETE'));
      };

      $('startCapture').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const startUrl = String($('captureStartUrl').value || '').trim();
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions', 'POST', {
          startUrl: startUrl || undefined,
        });
        renderCapture(data);
        await refreshCaptureHistory();
      };

      $('listCaptureSessions').onclick = async () => {
        await refreshCaptureHistory();
      };

      $('refreshCapture').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const sessionId = requireText('captureSessionId', 'Capture session ID');
        if (!sessionId) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId));
        renderCapture(data);
      };

      async function captureAction(payload) {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const sessionId = requireText('captureSessionId', 'Capture session ID');
        if (!sessionId) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId) + '/actions', 'POST', payload);
        renderCapture(data);
      }

      $('captureNavigate').onclick = async () => {
        const navigateUrl = requireText('captureNavigateUrl', 'Navigate URL');
        if (!navigateUrl) return;
        await captureAction({ actionType: 'navigate', url: navigateUrl });
      };

      $('captureType').onclick = async () => {
        const text = requireText('captureTypeText', 'Type text');
        if (!text) return;
        await captureAction({ actionType: 'type', text });
      };

      $('captureKey').onclick = async () => {
        const combo = requireText('captureKeypress', 'Keypress combo');
        if (!combo) return;
        await captureAction({ actionType: 'keypress', keys: combo.split('+').map((value) => value.trim()).filter(Boolean) });
      };

      $('captureClickButton').onclick = async () => {
        const raw = requireText('captureClick', 'Click position');
        if (!raw) return;
        const [xRaw, yRaw] = raw.split(',').map((value) => value.trim());
        const x = Number(xRaw);
        const y = Number(yRaw);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          setBanner('err', 'Click position must be in the form x,y.');
          return;
        }
        await captureAction({ actionType: 'click', x, y });
      };

      $('captureScrollButton').onclick = async () => {
        const deltaY = Number($('captureScrollY').value || 600);
        await captureAction({ actionType: 'scroll', deltaY: Number.isFinite(deltaY) ? deltaY : 600 });
      };

      $('captureWaitButton').onclick = async () => {
        const ms = Number($('captureWaitMs').value || 1000);
        await captureAction({ actionType: 'wait', ms: Number.isFinite(ms) ? ms : 1000 });
      };

      $('finalizeCapture').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const sessionId = requireText('captureSessionId', 'Capture session ID');
        if (!sessionId) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId) + '/finalize', 'POST', {
          expiresAt: $('authStateExpiresAt').value.trim() || undefined,
        });
        renderCapture(data);
        print(out.secret, data);
        if (data.ok) {
          renderCaptureSummary(data);
          await refreshConnectionArtifacts();
          await refreshCaptureHistory();
          setBanner('ok', 'Capture finalized and connection artifacts refreshed.');
        }
      };

      $('cancelCapture').onclick = async () => {
        const connId = requireText('secretConnId', 'Connection ID');
        if (!connId) return;
        const sessionId = requireText('captureSessionId', 'Capture session ID');
        if (!sessionId) return;
        const data = await api('/api/connections/' + encodeURIComponent(connId) + '/capture-sessions/' + encodeURIComponent(sessionId), 'DELETE');
        print(out.capture, data);
        if (data.ok) {
          await refreshCaptureHistory();
          setBanner('ok', 'Capture cancelled and history refreshed.');
        }
      };

      $('secretPlan').onclick = async () => {
        const connectionId = requireText('secretConnId', 'Connection ID');
        if (!connectionId) return;
        const targetUrl = requireText('planUrl', 'Plan target URL');
        if (!targetUrl) return;
        const data = await api('/api/cua/secret-fill-plan', 'POST', {
          connectionId,
          targetUrl,
          requiredSecretTypes: splitCsv($('planTypes').value),
        });
        print(out.secret, data);
      };

      $('runtimeZdrEnabled').onchange = () => {
        syncRuntimeCheckboxes();
      };

      $('runsSettingsTab').onclick = () => {
        setRunsSubview('settings');
      };

      $('runsHistoryTab').onclick = async () => {
        setRunsSubview('history');
        await loadRuns();
      };

      $('loadRuntimeSettings').onclick = async () => {
        await loadRuntimeSettings();
      };

      $('saveRuntimeSettings').onclick = async () => {
        const runRetentionDays = Number($('runtimeRetentionDays').value || 30);
        if (!Number.isFinite(runRetentionDays) || runRetentionDays < 1 || runRetentionDays > 365) {
          setBanner('err', 'Run retention days must be between 1 and 365.');
          $('runtimeRetentionDays').focus();
          return;
        }

        const data = await api('/api/settings/runtime', 'PATCH', {
          runRetentionDays,
          zdrEnabled: $('runtimeZdrEnabled').checked,
          persistRunEvents: $('runtimePersistEvents').checked,
          persistRunOutput: $('runtimePersistOutput').checked,
        });
        if (data.ok) {
          applyRuntimeSettings(data.body?.settings || {});
          syncRuntimeCheckboxes();
        }
        print(out.runtimeSettings, data);
      };

      $('listRuns').onclick = async () => {
        setRunsSubview('history');
        await loadRuns();
      };

      $('closeRunDetailModal').onclick = () => {
        closeModal(runDetailModal);
      };

      $('runsHistoryOut').addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const inspectId = target.getAttribute('data-run-inspect');
        const deleteId = target.getAttribute('data-run-delete');
        if (inspectId) {
          const data = await api('/api/runs/' + encodeURIComponent(inspectId));
          print(out.runDetail, data);
          if (data.ok) {
            openModal(runDetailModal);
          }
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

      [oneTimeKeyModal, runDetailModal, connectionCreateModeModal].forEach((modal) => {
        modal?.addEventListener('click', (event) => {
          if (event.target === modal) {
            closeModal(modal);
          }
        });
      });

      window.setInterval(() => {
        loadSessionSummary();
      }, 30000);
    