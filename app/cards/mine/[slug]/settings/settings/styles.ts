/**
 * app/cards/mine/[slug]/settings/settings/styles.ts — Scoped CSS for
 * the owner-facing webhook settings page.
 *
 * Extracted from the inline `<style jsx>` block in page.tsx per
 * ARCHITECTURE.md Rule 1. The `st-*` class prefix is unique to this
 * route, so global injection is safe.
 */

export const SETTINGS_STYLES = `
  .st-root {
    max-width: 1000px;
    margin: 0 auto;
    padding: 3rem 1.5rem 5rem;
  }
  .st-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }
  .st-head h1 {
    margin: 0.25rem 0;
    font-size: 2rem;
  }
  .st-crumb a {
    color: inherit;
    opacity: 0.7;
    text-decoration: none;
    font-size: 0.9rem;
  }
  .st-crumb a:hover { opacity: 1; }
  .st-sub { opacity: 0.65; margin: 0.25rem 0 0; font-size: 0.9rem; }
  .st-action {
    color: inherit;
    text-decoration: none;
    padding: 0.6rem 1.2rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    font-size: 0.9rem;
  }
  .st-section {
    margin-bottom: 3rem;
  }
  .st-section h2 {
    font-size: 1.2rem;
    margin: 0 0 0.5rem;
  }
  .st-help {
    opacity: 0.7;
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 1rem;
  }
  .st-help code {
    background: rgba(255, 255, 255, 0.08);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    font-size: 0.85em;
  }
  .st-label {
    display: block;
    font-size: 0.85rem;
    opacity: 0.85;
    margin-bottom: 1rem;
  }
  .st-input {
    display: block;
    width: 100%;
    margin-top: 0.4rem;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.5rem;
    color: inherit;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
    font-size: 0.9rem;
  }
  .st-checks {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .st-check {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.85rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .st-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .st-btn-primary,
  .st-btn,
  .st-btn-danger {
    padding: 0.6rem 1.1rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid currentColor;
    background: transparent;
    color: inherit;
  }
  .st-btn-primary {
    background: #ff6fb5;
    color: white;
    border-color: #ff6fb5;
  }
  .st-btn-danger {
    color: #ff8585;
  }
  .st-btn-small {
    padding: 0.3rem 0.7rem;
    margin-left: 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    background: transparent;
    color: inherit;
    border: 1px solid currentColor;
    cursor: pointer;
  }
  .st-secret {
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(255, 193, 7, 0.08);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 0.5rem;
    font-size: 0.9rem;
  }
  .st-secret strong {
    display: block;
    margin-bottom: 0.5rem;
  }
  .st-secret code {
    display: block;
    margin: 0.5rem 0;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
    font-size: 0.85em;
    word-break: break-all;
  }
  .st-log {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .st-log-item {
    display: grid;
    grid-template-columns: 20px minmax(120px, 160px) 1fr auto;
    gap: 0.5rem;
    align-items: center;
    padding: 0.6rem 0.85rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0.5rem;
    font-size: 0.85rem;
  }
  .st-log-item.ok { border-left: 3px solid #4caf50; }
  .st-log-item.fail { border-left: 3px solid #ff5252; }
  .st-log-status { font-weight: 700; }
  .st-log-meta,
  .st-log-time { opacity: 0.6; font-size: 0.8rem; }
  .st-log-error {
    grid-column: 1 / -1;
    opacity: 0.75;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
    font-size: 0.75rem;
    padding-left: 28px;
  }
  .st-code {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.5rem;
    padding: 1rem;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
    font-size: 0.8rem;
    overflow-x: auto;
    line-height: 1.45;
  }
  .st-toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 0.7rem 1.3rem;
    border-radius: 999px;
    font-size: 0.85rem;
    z-index: 99;
  }
`;
