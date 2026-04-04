export const DASHBOARD_APP_HTML = `<!doctype html>
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
    <style>
      :root {
        --bg: #050b11;
        --bg-2: #09121b;
        --panel: rgba(10, 19, 29, 0.88);
        --panel-soft: rgba(255, 255, 255, 0.04);
        --panel-soft-2: rgba(255, 255, 255, 0.06);
        --ink: #eef5ff;
        --muted: #92a5ba;
        --line: rgba(161, 191, 220, 0.14);
        --line-strong: rgba(255, 255, 255, 0.16);
        --accent: #ff8c42;
        --accent-strong: #e56b20;
        --accent-alt: #73d2de;
        --danger: #d9506f;
        --success: #78dba9;
        --warning: #ffd166;
        --output-ink: #d9e9fb;
        --shadow: 0 28px 80px rgba(0, 0, 0, 0.36);
        --radius-lg: 28px;
        --radius-md: 18px;
        --radius-sm: 12px;
        --hero-max: 1280px;
      }

      * { box-sizing: border-box; }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at 12% 0%, rgba(255, 140, 66, 0.18), transparent 28%),
          radial-gradient(circle at 88% 14%, rgba(115, 210, 222, 0.16), transparent 26%),
          linear-gradient(180deg, var(--bg) 0%, #08111a 42%, var(--bg-2) 100%);
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(rgba(255,255,255,0.016), rgba(255,255,255,0.016)),
          linear-gradient(90deg, rgba(146, 165, 186, 0.05) 1px, transparent 1px),
          linear-gradient(rgba(146, 165, 186, 0.04) 1px, transparent 1px);
        background-size: auto, 40px 40px, 40px 40px;
        mask-image: radial-gradient(circle at center, black 48%, transparent 92%);
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .hero,
      .workspace,
      .section-panel,
      .banner {
        position: relative;
      }

      .hero,
      .workspace {
        width: min(var(--hero-max), calc(100% - 28px));
        margin: 0 auto;
      }

      .hero {
        padding: 20px 0 18px;
      }

      .hero-inner {
        display: grid;
        gap: 18px;
        padding: 26px clamp(18px, 4vw, 34px) 30px;
        border-radius: 32px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(11, 20, 31, 0.9), rgba(8, 16, 25, 0.96));
        box-shadow: var(--shadow);
        overflow: hidden;
      }

      .hero-inner::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(circle at 10% 0%, rgba(255, 140, 66, 0.2), transparent 26%),
          radial-gradient(circle at 90% 10%, rgba(115, 210, 222, 0.16), transparent 24%);
      }

      .brand-lockup,
      .hero-copy,
      .hero-meta,
      .workspace-nav,
      .workspace-main,
      .section-head,
      .field,
      .output-shell,
      .capture-preview,
      .capture-summary,
      .capture-history-list,
      .connection-card,
      .trust-list,
      .status-strip,
      .summary-strip {
        position: relative;
        display: grid;
        gap: 12px;
      }

      .brand-lockup {
        gap: 14px;
        justify-items: start;
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
      }

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
        box-shadow: 0 18px 30px rgba(255, 140, 66, 0.22);
      }

      .eyebrow,
      .section-number,
      .nav-label,
      .field-label,
      .output-head span,
      .status-kicker,
      .trust-cell span,
      .summary-block span,
      .capture-summary-card span {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--muted);
      }

      .section-number {
        display: none;
      }

      .hero-copy {
        gap: 18px;
        max-width: none;
      }

      .hero-copy h1,
      .section-head h2 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        letter-spacing: -0.045em;
      }

      .hero-copy h1 {
        max-width: 16ch;
        font-size: clamp(3.2rem, 8vw, 5.7rem);
        line-height: 0.92;
      }

      .hero-copy p,
      .section-head p,
      .trust-item span,
      .micro-copy,
      .capture-meta,
      .capture-selection,
      .capture-history-empty,
      .capture-summary-list {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .hero-copy p {
        max-width: 78ch;
        font-size: 1.03rem;
      }

      .hero-art {
        width: min(100%, 1100px);
        margin: 2px auto 0;
        padding: 20px 24px;
        border-radius: 22px;
        border: 1px solid rgba(255, 209, 102, 0.16);
        background: rgba(7, 17, 26, 0.72);
        color: #ffdca3;
        overflow: auto;
        white-space: pre;
        font-family: "Cascadia Mono", "Consolas", "Courier New", monospace;
        font-size: clamp(11px, 1vw, 13px);
        line-height: 1.18;
      }

      .hero-actions,
      .button-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .hero-button,
      button {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 46px;
        padding: 0 16px;
        border-radius: 999px;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.02em;
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
      }

      .hero-button,
      button {
        color: #08111a;
        border: 1px solid transparent;
        background: linear-gradient(135deg, var(--accent), var(--warning));
        box-shadow: 0 14px 24px rgba(255, 140, 66, 0.2);
      }

      .hero-button:hover,
      button:hover {
        transform: translateY(-1px);
      }

      .hero-button.secondary,
      button.secondary,
      button.ghost {
        color: var(--ink);
        background: rgba(255,255,255,0.05);
        border-color: var(--line);
        box-shadow: none;
      }

      button.danger {
        color: #fff;
        background: linear-gradient(135deg, var(--danger), #ae3b58);
        box-shadow: 0 14px 24px rgba(217, 80, 111, 0.16);
      }

      .hero-meta {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .trust-cell,
      .summary-block,
      .capture-summary-card,
      .capture-history-item,
      .capture-history-empty,
      .one-time-key,
      .capture-summary,
      .step-link,
      .section-panel {
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.04);
      }

      .trust-grid,
      .summary-strip,
      .connection-board,
      .capture-summary-grid,
      .field-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .trust-cell,
      .summary-block,
      .capture-summary-card,
      .connection-card,
      .capture-history-item,
      .capture-history-empty {
        padding: 16px;
        border-radius: 20px;
      }

      .connection-board {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .connection-card {
        gap: 14px;
        align-content: start;
        min-height: 188px;
        transition: border-color 180ms ease, transform 180ms ease, background-color 180ms ease;
      }

      .connection-card:hover {
        transform: translateY(-1px);
        border-color: rgba(255, 209, 102, 0.22);
      }

      .connection-card.active {
        border-color: rgba(255, 209, 102, 0.28);
        background: rgba(255, 209, 102, 0.08);
      }

      .connection-card-head,
      .selected-connection-head,
      .connection-card-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .connection-favicon {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        overflow: hidden;
        display: grid;
        place-items: center;
        background: rgba(255,255,255,0.06);
        border: 1px solid var(--line);
        color: var(--warning);
        font-weight: 900;
        font-size: 15px;
        flex: 0 0 auto;
      }

      .connection-favicon img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .connection-card-body,
      .selected-connection-title {
        display: grid;
        gap: 8px;
      }

      .connection-card-body strong {
        font-size: 1rem;
      }

      .connection-card-body code,
      .selected-connection-meta code {
        font-family: "Cascadia Mono", "Consolas", monospace;
        font-size: 12px;
        color: #ffdca3;
        word-break: break-all;
      }

      .connection-card-tags,
      .selected-connection-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .connection-tag {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--line);
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .selected-connection-shell {
        display: grid;
        gap: 12px;
        padding: 16px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.04);
      }

      .selected-connection-shell.empty {
        color: var(--muted);
      }

      .connection-card-actions button {
        min-height: 38px;
        padding: 0 12px;
        font-size: 12px;
      }

      .trust-cell h2,
      .summary-block strong,
      .capture-summary-card strong {
        margin: 8px 0 0;
        font-size: 1rem;
      }

      .trust-cell p {
        margin: 8px 0 0;
        color: var(--muted);
        line-height: 1.55;
      }

      .workspace {
        padding: 0 0 72px;
        display: grid;
        gap: 18px;
      }

      .workspace-nav {
        position: sticky;
        top: 12px;
        z-index: 10;
        padding: 14px;
        border-radius: 24px;
        border: 1px solid var(--line);
        background: rgba(7, 14, 22, 0.9);
        backdrop-filter: blur(16px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
      }

      .step-list {
        display: flex;
        gap: 10px;
        flex-wrap: nowrap;
        align-items: center;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: thin;
      }

      .step-link {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 999px;
        min-width: auto;
        flex: 0 0 auto;
        white-space: nowrap;
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

      .step-link.active .step-index {
        background: linear-gradient(135deg, var(--accent), var(--warning));
        color: #08111a;
      }

      .step-copy strong {
        display: block;
        font-size: 13px;
        margin-bottom: 0;
      }

      .workspace-main {
        display: grid;
      }

      .section-panel {
        padding: 24px;
        border-radius: var(--radius-lg);
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
        backdrop-filter: blur(12px);
      }

      .section-panel[hidden] {
        display: none;
      }

      .section-panel.active-panel {
        display: block;
      }

      .section-head h2 {
        font-size: clamp(1.8rem, 4vw, 2.35rem);
      }

      .field {
        gap: 7px;
      }

      .field-span-2 {
        grid-column: auto;
      }

      .checkbox-field {
        grid-template-columns: 1fr auto;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 12px 14px;
        background: rgba(255,255,255,0.03);
      }

      .checkbox-field .field-label {
        margin: 0;
      }

      .checkbox-field input {
        width: 20px;
        height: 20px;
      }

      input,
      textarea,
      select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: rgba(255,255,255,0.05);
        color: var(--ink);
        font: inherit;
        padding: 13px 14px;
        transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
      }

      input:focus,
      textarea:focus,
      select:focus {
        outline: none;
        border-color: rgba(255, 209, 102, 0.36);
        box-shadow: 0 0 0 4px rgba(255, 209, 102, 0.08);
        background: rgba(255,255,255,0.08);
      }

      input::placeholder,
      textarea::placeholder {
        color: #6f8195;
      }

      textarea {
        min-height: 112px;
        resize: vertical;
      }

      .output-shell {
        margin-top: 18px;
      }

      .output-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      pre {
        margin: 0;
        padding: 16px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.08);
        background:
          radial-gradient(circle at 90% 8%, rgba(115, 210, 222, 0.14), transparent 26%),
          linear-gradient(180deg, #0d1823, #08111a);
        color: var(--output-ink);
        min-height: 190px;
        max-height: 360px;
        overflow: auto;
        font-size: 12px;
        line-height: 1.55;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
      }

      .one-time-key {
        display: none;
        margin-top: 18px;
        padding: 18px;
        border-radius: 22px;
        background: linear-gradient(180deg, rgba(14, 29, 43, 0.95), rgba(11, 21, 31, 0.98));
        color: #f1f6ff;
        box-shadow: 0 22px 38px rgba(11,21,31,0.18);
      }

      .one-time-key strong {
        display: block;
        margin-bottom: 8px;
        font-size: 15px;
      }

      .one-time-key p {
        margin: 0 0 12px;
        font-size: 13px;
        line-height: 1.5;
        color: rgba(241,246,255,0.8);
      }

      .one-time-key input {
        background: rgba(255,255,255,0.08);
        color: #fff;
        border-color: rgba(255,255,255,0.12);
      }

      .capture-frame {
        position: relative;
        overflow: hidden;
        border-radius: 22px;
        border: 1px solid var(--line);
        background: rgba(16, 24, 35, 0.92);
        min-height: 280px;
      }

      .capture-frame.empty {
        display: grid;
        place-items: center;
        padding: 24px;
        color: rgba(215, 233, 251, 0.72);
        font-size: 13px;
      }

      .capture-frame img {
        display: block;
        width: 100%;
        height: auto;
        cursor: crosshair;
      }

      .capture-marker {
        position: absolute;
        width: 16px;
        height: 16px;
        border-radius: 999px;
        border: 2px solid #fff;
        background: rgba(255, 140, 66, 0.92);
        box-shadow: 0 0 0 4px rgba(255, 140, 66, 0.2);
        transform: translate(-50%, -50%);
        pointer-events: none;
        display: none;
      }

      .capture-summary-list {
        display: grid;
        gap: 8px;
        margin: 0;
        padding-left: 18px;
        font-size: 13px;
      }

      .capture-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        border: 1px solid var(--line);
      }

      .capture-badge.ready,
      .capture-badge.completed {
        color: #08111a;
        background: rgba(120, 219, 169, 0.9);
      }

      .capture-badge.cancelled {
        color: #08111a;
        background: rgba(255, 209, 102, 0.92);
      }

      .capture-badge.failed,
      .capture-badge.interrupted {
        color: #fff;
        background: rgba(217, 80, 111, 0.92);
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
        box-shadow: 0 24px 50px rgba(0, 0, 0, 0.24);
        font-size: 13px;
        line-height: 1.45;
        backdrop-filter: blur(14px);
        z-index: 20;
      }

      .banner.ok {
        color: var(--success);
        border-color: rgba(120, 219, 169, 0.22);
      }

      .banner.err {
        color: #ffb6c7;
        border-color: rgba(217, 80, 111, 0.24);
      }

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
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(7, 14, 22, 0.96);
        box-shadow: 0 22px 48px rgba(0, 0, 0, 0.28);
        color: var(--ink);
        line-height: 1.45;
        backdrop-filter: blur(16px);
        transform: translateY(10px);
        opacity: 0;
        transition: opacity 180ms ease, transform 180ms ease;
      }

      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }

      .toast.ok {
        border-color: rgba(120, 219, 169, 0.24);
      }

      .toast.err {
        border-color: rgba(217, 80, 111, 0.28);
      }

      .app-shell {
        width: min(1380px, calc(100% - 28px));
        margin: 0 auto;
        padding: 18px 0 72px;
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }

      .workspace-main-shell {
        display: grid;
        gap: 18px;
      }

      .subsection-nav,
      .surface-actions,
      .connection-scope-picker,
      .modal-field-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .subview-toggle,
      .scope-chip {
        appearance: none;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.04);
        color: var(--muted);
        border-radius: 999px;
        min-height: 38px;
        padding: 0 14px;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.03em;
        cursor: pointer;
      }

      .subview-toggle.active,
      .scope-chip.active {
        color: #08111a;
        background: linear-gradient(135deg, var(--accent), var(--warning));
        border-color: transparent;
      }

      .surface-actions {
        justify-content: space-between;
        align-items: center;
      }

      .surface-actions .button-row {
        justify-content: flex-end;
      }

      .subview {
        display: grid;
        gap: 18px;
      }

      .connection-scope-picker {
        align-items: center;
      }

      .scope-chip input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .scope-chip {
        position: relative;
        align-items: center;
        display: inline-flex;
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

      .modal-backdrop[hidden] {
        display: none;
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

      .modal-card pre,
      .modal-card input {
        min-height: 0;
      }

      .modal-card h3 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        font-size: 1.7rem;
        letter-spacing: -0.04em;
      }

      .modal-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .subtle-shell {
        display: grid;
        gap: 14px;
        padding: 16px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.03);
      }

      details.subtle-shell summary {
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }

      details.subtle-shell summary + * {
        margin-top: 14px;
      }

      .dev-output {
        display: none !important;
      }

      .session-rail-inner,
      .session-card,
      .composer-card,
      .card-grid,
      .key-card,
      .empty-state-card,
      .key-card-head,
      .key-card-meta,
      .key-card-actions,
      .title-row {
        display: grid;
        gap: 12px;
      }

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

      .session-brand {
        gap: 10px;
      }

      .session-card,
      .composer-card,
      .key-card,
      .empty-state-card {
        padding: 16px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.04);
      }

      .session-card strong,
      .key-card strong {
        font-size: 1rem;
      }

      .session-card p,
      .key-card p,
      .empty-state-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }

      .session-links {
        display: grid;
        gap: 10px;
      }

      .session-link {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.04);
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .signout-button {
        appearance: none;
        width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 44px;
        padding: 0 16px;
        border-radius: 14px;
        border: 1px solid rgba(255, 209, 102, 0.18);
        background: rgba(255, 209, 102, 0.06);
        color: var(--ink);
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.02em;
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
        box-shadow: none;
      }

      .signout-button:hover,
      .signout-button:focus-visible {
        transform: translateY(-1px);
        border-color: rgba(255, 209, 102, 0.34);
        background: rgba(255, 209, 102, 0.1);
        outline: none;
      }

      .signout-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        border: 1px solid rgba(255, 209, 102, 0.24);
        background: rgba(255, 209, 102, 0.1);
        color: #ffdca3;
        font-size: 12px;
        line-height: 1.18;
      }

      .section-stack {
        display: grid;
        gap: 18px;
      }

      .sidebar-nav {
        display: grid;
        gap: 10px;
      }

      .sidebar-nav .nav-label {
        margin-top: 4px;
      }

      .sidebar-nav .step-list {
        display: grid;
        gap: 10px;
        overflow: visible;
        padding-bottom: 0;
      }

      .sidebar-nav .step-link {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr);
        align-items: center;
        border-radius: 18px;
        white-space: normal;
      }

      .sidebar-nav .step-copy strong {
        margin-bottom: 2px;
      }

      .sidebar-nav .step-copy span {
        display: block;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .title-row {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: end;
      }

      .title-row .button-row {
        justify-content: flex-end;
      }

      .card-grid {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .empty-state-card {
        place-items: start;
      }

      .key-card-head {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
      }

      .key-card-meta {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.55;
      }

      .key-card-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .key-card-actions button {
        min-height: 38px;
        padding: 0 12px;
        font-size: 12px;
      }

      .status-pill {
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

      .status-pill.active {
        color: #08111a;
        background: rgba(120, 219, 169, 0.92);
        border-color: transparent;
      }

      .status-pill.revoked {
        color: #fff;
        background: rgba(217, 80, 111, 0.9);
        border-color: transparent;
      }

      .status-pill.idle {
        color: #08111a;
        background: rgba(255, 209, 102, 0.92);
        border-color: transparent;
      }

      @media (max-width: 1100px) {
        .app-shell {
          grid-template-columns: 1fr;
        }

        .session-rail-inner,
        .workspace-nav {
          position: static;
        }
      }

      @media (max-width: 840px) {
        .hero,
        .workspace {
          width: min(100%, calc(100% - 20px));
        }

        .hero-copy h1 {
          max-width: 12ch;
        }

        .step-list {
          gap: 8px;
        }

        .hero-meta {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="app-shell">
      <aside class="session-rail">
        <div class="session-rail-inner">
          <div class="brand-lockup session-brand">
            <div class="brand-badge">CUA</div>
            <div>Dashboard</div>
          </div>

          <div class="session-card">
            <span class="field-label">Signed in</span>
            <strong id="sessionName">Signed in</strong>
            <p id="sessionEmail">Loading session details.</p>
            <p id="sessionMeta">Your OpenAI key, MCP access keys, connections, and run history stay scoped to this account.</p>
          </div>

          <div class="sidebar-nav">
            <div class="nav-label">Dashboard</div>
            <nav class="step-list" aria-label="Dashboard tabs">
              <a class="step-link" href="/dashboard/llm-api-keys" data-step-link="llm-step" data-step-path="/dashboard/llm-api-keys">
                <div class="step-index">AI</div>
                <div class="step-copy">
                  <strong>OpenAI Keys</strong>
                  <span>Set the active model credential for new runs.</span>
                </div>
              </a>
              <a class="step-link" href="/dashboard/connections" data-step-link="connections-step" data-step-path="/dashboard/connections">
                <div class="step-index">CN</div>
                <div class="step-copy">
                  <strong>Connections</strong>
                  <span>Create a boundary, then capture access only when needed.</span>
                </div>
              </a>
              <a class="step-link" href="/dashboard/patterns" data-step-link="patterns-step" data-step-path="/dashboard/patterns">
                <div class="step-index">PT</div>
                <div class="step-copy">
                  <strong>Patterns</strong>
                  <span>Store reusable orchestration guides as editable cards.</span>
                </div>
              </a>
              <a class="step-link" href="/dashboard/runs-privacy" data-step-link="runs-step" data-step-path="/dashboard/runs-privacy">
                <div class="step-index">RP</div>
                <div class="step-copy">
                  <strong>Runs and Privacy</strong>
                  <span>Inspect stored runs and retention settings.</span>
                </div>
              </a>
              <a class="step-link" href="/dashboard/mcp-access-keys" data-step-link="keys-step" data-step-path="/dashboard/mcp-access-keys">
                <div class="step-index">MK</div>
                <div class="step-copy">
                  <strong>MCP Access Keys</strong>
                  <span>Issue and revoke client credentials for this account.</span>
                </div>
              </a>
            </nav>
          </div>

          <div class="session-links">
            <a class="session-link" href="/">Public home</a>
            <a class="session-link" href="/dashboard/connections">Connections</a>
          </div>

          <button id="signOutButton" class="signout-button" type="button" aria-label="Sign out">
            <span class="signout-icon" aria-hidden="true">-></span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div class="workspace-main-shell">
        <div class="workspace-main">
        <section class="section-panel active-panel" id="llm-step" data-reveal>
          <div class="section-head">
            <div class="section-number">OpenAI API Key</div>
            <h2>Store the OpenAI key this account should use for new runs.</h2>
            <p>
              Keep one active key for normal use, rotate it when needed, and leave old values deleted rather than lingering in the control plane. Raw key material is accepted once, encrypted immediately, and never returned to the browser.
            </p>
          </div>

          <div class="section-stack">
            <div class="title-row">
              <div>
                <span class="field-label">Stored keys</span>
                <p class="micro-copy">The active key is used for new runs. Activate a different key or revoke one directly from its card.</p>
              </div>
              <div class="button-row">
                <button class="ghost" id="newLlmKey" type="button">Add key</button>
                <button class="secondary" id="listLlmKeys">Refresh</button>
              </div>
            </div>

            <div id="llmCards" class="card-grid">
              <article class="empty-state-card">
                <span class="field-label">No OpenAI keys yet</span>
                <strong>Add your first key</strong>
                <p>Store an OpenAI API key for this account before starting runs.</p>
                <div class="button-row">
                  <button type="button" data-empty-action="new-llm-key">Add your first key</button>
                </div>
              </article>
            </div>

            <div id="llmComposer" class="composer-card" hidden>
              <div class="title-row">
                <div>
                  <span class="field-label">Add key</span>
                  <p class="micro-copy">The key value is accepted once, encrypted at rest, and hidden after submission.</p>
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

        <section class="section-panel" id="keys-step" data-reveal hidden>
          <div class="section-head">
            <div class="section-number">MCP Access Keys</div>
            <h2>Create access keys for clients and scope them to the connections they are allowed to use.</h2>
            <p>
              MCP access keys are shown once, then redacted. Create them for a specific machine or client, scope them to approved connections, and revoke them directly from the list when they are no longer needed.
            </p>
          </div>

          <div class="section-stack">
            <div class="title-row">
              <div>
                <span class="field-label">Issued keys</span>
                <p class="micro-copy">Cards show scope, creation time, and last use. Revoke from the card when a client should lose access.</p>
              </div>
              <div class="button-row">
                <button class="ghost" id="newApiKey" type="button">Create key</button>
                <button class="secondary" id="listKeys">Refresh</button>
              </div>
            </div>

            <div id="apiKeyCards" class="card-grid">
              <article class="empty-state-card">
                <span class="field-label">No access keys yet</span>
                <strong>Create your first MCP key</strong>
                <p>Issue a key for a client and scope it to the connections it should be able to reach.</p>
                <div class="button-row">
                  <button type="button" data-empty-action="new-api-key">Create access key</button>
                </div>
              </article>
            </div>

            <div id="keyComposer" class="composer-card" hidden>
              <div class="title-row">
                <div>
                  <span class="field-label">Issue key</span>
                  <p class="micro-copy">Scope this key by connection name. Leave all options unselected to allow every connection on this account.</p>
                </div>
                <div class="button-row">
                  <button class="ghost" id="scopeSelectedConnection" type="button">Use selected connection</button>
                  <button class="ghost" id="cancelKeyComposer" type="button">Cancel</button>
                </div>
              </div>

              <div class="field-grid">
                <label class="field">
                  <span class="field-label">Name</span>
                  <input id="keyName" placeholder="Desktop client" />
                </label>
                <div class="field field-span-2">
                  <span class="field-label">Allowed connections</span>
                  <div id="keyScopePicker" class="connection-scope-picker"></div>
                  <input id="keyConnIds" type="hidden" />
                </div>
              </div>

              <div class="button-row">
                <button id="createKey">Create access key</button>
              </div>
            </div>
          </div>

          <div id="oneTimeKeyModal" class="modal-backdrop" hidden>
            <div class="modal-card">
              <div>
                <p class="eyebrow">MCP Access Key</p>
                <h3>Copy the server URL and key now.</h3>
                <p>The raw key is returned once and never shown again.</p>
              </div>
              <label class="field">
                <span class="field-label">Server URL</span>
                <input id="oneTimeKeyServerUrl" readonly />
              </label>
              <label class="field">
                <span class="field-label">Access key</span>
                <input id="oneTimeKeyValue" readonly />
              </label>
              <div class="button-row">
                <button class="secondary" id="copyOneTimeKey">Copy key</button>
                <button class="ghost" id="copyServerUrl">Copy server URL</button>
                <button class="danger" id="clearOneTimeKey">Done</button>
              </div>
            </div>
          </div>

          <div class="output-shell" hidden>
            <div class="output-head"><span>MCP key activity</span></div>
            <pre id="keysOut">MCP key output</pre>
          </div>
        </section>

        <section class="section-panel" id="connections-step" data-reveal hidden>
          <div class="section-head">
            <div class="section-number">Connections</div>
            <h2>Create a connection first, then launch guided capture only when it needs browser access.</h2>
            <p>
              A connection is the security boundary. Keep the default flow simple: create the allowed host boundary, select the card, and start a guided capture when you need a durable auth state. Manual secret and auth-state entry still exists, but it is secondary on purpose.
            </p>
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
                <button class="ghost" id="openManualConnectionAccess" type="button">Manual access</button>
                <button class="ghost" id="newConnection">Create connection</button>
              </div>
            </div>
            <div id="selectedConnectionMeta" class="selected-connection-meta">
              <span class="connection-tag">Create or choose a connection card, then launch capture when the browser session needs durable access.</span>
            </div>
          </div>

          <div class="subsection-nav" aria-label="Connections views" hidden>
            <button id="connectionsSetupTab" class="subview-toggle active" type="button">Connection setup</button>
            <button id="connectionsAccessTab" class="subview-toggle" type="button">Access artifacts</button>
          </div>

          <div id="connectionsBoard" class="connection-board capture-history-empty">No connections loaded yet.</div>

          <div id="connectionSetupView" class="subview">
            <div id="connectionComposer" class="composer-card" hidden>
              <div class="title-row">
                <div>
                  <span class="field-label">Connection policy</span>
                  <p class="micro-copy">Create the host boundary first. After the connection exists, capture access from the card instead of filling every advanced field up front.</p>
                </div>
                <div class="button-row">
                  <button class="ghost" id="cancelConnectionComposer" type="button">Cancel</button>
                </div>
              </div>

              <div class="field-grid">
                <label class="field">
                  <span class="field-label">Connection name</span>
                  <input id="connName" placeholder="NetDocuments production" />
                </label>
                <label class="field">
                  <span class="field-label">Base host</span>
                  <input id="connBaseHost" placeholder="portal.example.com" />
                </label>
                <label class="field field-span-2">
                  <span class="field-label">Allowed hosts</span>
                  <input id="connHosts" placeholder="app.example.com, support.example.com" />
                </label>
                <label class="field field-span-2">
                  <span class="field-label">Allowed path prefixes</span>
                  <input id="connPaths" placeholder="/, /login, /dashboard" />
                </label>
                <label class="field checkbox-field">
                  <span class="field-label">Allow base-host subdomains</span>
                  <input id="connAllowSubdomains" type="checkbox" />
                </label>
                <label class="field checkbox-field">
                  <span class="field-label">Allow any path on approved hosts</span>
                  <input id="connAllowAnyPath" type="checkbox" />
                </label>
                <label class="field">
                  <span class="field-label">Preferred auth method</span>
                  <select id="connAuthMethod">
                    <option value="oauth">oauth</option>
                    <option value="auth_state">auth_state</option>
                    <option value="credentials">credentials</option>
                  </select>
                </label>
                <label class="field">
                  <span class="field-label">Status</span>
                  <select id="patchConnStatus">
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="disabled">disabled</option>
                  </select>
                </label>
                <input id="patchConnId" type="hidden" />
              </div>

              <div class="button-row">
                <button id="createConn">Create connection</button>
                <button class="secondary" id="patchConn">Save changes</button>
              </div>

              <p class="micro-copy">
                Approved hosts and path prefixes are the contract the execution layer must satisfy before any secret reference can be resolved.
              </p>
            </div>
          </div>

          <div id="connectionAccessView" class="subview" hidden>
            <div class="subtle-shell">
              <div>
                <span class="field-label">Guided capture</span>
                <p class="micro-copy">Start an isolated browser session for the selected connection, complete login there, then finalize to save auth state back into the boundary.</p>
              </div>

              <div class="field-grid">
                <input id="secretConnId" type="hidden" />
                <label class="field field-span-2">
                  <span class="field-label">Capture session id</span>
                  <input id="captureSessionId" placeholder="Start a capture session and this fills automatically." />
                </label>
                <label class="field field-span-2">
                  <span class="field-label">Auth state expiry</span>
                  <input id="authStateExpiresAt" placeholder="2026-01-31T18:30:00Z" />
                </label>
                <label class="field field-span-2">
                  <span class="field-label">Capture start URL</span>
                  <input id="captureStartUrl" placeholder="https://portal.example.com/login" />
                </label>
                <label class="field">
                  <span class="field-label">Navigate URL</span>
                  <input id="captureNavigateUrl" placeholder="https://portal.example.com/account" />
                </label>
                <label class="field">
                  <span class="field-label">Type text</span>
                  <input id="captureTypeText" placeholder="Text to type into the controlled browser" />
                </label>
                <label class="field">
                  <span class="field-label">Keypress combo</span>
                  <input id="captureKeypress" placeholder="Tab or Control+L" />
                </label>
                <label class="field">
                  <span class="field-label">Click position</span>
                  <input id="captureClick" placeholder="x,y coordinates for the next click" />
                </label>
                <label class="field">
                  <span class="field-label">Scroll delta Y</span>
                  <input id="captureScrollY" placeholder="600" />
                </label>
                <label class="field">
                  <span class="field-label">Wait milliseconds</span>
                  <input id="captureWaitMs" placeholder="1000" />
                </label>
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
                <div id="captureEmptyText">Start an auth capture session to control an isolated browser and save auth state directly from the flow.</div>
              </div>
              <div class="capture-selection">
                <span>Click inside the screenshot to populate the click position for the next action.</span>
                <strong id="captureSelectionText">No coordinate selected</strong>
              </div>
            </div>

            <div class="subtle-shell">
              <div class="output-head"><span>Capture finalize summary</span></div>
              <div id="captureSummary" class="capture-summary empty">Finalize a capture to see which auth artifacts were saved and which hosts or paths were discovered.</div>
            </div>

            <div class="subtle-shell">
              <div class="title-row">
                <div>
                  <span class="field-label">Capture session history</span>
                  <p class="micro-copy">Recent capture sessions for the selected connection.</p>
                </div>
                <div class="button-row">
                  <button class="secondary" id="listCaptureSessions">Refresh history</button>
                </div>
              </div>
              <div id="captureHistoryOut" class="capture-history-empty">No capture history loaded yet.</div>
            </div>

            <details class="subtle-shell">
              <summary>Manual access artifacts</summary>
              <div>
                <p class="micro-copy">Use these controls only when capture is not the right tool. Stored secrets and imported auth state remain hidden after submission.</p>
              </div>

              <div class="field-grid">
                <label class="field">
                  <span class="field-label">Secret type</span>
                  <select id="secretType">
                    <option value="username">username</option>
                    <option value="password">password</option>
                    <option value="otp">otp</option>
                    <option value="api_token">api_token</option>
                    <option value="cookie_bundle">cookie_bundle</option>
                  </select>
                </label>
                <label class="field field-span-2">
                  <span class="field-label">Secret value</span>
                  <textarea id="secretValue" placeholder="Paste the value once. It will be encrypted and cleared from this form after submission."></textarea>
                </label>
                <label class="field">
                  <span class="field-label">Delete secret id</span>
                  <input id="deleteSecretId" placeholder="Delete a specific stored ref by id" />
                </label>
                <label class="field field-span-2">
                  <span class="field-label">Target URL for fill plan</span>
                  <input id="planUrl" placeholder="https://portal.example.com/login" />
                </label>
                <label class="field field-span-2">
                  <span class="field-label">Required secret types</span>
                  <input id="planTypes" placeholder="username,password or token,cookie_bundle" />
                </label>
                <label class="field">
                  <span class="field-label">Auth state type</span>
                  <select id="authStateType">
                    <option value="playwright_storage_state_json">playwright_storage_state_json</option>
                    <option value="cookie_bundle_json">cookie_bundle_json</option>
                  </select>
                </label>
                <label class="field field-span-2">
                  <span class="field-label">Auth state import file</span>
                  <input id="authStateFile" type="file" accept="application/json,.json" />
                </label>
                <label class="field field-span-2">
                  <span class="field-label">Auth state payload</span>
                  <textarea id="authStatePayload" placeholder='Paste Playwright storageState JSON or a cookie bundle JSON object.'></textarea>
                </label>
                <label class="field">
                  <span class="field-label">Delete auth state id</span>
                  <input id="deleteAuthStateId" placeholder="Delete a stored auth state by id" />
                </label>
              </div>

              <div class="button-row">
                <button class="secondary" id="loadConnArtifacts">Load connection artifacts</button>
                <button id="addSecret">Add secret ref</button>
                <button class="secondary" id="listSecrets">List secret refs</button>
                <button class="danger" id="deleteSecret">Delete secret ref</button>
                <button class="secondary" id="addAuthState">Add auth state</button>
                <button class="secondary" id="importAuthState">Import auth state file</button>
                <button class="secondary" id="listAuthStates">List auth states</button>
                <button class="danger" id="deleteAuthState">Delete auth state</button>
                <button class="ghost" id="secretPlan">Preview fill plan</button>
              </div>

              <pre id="secretOut" class="dev-output">Secrets output</pre>
              <pre id="captureOut" class="dev-output">Capture output</pre>
            </details>
          </div>
        </section>

        <section class="section-panel" id="patterns-step" data-reveal hidden>
          <div class="section-head">
            <div class="section-number">Patterns</div>
            <h2>Keep the system's learned playbooks in one place and edit them like they matter.</h2>
            <p>
              These patterns become reusable context for future delegations. Save the URLs that tend to matter, the steps that actually work, and the steering notes that prevent the same mistakes from becoming traditions.
            </p>
          </div>

          <div id="selectedPatternShell" class="selected-connection-shell empty">
            <div class="selected-connection-head">
              <div class="selected-connection-title">
                <span class="field-label">Selected pattern</span>
                <strong id="selectedPatternName">No pattern selected</strong>
              </div>
              <div class="button-row">
                <button class="secondary" id="refreshPatterns">Refresh list</button>
                <button class="ghost" id="newPattern">New pattern</button>
              </div>
            </div>
            <div id="selectedPatternMeta" class="selected-connection-meta">
              <span class="connection-tag">Create or choose a pattern card to edit the learned guide it contributes to future runs.</span>
            </div>
          </div>

          <div id="patternCards" class="card-grid">
            <article class="empty-state-card">
              <span class="field-label">No patterns yet</span>
              <strong>Write the first reusable guide</strong>
              <p>Capture one workflow with real URLs, working steps, and the issues that usually require steering.</p>
              <div class="button-row">
                <button type="button" data-empty-action="new-pattern">New pattern</button>
              </div>
            </article>
          </div>

          <div id="patternEditor" class="composer-card" hidden>
            <div class="title-row">
              <div>
                <span class="field-label">Pattern editor</span>
                <p class="micro-copy">Cards are summaries. This form holds the actual stepwise playbook and the issues worth remembering.</p>
              </div>
              <div class="button-row">
                <button class="ghost" id="cancelPatternEditor" type="button">Cancel</button>
              </div>
            </div>

            <div class="field-grid">
              <input id="patternId" type="hidden" />
              <label class="field">
                <span class="field-label">Pattern name</span>
                <input id="patternName" placeholder="NetDocuments login with stored auth-state fallback" />
              </label>
              <label class="field field-span-2">
                <span class="field-label">Known URLs or paths</span>
                <input id="patternUrls" placeholder="https://example.com/login, /search, /matters/active" />
              </label>
              <label class="field field-span-2">
                <span class="field-label">Summary</span>
                <textarea id="patternSummary" placeholder="Short description of when this pattern applies and what it gets done."></textarea>
              </label>
              <label class="field field-span-2">
                <span class="field-label">Stepwise guide</span>
                <textarea id="patternSteps" placeholder="1. Start on the login page.\n2. Prefer saved auth state if present.\n3. If redirected, navigate back to the dashboard and reopen the search pane."></textarea>
              </label>
              <label class="field field-span-2">
                <span class="field-label">Known issues and steering notes</span>
                <textarea id="patternIssues" placeholder="Ask for clarification if multiple matter workspaces appear. Refresh once if the grid loads blank. Stop if the connection boundary would be exceeded."></textarea>
              </label>
            </div>

            <div class="button-row">
              <button id="savePattern">Save pattern</button>
              <button class="secondary" id="listPatterns">List patterns</button>
              <button class="danger" id="deletePattern">Delete pattern</button>
            </div>
          </div>

          <div class="output-shell" hidden>
            <div class="output-head"><span>Pattern activity</span></div>
            <pre id="patternsOut">Pattern output</pre>
          </div>
        </section>

        <section class="section-panel" id="runs-step" data-reveal hidden>
          <div class="section-head">
            <div class="section-number">Runs and privacy</div>
            <h2>Decide what the system remembers, what it forgets, and how suspiciously clean you want the trail.</h2>
            <p>
              Runtime settings stay user-scoped. Retention determines cleanup windows, while ZDR disables event and output persistence so the system keeps only the minimum needed to track run state and avoid becoming a scrapbook.
            </p>
          </div>

          <div class="subsection-nav" aria-label="Runs views">
            <button id="runsSettingsTab" class="subview-toggle active" type="button">Privacy settings</button>
            <button id="runsHistoryTab" class="subview-toggle" type="button">Run history</button>
          </div>

          <div id="runSettingsView" class="subview">
            <div class="field-grid">
              <label class="field">
                <span class="field-label">Run retention days</span>
                <input id="runtimeRetentionDays" type="number" min="1" max="365" placeholder="30" />
              </label>
              <label class="field checkbox-field">
                <span class="field-label">Zero-data retention</span>
                <input id="runtimeZdrEnabled" type="checkbox" />
              </label>
              <label class="field checkbox-field">
                <span class="field-label">Persist run events</span>
                <input id="runtimePersistEvents" type="checkbox" checked />
              </label>
              <label class="field checkbox-field">
                <span class="field-label">Persist run output</span>
                <input id="runtimePersistOutput" type="checkbox" checked />
              </label>
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
                <p class="micro-copy">Inspect a run in place or delete it from history.</p>
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
        </div>
      </div>
    </main>

    <div id="runDetailModal" class="modal-backdrop" hidden>
      <div class="modal-card">
        <div>
          <p class="eyebrow">Run detail</p>
          <h3>Inspect the stored run.</h3>
          <p>Use this to confirm what was persisted for the selected run without leaving the history view.</p>
        </div>
        <pre id="runDetailOut">Run detail output</pre>
        <div class="button-row">
          <button class="secondary" id="closeRunDetailModal">Close</button>
        </div>
      </div>
    </div>

    <div id="banner" class="banner" hidden>Ready.</div>
    <div id="toastStack" class="toast-stack" aria-live="polite" aria-atomic="false"></div>

    <script>
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
      const keyScopePicker = $('keyScopePicker');
      const oneTimeKeyModal = $('oneTimeKeyModal');
      const runDetailModal = $('runDetailModal');
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
        connectionsSubview: 'setup',
        runsSubview: 'settings',
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
        showSurface(llmComposer, show);
      }

      function showKeyComposer(show) {
        showSurface(keyComposer, show);
      }

      function showPatternEditor(show) {
        showSurface(patternEditor, show);
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
        $('patternName').value = '';
        $('patternUrls').value = '';
        $('patternSummary').value = '';
        $('patternSteps').value = '';
        $('patternIssues').value = '';
        clearPatternSelection();
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
        $('patternName').value = String(pattern.name || '');
        $('patternUrls').value = Array.isArray(pattern.urls) ? pattern.urls.join(', ') : '';
        $('patternSummary').value = String(pattern.summary || '');
        $('patternSteps').value = String(pattern.stepsMarkdown || '');
        $('patternIssues').value = String(pattern.knownIssuesMarkdown || '');
        setActivePatternId(pattern.id);
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
              '<button class="ghost" type="button" data-pattern-duplicate="' + escapeAttr(pattern.id) + '">Duplicate</button>' +
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

      function selectPatternById(patternId) {
        const pattern = state.patterns.find((entry) => entry.id === patternId);
        if (!pattern) return;
        populatePatternForm(pattern);
        renderPatternCards(state.patterns);
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

        sessionName.textContent = user.displayName || user.email || 'Signed in';
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
        if (!state.llmKeys.length) {
          llmCards.innerHTML = '<article class="empty-state-card"><span class="field-label">No OpenAI keys yet</span><strong>Add your first key</strong><p>Store an OpenAI API key for this account before starting runs.</p><div class="button-row"><button type="button" data-empty-action="new-llm-key">Add your first key</button></div></article>';
          return;
        }

        llmCards.innerHTML = state.llmKeys.map((key) => {
          const statusClass = key.revokedAt ? 'revoked' : (key.isActive ? 'active' : 'idle');
          const statusLabel = key.revokedAt ? 'revoked' : (key.isActive ? 'active' : 'stored');
          const actions = [];
          if (!key.revokedAt && !key.isActive) {
            actions.push('<button class="secondary" type="button" data-llm-action="activate" data-llm-key-id="' + escapeAttr(key.id) + '">Activate</button>');
          }
          if (!key.revokedAt) {
            actions.push('<button class="danger" type="button" data-llm-action="revoke" data-llm-key-id="' + escapeAttr(key.id) + '">Delete</button>');
          }
          return '<article class="key-card">' +
            '<div class="key-card-head">' +
              '<div>' +
                '<span class="field-label">' + escapeHtml(key.provider || 'openai') + '</span>' +
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
            actions.push('<button class="secondary" type="button" data-api-key-action="use-scope" data-api-key-id="' + escapeAttr(key.id) + '">Use scope</button>');
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
          if (action === 'activate') {
            const data = await api('/api/llm-keys/' + encodeURIComponent(keyId), 'PATCH', { isActive: true });
            print(out.llm, data);
            if (data.ok) {
              await loadLlmKeys();
            }
            return;
          }
          if (action === 'revoke') {
            const approved = window.confirm('Delete this stored OpenAI key?');
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
            showKeyComposer(true);
            activateSection('keys-step');
            return;
          }
          const action = target.getAttribute('data-api-key-action');
          const keyId = target.getAttribute('data-api-key-id');
          if (!action || !keyId) return;
          const key = state.apiKeys.find((entry) => entry.id === keyId);
          if (!key) return;
          if (action === 'use-scope') {
            setSelectedConnectionScopeIds(key.allowedConnectionIds || []);
            $('keyName').value = key.name ? key.name + ' copy' : '';
            showKeyComposer(true);
            activateSection('keys-step');
            setBanner('ok', 'Copied key scope into the form. Create a new key to replace or narrow it.');
            return;
          }
          if (action === 'revoke') {
            const approved = window.confirm('Delete this MCP access key?');
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
        patternCards.addEventListener('click', (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          const emptyAction = target.getAttribute('data-empty-action');
          if (emptyAction === 'new-pattern') {
            clearPatternForm();
            showPatternEditor(true);
            return;
          }
          const editId = target.getAttribute('data-pattern-edit');
          const duplicateId = target.getAttribute('data-pattern-duplicate');
          const cardId = target.closest('[data-pattern-id]')?.getAttribute('data-pattern-id');
          const patternId = editId || duplicateId || cardId;
          if (!patternId) return;
          const pattern = state.patterns.find((entry) => entry.id === patternId);
          if (!pattern) return;
          if (duplicateId) {
            $('patternName').value = (pattern.name || 'Pattern') + ' copy';
            $('patternUrls').value = Array.isArray(pattern.urls) ? pattern.urls.join(', ') : '';
            $('patternSummary').value = String(pattern.summary || '');
            $('patternSteps').value = String(pattern.stepsMarkdown || '');
            $('patternIssues').value = String(pattern.knownIssuesMarkdown || '');
            setActivePatternId('');
            showPatternEditor(true);
            renderSelectedPattern({
              ...pattern,
              id: '',
              name: (pattern.name || 'Pattern') + ' copy',
              updatedAt: new Date().toISOString(),
            });
            setBanner('ok', 'Pattern copied into the editor as a new draft.');
            return;
          }
          selectPatternById(patternId);
        });
      }

      connectionsBoard.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const emptyAction = target.getAttribute('data-empty-action');
        if (emptyAction === 'new-connection') {
          clearConnectionForm();
          showSurface(connectionComposer, true);
          setConnectionsSubview('setup');
          return;
        }
        const editId = target.getAttribute('data-connection-edit');
        const captureId = target.getAttribute('data-connection-capture');
        const deleteId = target.getAttribute('data-connection-delete');
        const cardId = target.closest('[data-connection-id]')?.getAttribute('data-connection-id');
        const connectionId = editId || captureId || deleteId || cardId;
        if (!connectionId) return;
        if (deleteId) {
          const approved = window.confirm('Delete this connection and its stored artifacts?');
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
      setRunsSubview('settings');
      syncRuntimeCheckboxes();
      loadSessionSummary();
      loadLlmKeys();
      loadApiKeys();
      loadConnections();
      loadPatterns();
      loadRuntimeSettings();

      $('newLlmKey').onclick = () => {
        showLlmComposer(true);
      };

      $('cancelLlmComposer').onclick = () => {
        $('llmApiKey').value = '';
        $('llmKeyName').value = '';
        showLlmComposer(false);
      };

      $('createLlmKey').onclick = async () => {
        const name = requireText('llmKeyName', 'Key name');
        if (!name) return;
        const apiKeyValue = requireText('llmApiKey', 'OpenAI API key');
        if (!apiKeyValue) return;
        const data = await api('/api/llm-keys', 'POST', {
          provider: $('llmProvider').value,
          name,
          apiKey: apiKeyValue,
          activate: true,
        });
        $('llmApiKey').value = '';
        $('llmKeyName').value = '';
        print(out.llm, data);
        if (data.ok) {
          await loadLlmKeys();
          showLlmComposer(false);
        }
      };

      $('listLlmKeys').onclick = loadLlmKeys;

      $('newApiKey').onclick = () => {
        showKeyComposer(true);
      };

      $('cancelKeyComposer').onclick = () => {
        $('keyName').value = '';
        setSelectedConnectionScopeIds([]);
        showKeyComposer(false);
      };

      $('createKey').onclick = async () => {
        const name = requireText('keyName', 'Key name');
        if (!name) return;
        const allowedConnectionIds = collectSelectedConnectionIds();
        const data = await api('/api/keys', 'POST', {
          name,
          allowedConnectionIds,
        });

        if (data.ok && data.body?.secret) {
          $('oneTimeKeyServerUrl').value = window.location.origin + '/mcp';
          $('oneTimeKeyValue').value = String(data.body.secret);
          const safe = { ...data, body: { ...data.body } };
          delete safe.body.secret;
          print(out.keys, safe);
          setBanner('ok', 'API key created. Copy and store the one-time key now.');
          $('keyName').value = '';
          setSelectedConnectionScopeIds([]);
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
        clearPatternForm();
        showPatternEditor(true);
        renderPatternCards(state.patterns);
        setBanner('ok', 'Pattern editor reset for a new entry.');
      };

      $('cancelPatternEditor').onclick = () => {
        clearPatternForm();
      };

      $('savePattern').onclick = async () => {
        const name = requireText('patternName', 'Pattern name');
        if (!name) return;
        const stepsMarkdown = requireText('patternSteps', 'Stepwise guide');
        if (!stepsMarkdown) return;
        const patternId = String($('patternId').value || '').trim();
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
          setActivePatternId(nextId);
          await loadPatterns();
          if (nextId) {
            selectPatternById(nextId);
          }
          setBanner('ok', patternId ? 'Pattern updated.' : 'Pattern created.');
        }
      };
      $('deletePattern').onclick = async () => {
        const patternId = String($('patternId').value || '').trim();
        if (!patternId) {
          setBanner('err', 'Select a pattern card before deleting it.');
          return;
        }
        const approved = window.confirm('Delete this orchestration pattern?');
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

      $('openManualConnectionAccess').onclick = async () => {
        if (!state.selectedConnectionId) {
          setBanner('err', 'Select a connection first.');
          return;
        }
        setConnectionsSubview('access');
        await refreshConnectionArtifacts();
      };

      $('newConnection').onclick = () => {
        clearConnectionForm();
        showSurface(connectionComposer, true);
        setConnectionsSubview('setup');
        renderConnectionsBoard(state.connections);
        setBanner('ok', 'Connection form reset for a new entry.');
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
          const startCaptureNow = window.confirm('Connection created. Start guided auth capture now?');
          if (startCaptureNow && data.body?.connection?.id) {
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
          const approved = window.confirm('Delete this stored run?');
          if (!approved) return;
          const data = await api('/api/runs/' + encodeURIComponent(deleteId), 'DELETE');
          print(out.runDetail, data);
          if (data.ok) {
            closeModal(runDetailModal);
            await loadRuns();
          }
        }
      });

      [oneTimeKeyModal, runDetailModal].forEach((modal) => {
        modal?.addEventListener('click', (event) => {
          if (event.target === modal) {
            closeModal(modal);
          }
        });
      });
    </script>
  </body>
</html>
`;
