export const DASHBOARD_STYLES = `
:root {
  --bg: #050b11;
  --bg-2: #09121b;
  --panel: rgba(10, 19, 29, 0.88);
  --panel-soft: rgba(255, 255, 255, 0.04);
  --ink: #eef5ff;
  --muted: #92a5ba;
  --line: rgba(161, 191, 220, 0.14);
  --line-strong: rgba(255, 255, 255, 0.16);
  --accent: #ff8c42;
  --warning: #ffd166;
  --danger: #d9506f;
  --success: #78dba9;
  --shadow: 0 28px 80px rgba(0, 0, 0, 0.36);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink);
  line-height: 1.5;
  font-family: "Avenir Next", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 140, 66, 0.18), transparent 28%),
    radial-gradient(circle at 88% 14%, rgba(115, 210, 222, 0.16), transparent 26%),
    linear-gradient(180deg, var(--bg) 0%, #08111a 42%, var(--bg-2) 100%);
}
[hidden] { display: none !important; }
a { color: inherit; text-decoration: none; }

.app-shell {
  width: min(1380px, calc(100% - 28px));
  margin: 0 auto;
  padding: 18px 0 72px;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}
.workspace-main-shell,
.workspace-main,
.section-stack,
.field,
.field-grid,
.card-grid,
.key-card,
.key-card-head,
.key-card-meta,
.key-card-actions,
.composer-card,
.empty-state-card,
.session-rail-inner,
.session-card,
.sidebar-nav,
.section-head,
.subview {
  display: grid;
  gap: 14px;
}
.workspace-main-shell { gap: 18px; }
.section-stack { gap: 18px; }

.session-rail-inner {
  position: sticky;
  top: 18px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid var(--line);
  background: rgba(7, 14, 22, 0.9);
  backdrop-filter: blur(16px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
}
.brand-lockup { display: grid; gap: 12px; }
.brand-badge {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #08111a;
  font-weight: 900;
  letter-spacing: 0.06em;
  background: linear-gradient(135deg, var(--accent), var(--warning));
}
.field-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--muted);
}
.session-card,
.section-panel,
.composer-card,
.key-card,
.empty-state-card,
.selected-connection-shell,
.subtle-shell,
.modal-card,
.connection-card,
.step-link {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
}
.session-card,
.composer-card,
.key-card,
.empty-state-card,
.selected-connection-shell,
.subtle-shell,
.connection-card {
  padding: 16px;
  border-radius: 20px;
}

.sidebar-nav .step-list {
  display: grid;
  gap: 10px;
}
.step-link {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  border-radius: 18px;
  padding: 10px 12px;
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
}
.step-link:hover,
.step-link.active {
  transform: translateY(-1px);
  border-color: rgba(255, 209, 102, 0.22);
  background: rgba(255, 209, 102, 0.1);
}
.step-index {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.06);
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}
.step-icon {
  width: 18px;
  height: 18px;
  display: block;
}
.step-link.active .step-index {
  background: linear-gradient(135deg, var(--accent), var(--warning));
  color: #08111a;
}
.step-copy span,
.micro-copy,
.section-head p,
.session-card p,
.key-card p,
.empty-state-card p {
  color: var(--muted);
  margin: 0;
  line-height: 1.6;
}

.section-panel {
  display: grid;
  gap: 18px;
  padding: 24px;
  border-radius: 28px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(12px);
}
.section-head {
  align-content: start;
  gap: 10px;
}
.section-head p {
  max-width: 72ch;
}
.section-head h2 {
  margin: 0;
  font-family: "Iowan Old Style", "Palatino Linotype", serif;
  letter-spacing: -0.045em;
  font-size: clamp(1.8rem, 4vw, 2.35rem);
}

.title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}
.button-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
button,
.hero-button,
.subview-toggle,
.scope-chip,
.signout-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  border-radius: 999px;
  border: 1px solid transparent;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  padding: 0 14px;
  cursor: pointer;
}
button,
.hero-button {
  color: #08111a;
  background: linear-gradient(135deg, var(--accent), var(--warning));
}
button.secondary,
button.ghost,
.signout-button,
.subview-toggle,
.scope-chip {
  color: var(--ink);
  background: rgba(255,255,255,0.05);
  border-color: var(--line);
}
.signout-button {
  position: relative;
  width: 100%;
  justify-content: center;
}
.signout-icon-shell {
  position: absolute;
  left: 10px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 3px solid rgba(255, 140, 66, 0.9);
  background: rgba(8, 17, 26, 0.6);
  box-shadow: inset 0 0 0 1px rgba(255, 209, 102, 0.35);
}
.signout-brand-icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  object-fit: cover;
}
.signout-button-label {
  display: inline-block;
}
button.danger { background: linear-gradient(135deg, var(--danger), #ae3b58); color: #fff; }

.field-grid { grid-template-columns: 1fr; }
.field-span-2 { grid-column: auto; }
input, textarea, select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  color: var(--ink);
  font: inherit;
  padding: 13px 14px;
}
select option,
select optgroup {
  background: #0d1824;
  color: var(--ink);
}
textarea { min-height: 110px; resize: vertical; }
.checkbox-field {
  grid-template-columns: 1fr auto;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 12px 14px;
}
.checkbox-field input { width: 20px; height: 20px; }

.card-grid,
.connection-board { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.key-card-head { grid-template-columns: minmax(0, 1fr) auto; }
.key-card-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.status-pill,
.connection-tag,
.session-link,
.capture-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.05);
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.status-pill.active,
.capture-badge.ready,
.capture-badge.completed { color: #08111a; background: rgba(120, 219, 169, 0.92); border-color: transparent; }
.status-pill.revoked,
.capture-badge.failed,
.capture-badge.interrupted { color: #fff; background: rgba(217, 80, 111, 0.92); border-color: transparent; }
.status-pill.idle,
.capture-badge.cancelled { color: #08111a; background: rgba(255, 209, 102, 0.92); border-color: transparent; }

.selected-connection-shell.empty,
.capture-history-empty { color: var(--muted); }
.connection-card { align-content: start; min-height: 188px; }
.connection-card.active { border-color: rgba(255, 209, 102, 0.28); background: rgba(255, 209, 102, 0.08); }
.connection-card-head,
.selected-connection-head,
.connection-card-actions,
.subsection-nav,
.surface-actions,
.connection-scope-picker,
.modal-field-row,
.connection-card-tags,
.selected-connection-meta,
.session-links {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.capture-frame {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid var(--line);
  background: rgba(16, 24, 35, 0.92);
  min-height: 280px;
}
.capture-frame.empty { display: grid; place-items: center; padding: 24px; color: rgba(215, 233, 251, 0.72); }
.capture-frame img { display: block; width: 100%; height: auto; cursor: crosshair; }
.capture-workspace {
  display: grid;
  gap: 14px;
  align-items: start;
}
.capture-controls {
  align-content: start;
}
.capture-cursor-readout {
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-size: 16px;
  letter-spacing: 0.04em;
}
.capture-marker {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 3px solid #fff;
  background: rgba(255, 140, 66, 0.92);
  box-shadow: 0 0 0 3px rgba(7, 14, 22, 0.65);
  transform: translate(-50%, -50%);
  pointer-events: none;
  display: none;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(2, 7, 12, 0.76);
  backdrop-filter: blur(12px);
}
.modal-card {
  width: min(620px, calc(100vw - 24px));
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 24px;
  border: 1px solid var(--line-strong);
  background: linear-gradient(180deg, rgba(12, 24, 35, 0.96), rgba(7, 15, 23, 0.98));
  box-shadow: var(--shadow);
}

.banner {
  position: fixed;
  right: 18px;
  bottom: 18px;
  max-width: min(560px, calc(100% - 24px));
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: rgba(10, 18, 28, 0.92);
  z-index: 20;
}
.banner.ok { color: var(--success); }
.banner.err { color: #ffb6c7; }
.toast-stack {
  position: fixed;
  right: 18px;
  bottom: 18px;
  display: grid;
  gap: 10px;
  z-index: 40;
  width: min(360px, calc(100vw - 24px));
  pointer-events: none;
}
.toast {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: rgba(7, 14, 22, 0.96);
  transform: translateY(10px);
  opacity: 0;
  transition: opacity 180ms ease, transform 180ms ease;
}
.toast.show { opacity: 1; transform: translateY(0); }
.toast.ok { border-color: rgba(120, 219, 169, 0.24); }
.toast.err { border-color: rgba(217, 80, 111, 0.28); }
.toast-message {
  margin: 0;
  color: var(--ink);
  line-height: 1.5;
}
.toast-copy {
  justify-self: start;
  min-height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 800;
  border-radius: 999px;
  border: 1px solid rgba(255, 209, 102, 0.4);
  color: #08111a;
  background: linear-gradient(135deg, var(--accent), var(--warning));
}

.dev-output,
.output-shell { display: none !important; }

@media (max-width: 1100px) {
  .app-shell { grid-template-columns: 1fr; }
  .session-rail-inner { position: static; }
  .capture-workspace { grid-template-columns: 1fr; }
}

@media (min-width: 1160px) {
  .capture-workspace {
    grid-template-columns: minmax(0, 1fr) 360px;
  }
}
`;
