/**
 * app/cards/mine/[slug]/leads/leads/styles.ts — Scoped CSS for the
 * owner-facing leads table + enrichment detail rows + toast.
 *
 * Extracted from the inline `<style jsx>` block in page.tsx per
 * ARCHITECTURE.md Rule 1. The `lm-*` class prefix is unique to this
 * route, so global injection is safe.
 */

export const LEADS_STYLES = `
  .lm-root {
    max-width: 1400px;
    margin: 0 auto;
    padding: 3rem 1.5rem 5rem;
  }
  .lm-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }
  .lm-head h1 {
    margin: 0.25rem 0;
    font-size: 2rem;
  }
  .lm-crumb a {
    color: inherit;
    opacity: 0.7;
    text-decoration: none;
    font-size: 0.9rem;
  }
  .lm-crumb a:hover {
    opacity: 1;
  }
  .lm-sub {
    opacity: 0.65;
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    max-width: 38rem;
  }
  .lm-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .lm-action {
    background: transparent;
    color: inherit;
    border: 1px solid rgba(255, 255, 255, 0.25);
    padding: 0.6rem 1.2rem;
    border-radius: 999px;
    text-decoration: none;
    font-size: 0.9rem;
    cursor: pointer;
  }
  .lm-empty {
    padding: 3rem 2rem;
    text-align: center;
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
  }
  .lm-empty-tip {
    opacity: 0.65;
    max-width: 32rem;
    margin: 1rem auto 0;
    font-size: 0.9rem;
  }
  .lm-empty-tip a {
    color: inherit;
  }
  .lm-table-wrap {
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.75rem;
  }
  .lm-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  .lm-table th,
  .lm-table td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    vertical-align: top;
  }
  .lm-table th {
    background: rgba(255, 255, 255, 0.03);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
  }
  .lm-message {
    max-width: 30rem;
    white-space: pre-wrap;
  }
  .lm-faint {
    opacity: 0.4;
  }
  .lm-ai {
    white-space: nowrap;
  }
  .lm-table code {
    background: rgba(255, 255, 255, 0.08);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-size: 0.85em;
  }
  .lm-enrich {
    background: rgba(255, 111, 181, 0.12);
    color: inherit;
    border: 1px solid rgba(255, 111, 181, 0.4);
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.78rem;
    cursor: pointer;
    white-space: nowrap;
  }
  .lm-enrich:hover:not(:disabled) {
    background: rgba(255, 111, 181, 0.2);
  }
  .lm-enrich:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .lm-badge {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: inherit;
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    font-size: 0.78rem;
    cursor: pointer;
    white-space: nowrap;
    max-width: 9rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lm-conf-high {
    border-color: rgba(0, 200, 130, 0.4);
  }
  .lm-conf-medium {
    border-color: rgba(255, 193, 7, 0.4);
  }
  .lm-conf-low {
    border-color: rgba(255, 82, 82, 0.35);
  }
  .lm-enrich-detail {
    background: rgba(255, 111, 181, 0.04);
  }
  .lm-enrich-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem 1.5rem;
    padding: 0.5rem 0 1rem;
  }
  .lm-enrich-grid strong {
    display: block;
    font-size: 0.7rem;
    opacity: 0.55;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }
  .lm-enrich-grid > div {
    font-size: 0.88rem;
    line-height: 1.45;
  }
  .lm-enrich-wide {
    grid-column: 1 / -1;
  }
  .lm-enrich-note {
    color: #ffcc66;
  }
  .lm-enrich-grid ul {
    margin: 0;
    padding-left: 1.25rem;
  }
  .lm-enrich-grid li {
    margin-bottom: 0.35rem;
  }
  .lm-link {
    font-size: 0.82rem;
    opacity: 0.75;
    color: inherit;
  }
  .lm-link:hover {
    opacity: 1;
  }
  .lm-enrich-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  .lm-mini-btn {
    background: transparent;
    color: inherit;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    font-size: 0.78rem;
    cursor: pointer;
  }
  .lm-mini-btn:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  .lm-mini-danger {
    border-color: rgba(255, 82, 82, 0.3);
    color: #ff8585;
  }
  .lm-conf-label {
    margin-left: auto;
    opacity: 0.65;
    font-size: 0.78rem;
  }
  .lm-warn {
    margin-top: 1rem;
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid rgba(255, 193, 7, 0.3);
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.85rem;
  }
  .lm-toast {
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
